import { Router } from 'express';
import { body } from 'express-validator';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/create-order',
  protect,
  [body('amount').isNumeric(), validate],
  createOrder,
);
router.post(
  '/verify',
  protect,
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    validate,
  ],
  verifyPayment,
);

export default router;
