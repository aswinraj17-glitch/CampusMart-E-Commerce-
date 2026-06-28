import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear any existing tables
  await prisma.meetup.deleteMany({});
  await prisma.exchangeRequest.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chat.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.collegeVerification.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const unverifiedPassword = await bcrypt.hash('test1234', 10);

  const buyer = await prisma.user.create({
    data: {
      name: 'Ashwin Buyer',
      email: 'buyer@campusmart.com',
      password: buyerPassword,
      role: 'buyer',
      phone: '9876543210',
      department: 'Computer Science',
      semester: 4,
      verificationStatus: 'Verified',
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: 'Rahul Seller',
      email: 'seller@campusmart.com',
      password: sellerPassword,
      role: 'seller',
      phone: '8765432109',
      department: 'Electronics',
      semester: 6,
      verificationStatus: 'Verified',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@campusmart.com',
      password: adminPassword,
      role: 'admin',
      phone: '7654321098',
      verificationStatus: 'Verified',
    },
  });

  const unverified = await prisma.user.create({
    data: {
      name: 'Karan Newbie',
      email: 'unverified@campusmart.com',
      password: unverifiedPassword,
      role: 'buyer',
      phone: '6543210987',
      department: 'Mechanical',
      semester: 2,
      verificationStatus: 'Pending',
    },
  });

  console.log('✅ Users seeded');

  // 2. Create Verification details
  await prisma.collegeVerification.createMany({
    data: [
      {
        userId: buyer.id,
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        department: 'B.E. Computer Science & Engineering (CSE)',
        yearOfStudy: 2,
        collegeEmail: 'ashwin@shanmugha.edu.in',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
        status: 'Verified',
      },
      {
        userId: seller.id,
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        department: 'B.E. Electronics & Communication Engineering (ECE)',
        yearOfStudy: 3,
        collegeEmail: 'rahul@shanmugha.edu.in',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
        status: 'Verified',
      },
      {
        userId: unverified.id,
        collegeName: 'PSG College of Technology, Coimbatore',
        department: 'B.E. Mechanical Engineering (Mech)',
        yearOfStudy: 1,
        collegeEmail: 'karan@psgtech.edu',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
        status: 'Pending',
      },
    ],
  });

  console.log('✅ Verifications seeded');

  // 3. Create Categories
  const electronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const books = await prisma.category.create({ data: { name: 'Books & Study Materials' } });
  const apparel = await prisma.category.create({ data: { name: 'Apparel & Lab Coats' } });
  const sports = await prisma.category.create({ data: { name: 'Sports & Recreation' } });
  const stationery = await prisma.category.create({ data: { name: 'Stationery' } });

  console.log('✅ Categories seeded');

  // 4. Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Apple MacBook Air M2 Laptop',
        description: 'Intel i5 / Apple M2 comparable, 8GB RAM, 256GB SSD storage. Space Grey. 1 year old, zero scratches. Perfect for coding, department assignments, and ML labs.',
        price: 68000.00,
        imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
          'https://images.unsplash.com/photo-1611186871081-0f2c25670868?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Sell',
        department: 'B.E. Computer Science & Engineering (CSE)',
        semester: 4,
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'Introduction to Algorithms (CLRS) 4th Ed',
        description: '4th Edition core textbook for computer science. paperback. Great for learning Data Structures and Algorithms. Donating for free to any junior who is taking the DSA course.',
        price: 0.00,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Donate',
        department: 'B.E. Computer Science & Engineering (CSE)',
        semester: 4,
        categoryId: books.id,
        sellerId: seller.id,
      },
      {
        name: 'Casio fx-991EX Scientific Calculator',
        description: 'Scientific calculator. Perfect condition. Battery replaced last month. Looking to sell or exchange for 1st-semester books.',
        price: 950.00,
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Exchange',
        department: 'B.E. Electronics & Communication Engineering (ECE)',
        semester: 6,
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'Sony WH-1000XM4 Noise Cancelling Headphones',
        description: 'Active Noise Cancelling headphones. Perfect for studying in noisy hostel blocks. Excellent condition. 30 hours battery backup.',
        price: 11500.00,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'SellOrExchange',
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'Engineering Graphics Mini-Drafter & Board',
        description: 'Wooden drawing board with mini-drafter. Essential for first-year engineering drawing classes.',
        price: 750.00,
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Sell',
        categoryId: stationery.id,
        sellerId: seller.id,
      },
      {
        name: 'Standard White Lab Coat',
        description: 'Standard white chemistry/biotech lab coat, size L. Free donation for incoming biotechnology freshmen.',
        price: 0.00,
        imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500'
        ]),
        condition: 'New',
        collegeName: 'PSG College of Technology, Coimbatore',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Donate',
        department: 'B.Tech. Biotechnology',
        semester: 1,
        categoryId: apparel.id,
        sellerId: seller.id,
      },
      {
        name: 'Hero Kyoto 26T Single Speed Mountain Bicycle',
        description: 'Durable single speed bicycle. Perfect for riding daily between hostel blocks, campus library, and department buildings.',
        price: 2900.00,
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Madras Institute of Technology (MIT), Chromepet',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Sell',
        categoryId: sports.id,
        sellerId: seller.id,
      },
      {
        name: 'Apple iPad 9th Gen (WiFi, 64GB)',
        description: 'Perfect for taking digital notes in lectures. Comes with a compatible active stylus pencil, protective case, and charger. No scratches, display is perfect.',
        price: 18500.00,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Aswin - 9876543210',
        listingType: 'Sell',
        department: 'B.E. Computer Science & Engineering (CSE)',
        semester: 3,
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'HP LaserJet Pro Monochrome Printer',
        description: 'Hostel room essential. Print all your lab records, seminar reports, and assignments yourself. High speed, extremely cheap toner replacement.',
        price: 4200.00,
        imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Aswin - 9876543210',
        listingType: 'Sell',
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'Prestige 1.5L Cordless Electric Kettle',
        description: 'Ideal for late-night hostel study sessions. Boil water, make green tea, coffee, or instant noodles in seconds. Auto-shutoff safety feature.',
        price: 650.00,
        imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500'
        ]),
        condition: 'New',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Suresh - 7654321098',
        listingType: 'SellOrExchange',
        categoryId: electronics.id,
        sellerId: seller.id,
      },
      {
        name: 'Wildcraft Campus Water-Resistant Backpack',
        description: 'Super durable campus backpack. Three spacious compartments, padded laptop sleeve, side bottle holders. Water-resistant material, perfect for monsoons.',
        price: 850.00,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Suresh - 7654321098',
        listingType: 'Sell',
        categoryId: apparel.id,
        sellerId: seller.id,
      },
      {
        name: 'Black Slim-Fit placement Blazer (Size M)',
        description: 'Premium black formal blazer for campus placements, interviews, and department seminars. Worn only twice, dry-cleaned, brand-new condition.',
        price: 1800.00,
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Vijay - 6543210987',
        listingType: 'Sell',
        categoryId: apparel.id,
        sellerId: seller.id,
      },
      {
        name: 'Yonex Carbonex 8000 Light Badminton Racket',
        description: 'Graphite badminton racket for evening hostel games. Lightweight design with high tension stringing. Includes protective zipper head cover.',
        price: 1200.00,
        imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Vijay - 6543210987',
        listingType: 'SellOrExchange',
        categoryId: sports.id,
        sellerId: seller.id,
      },
      {
        name: 'Staedtler Mars Lumograph Drawing Pencils Set',
        description: 'Complete set of 12 premium quality drawing pencils (12B to 2H). Essential for first-year Engineering Graphics (EG) drawing class. 90% lead remaining.',
        price: 250.00,
        imageUrl: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687c?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1519750783826-e2420f4d687c?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Donate',
        department: 'B.E. Mechanical Engineering (Mech)',
        semester: 1,
        categoryId: stationery.id,
        sellerId: seller.id,
      },
      {
        name: 'Philips LED Desk Study Lamp',
        description: 'Adjustable gooseneck study lamp. Padded heavy base, cool daylight LED bulb included. Reduces eye strain during late-night exam preparations.',
        price: 490.00,
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'
        ]),
        condition: 'Used',
        collegeName: 'Sri Shanmugha College of Engineering and Technology, Salem',
        contactDetails: 'Rahul - 8765432109',
        listingType: 'Sell',
        categoryId: electronics.id,
        sellerId: seller.id,
      }
    ],
  });

  console.log('✅ Products seeded');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
