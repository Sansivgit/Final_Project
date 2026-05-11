import { Router } from 'express';
import { body } from 'express-validator';
import {
  listClothTypes,
  createClothType,
  updateClothType,
  deleteClothType,
} from '../controllers/clothTypeController.js';
import { protectAdmin } from '../middlewares/adminAuth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get('/cloth-types', protectAdmin, listClothTypes);
router.post(
  '/cloth-types',
  protectAdmin,
  [body('name').trim().notEmpty().isLength({ max: 80 }), validate],
  createClothType,
);
router.put(
  '/cloth-types/:id',
  protectAdmin,
  [body('name').trim().notEmpty().isLength({ max: 80 }), validate],
  updateClothType,
);
router.delete('/cloth-types/:id', protectAdmin, deleteClothType);

export default router;
