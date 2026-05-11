import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must be 8+ chars with uppercase, lowercase, and number',
      ),
    validate,
  ],
  register,
);
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty(), validate],
  login,
);
router.get('/profile', protect, getProfile);
router.patch(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional({ nullable: true }).isString(),
    validate,
  ],
  updateProfile,
);
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'New password must be 8+ chars with uppercase, lowercase, and number',
      ),
    validate,
  ],
  changePassword,
);
router.post('/forgot-password', [body('email').isEmail(), validate], forgotPassword);
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must be 8+ chars with uppercase, lowercase, and number',
      ),
    validate,
  ],
  resetPassword,
);

export default router;
