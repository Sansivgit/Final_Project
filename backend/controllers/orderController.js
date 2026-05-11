import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

function normalizeLineItems(items) {
  const normalized = [];
  for (const it of items) {
    const title = typeof it.title === 'string' ? it.title.trim() : '';
    const quantity = Number(it.quantity);
    const unitPrice = Number(it.unitPrice);
    if (!title || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return { error: 'Each item needs title, quantity ≥ 1, and unitPrice ≥ 0' };
    }
    const line = { title, quantity, unitPrice };
    const pid = it.product || it.productId;
    if (pid && mongoose.Types.ObjectId.isValid(String(pid))) {
      line.product = new mongoose.Types.ObjectId(String(pid));
    }
    normalized.push(line);
  }
  return { items: normalized };
}

async function assertStockAvailable(lines) {
  for (const line of lines) {
    if (!line.product) continue;
    const product = await Product.findById(line.product).select('stock title');
    if (!product) {
      return `Product not found for line: ${line.title}`;
    }
    if (product.stock < line.quantity) {
      return `Insufficient stock for "${product.title || line.title}"`;
    }
  }
  return null;
}

/** Persist a paid order after checkout (client sends cart snapshot). */
export const checkoutOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, shippingAddress, paymentSummary, clearCart } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array required' });
    }

    const parsed = normalizeLineItems(items);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const total = Number(totalAmount);
    if (!Number.isFinite(total) || total < 0) {
      return res.status(400).json({ message: 'Invalid totalAmount' });
    }

    const calculated = parsed.items.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0);
    if (Math.abs(calculated - total) > 0.05) {
      return res.status(400).json({ message: 'totalAmount does not match line items' });
    }

    const stockErr = await assertStockAvailable(parsed.items);
    if (stockErr) {
      return res.status(400).json({ message: stockErr });
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8)}`;

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items: parsed.items.map(({ title, quantity, unitPrice, product }) => ({
        title,
        quantity,
        unitPrice,
        ...(product ? { product } : {}),
      })),
      totalAmount: total,
      shippingAddress: shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : undefined,
      paymentSummary: typeof paymentSummary === 'string' ? paymentSummary : '',
      status: 'paid',
    });

    for (const line of parsed.items) {
      if (!line.product) continue;
      await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
    }

    if (clearCart) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.cartItems = [];
        await user.save();
      }
      req.app.get('io')?.to(`user-${req.user._id}`).emit('cart-updated', []);
    }

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
};

/** Customer: list own orders (newest first). */
export const listMyOrders = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const items = orders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber || '',
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentSummary: o.paymentSummary || '',
      shippingAddress: o.shippingAddress || null,
      items: (o.items || []).map((it) => ({
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    }));

    res.json({ items });
  } catch (e) {
    next(e);
  }
};

/** Admin: list orders with customer info */
export const listOrdersAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    const items = rows.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber || '',
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentSummary: o.paymentSummary || '',
      shippingAddress: o.shippingAddress || null,
      items: (o.items || []).map((it) => ({
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        productId: it.product ? String(it.product) : null,
      })),
      user: o.user
        ? { id: String(o.user._id || o.user), name: o.user.name, email: o.user.email }
        : null,
    }));

    res.json({
      items,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (e) {
    next(e);
  }
};
