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
  const manualProducts = [
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
      description: 'Active Noise Cancelling headphones. Perfect for studying in hostel blocks. Excellent condition. 30 hours battery backup.',
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
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500'
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
  ];

  const categoriesTemplates = [
    {
      id: electronics.id,
      templates: [
        { name: 'Lenovo ThinkPad L14 Gen 2 Laptop', desc: 'Intel Core i5, 16GB RAM, 512GB SSD. Built tough for programming, database courses, and final year projects. Great battery life.', price: 24500, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500' },
        { name: 'Redmi 20000mAh Power Bank (18W Fast Charging)', desc: 'Dual output charging ports, ideal for student travels and long lecture days. Charges your phone 4 times fully.', price: 1100, img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500' },
        { name: 'Logitech Wireless Keyboard & Mouse Combo MK220', desc: 'Compact wireless set. 1 year old, batteries included. Perfect desktop addition for laptop coding setups.', price: 990, img: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500' },
        { name: 'Seagate Backup Plus 1TB External Hard Drive', desc: 'Backup all your college study drives, syllabus resources, books, and software setups. USB 3.0 support.', price: 2300, img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500' },
        { name: 'Arduino Uno Starter Project Kit with Sensors', desc: 'Breadboard, jumper cables, resistors, ultrasonic sensor, IR remote, active buzzer, and LEDs. Perfect for EEE/ECE/CSE labs.', price: 650, img: 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=500' },
        { name: 'Raspberry Pi 4 Model B (4GB RAM) Complete kit', desc: 'High performance micro-computer. Comes with official red-white case, charger, and a preloaded 32GB MicroSD card.', price: 3950, img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500' },
        { name: 'Prestige 1.8L Electric Multicooker & Kettle', desc: 'Essential hostel room cooking appliance. Boil milk, cook instant noodles, eggs, or oatmeal in minutes.', price: 850, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500' },
        { name: 'Bajaj Majesty DX-7 Dry Iron Box', desc: 'Lightweight non-stick dry iron box. Essential for keeping placement formal outfits crisp and ready.', price: 450, img: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=500' }
      ]
    },
    {
      id: books.id,
      templates: [
        { name: 'Engineering Mathematics by BS Grewal 44th Edition', desc: 'Standard mathematics reference textbook for semesters 1 to 4. Clean pages, no highlights or pen marks.', price: 690, img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500' },
        { name: 'Data Communications and Networking by Behrouz A. Forouzan', desc: 'Comprehensive core textbook for Computer Networks course. Clear diagrams and detailed explanations.', price: 540, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500' },
        { name: 'Database System Concepts by Abraham Silberschatz 7th Ed', desc: 'Best book for relational model concepts, SQL queries, transaction management, and indexing.', price: 590, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500' },
        { name: 'GATE 2026 CSE solved Papers Prep Guide', desc: 'Last 15 years chapter-wise solved questions with complete logical explanations. Highly recommended.', price: 390, img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500' },
        { name: 'Quantitative Aptitude by R.S. Aggarwal (S. Chand)', desc: 'Must-have prep book for campus recruitment drives, bank exams, and competitive aptitude test rounds.', price: 420, img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500' },
        { name: 'Atomic Habits by James Clear (Paperback)', desc: 'Bestselling self-help book. Ideal reading for students wishing to optimize study routines and screen time.', price: 290, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500' }
      ]
    },
    {
      id: apparel.id,
      templates: [
        { name: 'Premium Navy Blue placement Suit Blazer (Size L)', desc: 'Rich fabric dark navy placement blazer. Fit for pre-placement talks, interviews, and project presentations.', price: 1850, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500' },
        { name: 'Thick Cotton Chemistry Lab Coat / Apron (Size M)', desc: 'Standard white chemistry laboratory apron with long sleeves and dual pockets. Used for organic labs.', price: 190, img: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500' },
        { name: 'Waterproof Foldable Raincoat / Suit', desc: 'High-quality double layered polyester raincoat with trouser. Protects laptop bags during heavy monsoon days.', price: 550, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' }
      ]
    },
    {
      id: sports.id,
      templates: [
        { name: 'Yonex Voltric 0.5DG Badminton Racket', desc: 'Full graphite badminton racket. High tension, powerful smash control. Selling as I am graduating this month.', price: 1450, img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500' },
        { name: 'Nivia Classic Black & White Football (Size 5)', desc: 'Standard size hand-stitched TPU leather football. Perfect for playing on turf or college fields.', price: 490, img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500' },
        { name: 'Nivia Heavy Weight Yellow Tennis Balls (Pack of 3)', desc: 'High bounce, highly durable rubber tennis balls. Ideal for campus hostel hallway games.', price: 150, img: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=500' }
      ]
    },
    {
      id: stationery.id,
      templates: [
        { name: 'Staedtler Geometric Compass Drawing Set', desc: 'Precision compass kit with adjustment wheel. Excellent for engineering drawing sheets.', price: 290, img: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500' },
        { name: 'Staedtler Acrylic Drawing Set Squares (Set of 2)', desc: 'Professional acrylic set squares with clear degree graduations. Used in drafting/graphics class.', price: 180, img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500' },
        { name: 'Parker Vector Black Matte Fountain Pen', desc: 'Matte black premium ink pen. Excellent styling for writing exams or lab logs.', price: 390, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500' }
      ]
    }
  ];

  const collegesList = [
    'Sri Shanmugha College of Engineering and Technology, Salem',
    'College of Engineering, Guindy (CEG), Chennai',
    'Madras Institute of Technology (MIT), Chromepet',
    'PSG College of Technology, Coimbatore',
    'SSN College of Engineering, Chennai',
    'Government College of Engineering, Salem'
  ];

  const DEPARTMENTS = [
    'B.E. Computer Science & Engineering (CSE)',
    'B.Tech. Information Technology (IT)',
    'B.E. Electronics & Communication Engineering (ECE)',
    'B.E. Electrical & Electronics Engineering (EEE)',
    'B.E. Mechanical Engineering (Mech)',
    'B.E. Civil Engineering (Civil)',
    'B.Tech. Biotechnology',
    'B.Tech. Artificial Intelligence & Data Science (AI&DS)',
    'B.Sc. Computer Science',
    'BCA (Computer Applications)',
    'B.Com. (General Commerce)',
    'B.Pharm. (Bachelor of Pharmacy)'
  ];

  const productsList = [...manualProducts];

  // Programmatically generate another 85 products to reach a total of exactly 100 products
  for (let i = 1; i <= 85; i++) {
    // Pick category randomly
    const catChoice = categoriesTemplates[Math.floor(Math.random() * categoriesTemplates.length)];
    // Pick template randomly
    const template = catChoice.templates[Math.floor(Math.random() * catChoice.templates.length)];
    
    // Choose listing type randomly: 60% Sell, 20% Exchange, 20% Donate
    const randType = Math.random();
    const listingType = randType < 0.6 ? 'Sell' : (randType < 0.8 ? 'Exchange' : 'Donate');
    
    // Set price based on listing type
    const price = (listingType === 'Donate' || listingType === 'Exchange') ? 0.00 : 
      Math.round(template.price * (0.8 + Math.random() * 0.4)); // slight price variance
      
    // Set college: 60% Salem, remaining split across other colleges
    const collegeName = Math.random() < 0.6 ? 
      'Sri Shanmugha College of Engineering and Technology, Salem' : 
      collegesList[Math.floor(Math.random() * collegesList.length)];
      
    const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
    const sem = Math.floor(Math.random() * 8) + 1;
    const cond = Math.random() < 0.85 ? 'Used' : 'New';

    productsList.push({
      name: `${template.name} - Batch #${i}`,
      description: `${template.desc} Pre-owned by student, in standard campus conditions. Contact for immediate campus meetups.`,
      price,
      imageUrl: template.img,
      imagesJson: JSON.stringify([template.img]),
      condition: cond,
      collegeName,
      contactDetails: `Student - 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      listingType,
      department: dept,
      semester: sem,
      categoryId: catChoice.id,
      sellerId: seller.id
    });
  }

  await prisma.product.createMany({
    data: productsList
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
