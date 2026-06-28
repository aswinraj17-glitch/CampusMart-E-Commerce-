import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllProducts = async (req: Request, res: Response) => {
  const { 
    categoryId, 
    search, 
    minPrice, 
    maxPrice, 
    condition, 
    sortBy, 
    page, 
    limit,
    listingType,
    department,
    semester,
    collegeName,
    userCollegeName
  } = req.query;

  // Filter conditions
  const where: any = {
    isAvailable: true // only display active available listings
  };

  if (categoryId) {
    where.categoryId = Number(categoryId);
  }

  if (listingType) {
    where.listingType = String(listingType);
  }

  if (department) {
    where.department = String(department);
  }

  if (semester) {
    where.semester = Number(semester);
  }

  if (collegeName) {
    where.collegeName = String(collegeName);
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { description: { contains: String(search) } },
      { collegeName: { contains: String(search) } },
      { department: { contains: String(search) } },
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (condition) {
    where.condition = String(condition);
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' }; // default newest
  if (sortBy === 'priceAsc') {
    orderBy = { price: 'asc' };
  } else if (sortBy === 'priceDesc') {
    orderBy = { price: 'desc' };
  } else if (sortBy === 'name') {
    orderBy = { name: 'asc' };
  }

  // Pagination
  const p = Number(page) || 1;
  const l = Number(limit) || 12;
  const skip = (p - 1) * l;

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: l,
        include: {
          category: true,
          seller: {
            select: { id: true, name: true, email: true, phone: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Convert decimal prices to numbers for JSON compatibility
    let formattedProducts = products.map(prod => ({
      ...prod,
      price: Number(prod.price),
    }));

    // Prioritize own college first if userCollegeName provided
    if (userCollegeName) {
      formattedProducts.sort((a, b) => {
        const aMatch = a.collegeName?.toLowerCase() === String(userCollegeName).toLowerCase();
        const bMatch = b.collegeName?.toLowerCase() === String(userCollegeName).toLowerCase();
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    res.json({
      products: formattedProducts,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, email: true, phone: true }
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Format Decimal fields
    const formattedProduct = {
      ...product,
      price: Number(product.price),
      reviews: product.reviews.map(rev => ({
        ...rev,
      })),
    };

    res.json(formattedProduct);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

export const createProduct = async (req: any, res: Response) => {
  const { 
    name, 
    description, 
    price, 
    imageUrl, 
    imagesJson,
    condition, 
    collegeName, 
    contactDetails, 
    categoryId, 
    listingType, 
    department, 
    semester 
  } = req.body;
  const sellerId = req.user.id;

  if (!name || price === undefined || !categoryId) {
    return res.status(400).json({ error: 'Name, price, and categoryId are required' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        imageUrl: imageUrl || '',
        imagesJson: imagesJson || null,
        condition: condition || 'New',
        collegeName: collegeName || null,
        contactDetails: contactDetails || null,
        listingType: listingType || 'Sell',
        department: department || null,
        semester: semester ? Number(semester) : null,
        categoryId: Number(categoryId),
        sellerId,
      },
    });

    // Triggers notification for users who have similar products in their wishlist
    const similarWishlist = await prisma.wishlist.findMany({
      where: {
        product: {
          OR: [
            { name: { contains: name } },
            { categoryId: Number(categoryId) }
          ]
        }
      }
    });

    const notifiedUserIds = new Set<number>();
    for (const item of similarWishlist) {
      if (item.userId !== sellerId && !notifiedUserIds.has(item.userId)) {
        notifiedUserIds.add(item.userId);
        await prisma.notification.create({
          data: {
            userId: item.userId,
            title: 'Wishlist Alert!',
            message: `A new product "${name}" matching your wishlist items has been listed on CampusMart for ₹${Number(price)}.`
          }
        });
      }
    }

    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product listing' });
  }
};

export const updateProduct = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, imagesJson, condition, collegeName, contactDetails, categoryId, listingType, department, semester } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify ownership
    if (product.sellerId !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to update this listing' });
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : product.name,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? Number(price) : product.price,
        imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
        imagesJson: imagesJson !== undefined ? imagesJson : product.imagesJson,
        condition: condition !== undefined ? condition : product.condition,
        collegeName: collegeName !== undefined ? collegeName : product.collegeName,
        contactDetails: contactDetails !== undefined ? contactDetails : product.contactDetails,
        listingType: listingType !== undefined ? listingType : product.listingType,
        department: department !== undefined ? department : product.department,
        semester: semester !== undefined ? Number(semester) : product.semester,
        categoryId: categoryId !== undefined ? Number(categoryId) : product.categoryId,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product listing' });
  }
};

export const deleteProduct = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify ownership
    if (product.sellerId !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }

    await prisma.product.delete({ where: { id: Number(id) } });
    res.json({ message: 'Product listing deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product listing' });
  }
};

export const createProductReview = async (req: any, res: Response) => {
  const productId = Number(req.params.id);
  const reviewerId = req.user.id;
  const { rating, comment } = req.body;

  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Creating review, mapping sellerId of reviewed product
    const review = await prisma.review.create({
      data: {
        productId,
        reviewerId,
        sellerId: product.sellerId,
        rating: Number(rating),
        comment: comment || '',
      },
      include: {
        reviewer: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('Error adding product review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};
