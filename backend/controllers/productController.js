import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      clothType,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (brand) filter.brand = new RegExp(`^${brand}$`, 'i');
    if (clothType) filter.clothType = new RegExp(`^${clothType}$`, 'i');
    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortParam = req.query.sort;

    let sortObj = { createdAt: -1 };
    if (search) {
      sortObj = { score: { $meta: 'textScore' } };
    } else if (sortParam === 'price-asc') {
      sortObj = { price: 1 };
    } else if (sortParam === 'price-desc') {
      sortObj = { price: -1 };
    } else if (sortParam === 'newest') {
      sortObj = { createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      total,
    });
  } catch (e) {
    next(e);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (e) {
    next(e);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (e) {
    next(e);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed' });
  } catch (e) {
    next(e);
  }
};

export const productStats = async (_req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    res.json({ totalProducts, totalUsers, totalOrders });
  } catch (e) {
    next(e);
  }
};
