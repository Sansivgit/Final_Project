import User from '../models/User.js';
import Product from '../models/Product.js';

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const user = await User.findById(req.user._id);
    const idx = user.cartItems.findIndex(
      (c) =>
        c.product.toString() === productId &&
        (c.size || '') === (size || '') &&
        (c.color || '') === (color || ''),
    );
    if (idx >= 0) {
      user.cartItems[idx].quantity += Number(quantity);
    } else {
      user.cartItems.push({
        product: productId,
        quantity: Number(quantity),
        size,
        color,
      });
    }
    await user.save();
    const populated = await User.findById(user._id).populate({
      path: 'cartItems.product',
      select: 'title price discount image stock clothType category brand',
    });
    req.app.get('io')?.to(`user-${user._id}`).emit('cart-updated', populated.cartItems);
    res.json(populated);
  } catch (e) {
    next(e);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'cartItems.product',
      select: 'title price discount image stock clothType category brand',
    });
    res.json(user.cartItems);
  } catch (e) {
    next(e);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);
    const item = user.cartItems.id(id);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    item.quantity = Number(quantity);
    await user.save();
    const populated = await User.findById(user._id).populate({
      path: 'cartItems.product',
      select: 'title price discount image stock clothType category brand',
    });
    req.app.get('io')?.to(`user-${user._id}`).emit('cart-updated', populated.cartItems);
    res.json(populated);
  } catch (e) {
    next(e);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const item = user.cartItems.id(id);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    item.deleteOne();
    await user.save();
    const populated = await User.findById(user._id).populate({
      path: 'cartItems.product',
      select: 'title price discount image stock clothType category brand',
    });
    req.app.get('io')?.to(`user-${user._id}`).emit('cart-updated', populated.cartItems);
    res.json(populated);
  } catch (e) {
    next(e);
  }
};
