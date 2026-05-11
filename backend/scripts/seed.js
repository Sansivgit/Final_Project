/**
 * Seed MongoDB with sample admin, customers, products, and one order.
 * Run: npm run seed   (from backend/)
 *
 * Requires MongoDB running; set Atlas fields or MONGODB_URL in config/appEnv.local.ts.
 */
import '../config/registerEnv.ts';
import mongoose from 'mongoose';
import { resolveMongoConnectionString } from '../config/mongoUri.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const PRODUCTS = [
  {
    title: 'Phantom Runner 1',
    description: 'Lightweight daily trainer with responsive cushioning and breathable upper.',
    price: 129,
    discount: 0,
    clothType: 'Shoes',
    category: 'Unisex',
    brand: 'VOLT',
    stock: 45,
    sizes: ['8', '9', '10', '11'],
    colors: ['Black', 'White'],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  },
  {
    title: 'VOLT Essential Tee',
    description: 'Premium cotton tee with dropped shoulders and minimal branding.',
    price: 42,
    discount: 0,
    clothType: 'Tees',
    category: 'Men',
    brand: 'VOLT',
    stock: 120,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Bone'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  },
  {
    title: 'Arc Hoodie',
    description: 'Midweight fleece hoodie with structured hood and zip pockets.',
    price: 98,
    discount: 10,
    clothType: 'Hoodies',
    category: 'Women',
    brand: 'VOLT',
    stock: 60,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Graphite', 'Sage'],
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
  },
];

async function run() {
  const uri = resolveMongoConnectionString();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Connected:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

  let adminRecord = await Admin.findOne({ email: 'admin@volt.com' });
  if (!adminRecord) {
    adminRecord = await Admin.create({
      name: 'Super Admin',
      email: 'admin@volt.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Created Admin: admin@volt.com / admin123');
  }

  const customerSpecs = [
    { name: 'Alice', email: 'alice@test.com', password: 'password123' },
    { name: 'Bob', email: 'bob@test.com', password: 'password123' },
  ];
  const customers = [];
  for (const c of customerSpecs) {
    let u = await User.findOne({ email: c.email });
    if (!u) {
      u = await User.create({
        name: c.name,
        email: c.email,
        password: c.password,
        role: 'user',
      });
      console.log('Created user:', c.email);
    }
    customers.push(u);
  }

  const productDocs = [];
  for (const p of PRODUCTS) {
    let doc = await Product.findOne({ title: p.title });
    if (!doc) {
      doc = await Product.create(p);
      console.log('Created product:', p.title);
    }
    productDocs.push(doc);
  }

  const existingOrders = await Order.countDocuments();
  if (existingOrders === 0 && customers.length > 0 && productDocs.length > 0) {
    const p = productDocs[0];
    const qty = 1;
    await Order.create({
      user: customers[0]._id,
      orderNumber: `ORD-SEED-${Date.now().toString(36)}`,
      items: [
        {
          product: p._id,
          title: p.title,
          quantity: qty,
          unitPrice: p.price,
        },
      ],
      totalAmount: p.price * qty,
      status: 'paid',
      paymentSummary: 'Seed — development',
    });
    await Product.findByIdAndUpdate(p._id, { $inc: { stock: -qty } });
    console.log('Created sample order for', customers[0].email);
  } else if (existingOrders > 0) {
    console.log('Orders already exist — skipping sample order.');
  }

  await mongoose.disconnect();
  console.log('Seed finished.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
