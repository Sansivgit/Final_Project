import { Router } from 'express';
import { body } from 'express-validator';
import { subscribe } from '../controllers/subscriberController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/', [body('email').trim().notEmpty().isEmail(), validate], subscribe);

export default router;
