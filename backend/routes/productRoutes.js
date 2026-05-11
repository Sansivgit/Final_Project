import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  productStats,
} from '../controllers/productController.js';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  getProducts,
);
router.get('/stats/summary', protectAdmin, productStats);
router.get('/:id', getProductById);
router.post(
  '/',
  protectAdmin,
  [
    body('title').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('clothType').notEmpty(),
    body('category').notEmpty(),
    body('brand').notEmpty(),
    body('stock').isInt({ min: 0 }),
    validate,
  ],
  createProduct,
);
router.put('/:id', protectAdmin, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

export default router;
