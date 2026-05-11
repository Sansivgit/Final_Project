import { Router } from 'express';
import { body } from 'express-validator';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cartController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(protect);

router.post(
  '/add',
  [
    body('productId').notEmpty(),
    body('quantity').optional().isInt({ min: 1 }),
    validate,
  ],
  addToCart,
);
router.get('/', getCart);
router.put('/:id', [body('quantity').isInt({ min: 1 }), validate], updateCartItem);
router.delete('/:id', removeCartItem);

export default router;
