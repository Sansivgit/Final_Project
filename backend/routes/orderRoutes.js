import { Router } from 'express';
import { body } from 'express-validator';
import { checkoutOrder, listMyOrders, listOrdersAdmin } from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/checkout',
  protect,
  [
    body('items').isArray({ min: 1 }),
    body('totalAmount').isFloat({ min: 0 }),
    validate,
  ],
  checkoutOrder,
);

router.get('/me', protect, listMyOrders);

router.get('/', protectAdmin, listOrdersAdmin);

export default router;
