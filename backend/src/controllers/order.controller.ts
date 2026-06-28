import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrder = async (req: any, res: Response) => {
  const userId = req.user.id;
  const {
    fullName,
    phone,
    email,
    addressLine,
    city,
    state,
    zipCode,
    paymentMethod,
    items,
    meetupOption,
    meetupLocation,
    meetupDate,
    meetupTime
  } = req.body;

  if (!fullName || !phone || !email || !addressLine || !city || !state || !zipCode || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'All shipping details and items array are required' });
  }

  try {
    // Fetch buyer college verification info
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      include: { collegeverification: true }
    });

    const buyerCollege = buyer?.collegeverification?.collegeName;

    // 1. Fetch product prices and details to calculate total
    const dbProducts = await Promise.all(
      items.map(it => prisma.product.findUnique({ where: { id: Number(it.productId) } }))
    );

    let total = new Prisma.Decimal(0);
    let isCrossCollege = false;

    const orderItemsData = items.map((it, idx) => {
      const prod = dbProducts[idx];
      if (!prod) {
        throw new Error(`Product with ID ${it.productId} not found`);
      }

      if (prod.collegeName && buyerCollege && prod.collegeName.toLowerCase() !== buyerCollege.toLowerCase()) {
        isCrossCollege = true;
      }

      const itemPrice = new Prisma.Decimal(prod.price as any);
      total = total.add(itemPrice.mul(it.quantity));

      return {
        productId: prod.id,
        quantity: Number(it.quantity),
        productName: prod.name,
        productPrice: prod.price,
        productImage: prod.imageUrl
      };
    });

    // Add ₹40 delivery boy fee if buyer and seller are in different colleges
    if (isCrossCollege) {
      total = total.add(new Prisma.Decimal(40));
    }

    // 2. Start database transaction to create order, save order items, create payment, clear cart, and record meetup details
    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          userId,
          status: 'Order Placed',
          totalAmount: total,
          fullName,
          phone,
          email,
          addressLine,
          city,
          state,
          zipCode,
          deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days estimate
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      // Create Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: paymentMethod || 'COD',
          amount: total,
          status: paymentMethod === 'Card' || paymentMethod === 'UPI' ? 'Completed' : 'Pending',
          transactionId: 'TXN-' + Math.floor(Math.random() * 1000000000)
        }
      });

      // Create Meetup Spot Record if meetupOption provided
      if (meetupOption) {
        await tx.meetup.create({
          data: {
            orderId: order.id,
            option: meetupOption,
            location: meetupLocation || 'Main Campus Entrance',
            date: meetupDate || '',
            time: meetupTime || ''
          }
        });
      }

      // Clear User Cart if exists
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return order;
    });

    // Reload with items, payments, and meetup details
    const fullOrderDetails = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        items: true,
        payments: true,
        meetup: true
      }
    });

    res.status(201).json(fullOrderDetails);
  } catch (error: any) {
    console.error('Checkout/Order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
};

export const getUserOrders = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: true,
        meetup: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format decimals
    const formattedOrders = orders.map(ord => ({
      ...ord,
      totalAmount: Number(ord.totalAmount),
      items: ord.items.map(it => ({
        ...it,
        productPrice: Number(it.productPrice)
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
};

export const getOrderById = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
        payments: true,
        meetup: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Auth verification: must be buyer, seller of a product, or admin
    if (order.userId !== userId && role !== 'admin') {
      const prodIds = order.items.map(it => it.productId);
      const sellerProducts = await prisma.product.findMany({
        where: {
          id: { in: prodIds },
          sellerId: userId
        }
      });
      if (sellerProducts.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to view this order' });
      }
    }

    const formattedOrder = {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map(it => ({
        ...it,
        productPrice: Number(it.productPrice)
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

export const updateOrderStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  const validStatuses = [
    'Order Placed',
    'Seller Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify permission: must be admin, or the seller of products inside the order
    if (role !== 'admin') {
      const prodIds = order.items.map(it => it.productId);
      const sellerProducts = await prisma.product.findMany({
        where: {
          id: { in: prodIds },
          sellerId: userId
        }
      });
      if (sellerProducts.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to modify order status' });
      }
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: { items: true, payments: true, meetup: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const getSellerIncomingOrders = async (req: any, res: Response) => {
  const sellerId = req.user.id;

  try {
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId }
    });
    const sellerProductIds = sellerProducts.map(p => p.id);

    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            productId: { in: sellerProductIds }
          }
        }
      },
      include: {
        items: {
          where: {
            productId: { in: sellerProductIds }
          }
        },
        payments: true,
        meetup: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(ord => ({
      ...ord,
      totalAmount: Number(ord.totalAmount),
      items: ord.items.map(it => ({
        ...it,
        productPrice: Number(it.productPrice)
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching seller incoming orders:', error);
    res.status(500).json({ error: 'Failed to fetch incoming orders' });
  }
};
