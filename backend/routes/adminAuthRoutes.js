import { Router } from 'express';
import { body } from 'express-validator';
import { adminLogin } from '../controllers/adminAuthController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').trim().notEmpty().isEmail(),
    body('password').notEmpty(),
    validate,
  ],
  adminLogin,
);

export default router;
