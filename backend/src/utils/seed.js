/**
 * Seed Script — Run once to populate initial products and stores
 * Usage: node src/utils/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

// ─── Seed Stores ─────────────────────────────────────────────────
const seedStores = async () => {
  const Store = require('../models/Store');
  const stores = [
    { name: 'DMart', slug: 'dmart', color: '#E30613', type: 'hypermarket', priority: 10 },
    { name: 'Reliance Smart', slug: 'reliance-smart', color: '#0066CC', type: 'supermarket', priority: 9 },
    { name: 'SPAR', slug: 'spar', color: '#009C4F', type: 'supermarket', priority: 8 },
    { name: 'More', slug: 'more', color: '#FF6B00', type: 'supermarket', priority: 7 },
    { name: 'BigBasket', slug: 'bigbasket', color: '#84C225', type: 'online', deliveryTime: 'Next day', priority: 6 },
    { name: 'JioMart', slug: 'jiomart', color: '#0078D4', type: 'online', deliveryTime: '2 hours', priority: 5 },
    { name: 'Blinkit', slug: 'blinkit', color: '#F8CF00', type: 'quick_commerce', deliveryTime: '10 mins', priority: 4 },
    { name: 'Zepto', slug: 'zepto', color: '#9747FF', type: 'quick_commerce', deliveryTime: '10 mins', priority: 3 },
    { name: 'Swiggy Instamart', slug: 'swiggy-instamart', color: '#FC8019', type: 'quick_commerce', deliveryTime: '10 mins', priority: 2 },
  ];
  for (const s of stores) {
    await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
  console.log(`✓ ${stores.length} stores seeded`);
  return stores;
};

// ─── Seed Products ────────────────────────────────────────────────
const seedProducts = async () => {
  const Product = require('../models/Product');

  const products = [
    // Grains & Cereals
    { productName: 'Basmati Rice', brand: 'India Gate', category: 'grains_cereals', quantity: 1, unit: 'kg', tags: ['rice', 'basmati'] },
    { productName: 'Basmati Rice', brand: 'Daawat', category: 'grains_cereals', quantity: 5, unit: 'kg', tags: ['rice', 'basmati'] },
    { productName: 'Sona Masoori Rice', brand: 'Sri Laxmi', category: 'grains_cereals', quantity: 5, unit: 'kg', tags: ['rice'] },
    { productName: 'Toor Dal', brand: 'Tata Sampann', category: 'grains_cereals', quantity: 1, unit: 'kg', tags: ['dal', 'lentil'] },
    { productName: 'Moong Dal', brand: 'Tata Sampann', category: 'grains_cereals', quantity: 500, unit: 'g', tags: ['dal', 'lentil'] },
    { productName: 'Chana Dal', brand: 'Tata Sampann', category: 'grains_cereals', quantity: 1, unit: 'kg', tags: ['dal', 'chana'] },
    { productName: 'Whole Wheat Atta', brand: 'Aashirvaad', category: 'grains_cereals', quantity: 5, unit: 'kg', tags: ['atta', 'flour', 'wheat'] },
    { productName: 'Whole Wheat Atta', brand: 'Pillsbury', category: 'grains_cereals', quantity: 5, unit: 'kg', tags: ['atta', 'flour'] },
    { productName: 'Poha', brand: 'Madhur', category: 'grains_cereals', quantity: 500, unit: 'g', tags: ['poha', 'flattened rice'] },
    { productName: 'Vermicelli', brand: 'Bambino', category: 'grains_cereals', quantity: 200, unit: 'g', tags: ['semiya', 'vermicelli'] },

    // Oils & Fats
    { productName: 'Sunflower Oil', brand: 'Fortune', category: 'oils_fats', quantity: 1, unit: 'l', tags: ['oil', 'sunflower'] },
    { productName: 'Sunflower Oil', brand: 'Saffola', category: 'oils_fats', quantity: 1, unit: 'l', tags: ['oil', 'sunflower'] },
    { productName: 'Groundnut Oil', brand: 'Fortune', category: 'oils_fats', quantity: 1, unit: 'l', tags: ['oil', 'groundnut', 'peanut'] },
    { productName: 'Mustard Oil', brand: 'Patanjali', category: 'oils_fats', quantity: 1, unit: 'l', tags: ['oil', 'mustard'] },
    { productName: 'Coconut Oil', brand: 'Parachute', category: 'oils_fats', quantity: 500, unit: 'ml', tags: ['oil', 'coconut'] },
    { productName: 'Ghee', brand: 'Amul', category: 'oils_fats', quantity: 500, unit: 'g', tags: ['ghee', 'clarified butter'] },
    { productName: 'Butter', brand: 'Amul', category: 'oils_fats', quantity: 500, unit: 'g', tags: ['butter'] },

    // Dairy & Eggs
    { productName: 'Full Cream Milk', brand: 'Amul', category: 'dairy_eggs', quantity: 500, unit: 'ml', tags: ['milk', 'dairy'] },
    { productName: 'Toned Milk', brand: 'Nandini', category: 'dairy_eggs', quantity: 500, unit: 'ml', tags: ['milk', 'dairy'] },
    { productName: 'Curd', brand: 'Amul', category: 'dairy_eggs', quantity: 400, unit: 'g', tags: ['curd', 'yogurt', 'dahi'] },
    { productName: 'Paneer', brand: 'Amul', category: 'dairy_eggs', quantity: 200, unit: 'g', tags: ['paneer', 'cottage cheese'] },
    { productName: 'Eggs', brand: 'Kegg Farms', category: 'dairy_eggs', quantity: 12, unit: 'pcs', tags: ['eggs'] },
    { productName: 'Cheese Slices', brand: 'Amul', category: 'dairy_eggs', quantity: 200, unit: 'g', tags: ['cheese'] },

    // Spices & Masalas
    { productName: 'Iodised Salt', brand: 'Tata', category: 'spices_masalas', quantity: 1, unit: 'kg', tags: ['salt', 'namak'] },
    { productName: 'Turmeric Powder', brand: 'Everest', category: 'spices_masalas', quantity: 200, unit: 'g', tags: ['turmeric', 'haldi'] },
    { productName: 'Red Chilli Powder', brand: 'Everest', category: 'spices_masalas', quantity: 200, unit: 'g', tags: ['chilli', 'mirchi'] },
    { productName: 'Garam Masala', brand: 'MDH', category: 'spices_masalas', quantity: 100, unit: 'g', tags: ['masala', 'spice'] },
    { productName: 'Coriander Powder', brand: 'Everest', category: 'spices_masalas', quantity: 200, unit: 'g', tags: ['coriander', 'dhania'] },
    { productName: 'Cumin Seeds', brand: 'Tata', category: 'spices_masalas', quantity: 100, unit: 'g', tags: ['cumin', 'jeera'] },
    { productName: 'Sugar', brand: 'Madhur', category: 'spices_masalas', quantity: 1, unit: 'kg', tags: ['sugar', 'chini'] },
    { productName: 'Sugar', brand: 'Uttam', category: 'spices_masalas', quantity: 5, unit: 'kg', tags: ['sugar', 'chini'] },

    // Beverages
    { productName: 'Tea Bags', brand: 'Tata Tea Gold', category: 'beverages', quantity: 100, unit: 'pcs', tags: ['tea', 'chai'] },
    { productName: 'CTC Tea', brand: 'Taj Mahal', category: 'beverages', quantity: 500, unit: 'g', tags: ['tea', 'chai'] },
    { productName: 'Instant Coffee', brand: 'Nescafé Classic', category: 'beverages', quantity: 200, unit: 'g', tags: ['coffee', 'nescafe'] },
    { productName: 'Filter Coffee', brand: 'Bru', category: 'beverages', quantity: 200, unit: 'g', tags: ['coffee'] },
    { productName: 'Health Drink', brand: 'Horlicks', category: 'beverages', quantity: 500, unit: 'g', tags: ['health drink', 'horlicks'] },
    { productName: 'Mango Juice', brand: 'Tropicana', category: 'beverages', quantity: 1, unit: 'l', tags: ['juice', 'mango'] },

    // Snacks
    { productName: 'Biscuits Digestive', brand: 'Britannia', category: 'snacks', quantity: 400, unit: 'g', tags: ['biscuit', 'digestive'] },
    { productName: 'Good Day Biscuits', brand: 'Britannia', category: 'snacks', quantity: 250, unit: 'g', tags: ['biscuit', 'good day'] },
    { productName: 'Potato Chips', brand: "Lay's", category: 'snacks', quantity: 52, unit: 'g', tags: ['chips', 'lays', 'snack'] },
    { productName: 'Namkeen Mix', brand: 'Haldiram', category: 'snacks', quantity: 200, unit: 'g', tags: ['namkeen', 'snack'] },
    { productName: 'Maggi Noodles', brand: 'Nestlé', category: 'snacks', quantity: 70, unit: 'g', tags: ['maggi', 'noodles', 'instant'] },
    { productName: 'Maggi Noodles Pack', brand: 'Nestlé', category: 'snacks', quantity: 280, unit: 'g', variant: '4-pack', tags: ['maggi', 'noodles'] },

    // Personal Care
    { productName: 'Toothpaste', brand: 'Colgate MaxFresh', category: 'personal_care', quantity: 150, unit: 'g', tags: ['toothpaste', 'colgate'] },
    { productName: 'Soap', brand: 'Dove', category: 'personal_care', quantity: 100, unit: 'g', tags: ['soap', 'dove'] },
    { productName: 'Shampoo', brand: 'Head & Shoulders', category: 'personal_care', quantity: 340, unit: 'ml', tags: ['shampoo'] },
    { productName: 'Hand Wash', brand: 'Dettol', category: 'personal_care', quantity: 500, unit: 'ml', tags: ['handwash', 'dettol'] },
    { productName: 'Sanitizer', brand: 'Dettol', category: 'personal_care', quantity: 200, unit: 'ml', tags: ['sanitizer'] },

    // Cleaning
    { productName: 'Dish Wash Liquid', brand: 'Vim', category: 'cleaning', quantity: 500, unit: 'ml', tags: ['vim', 'dishwash'] },
    { productName: 'Laundry Detergent', brand: 'Surf Excel', category: 'cleaning', quantity: 1, unit: 'kg', tags: ['detergent', 'surf excel'] },
    { productName: 'Floor Cleaner', brand: 'Lizol', category: 'cleaning', quantity: 500, unit: 'ml', tags: ['floor cleaner', 'lizol'] },
    { productName: 'Toilet Cleaner', brand: 'Harpic', category: 'cleaning', quantity: 500, unit: 'ml', tags: ['toilet cleaner', 'harpic'] },
  ];

  let created = 0;
  for (const p of products) {
    const existing = await Product.findOne({
      productName: p.productName,
      brand: p.brand,
      quantity: p.quantity,
    });
    if (!existing) {
      await Product.create(p);
      created++;
    }
  }
  console.log(`✓ ${created} new products seeded (${products.length - created} already existed)`);
};

// ─── Create admin user ────────────────────────────────────────────
const seedAdmin = async () => {
  const User = require('../models/User');
  const email = process.env.ADMIN_EMAIL || 'admin@smartbasket.in';
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({
      name: 'SmartBasket Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
      isVerified: true,
      city: 'Bengaluru',
    });
    console.log(`✓ Admin user created: ${email}`);
  } else {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    console.log(`✓ Admin user already exists: ${email}`);
  }
};

// ─── Run ──────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await seedStores();
    await seedProducts();
    await seedAdmin();
    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
