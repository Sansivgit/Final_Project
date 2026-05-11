import { Router } from 'express';
import { body } from 'express-validator';
import { listAddresses, addAddress, deleteAddress } from '../controllers/addressController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(protect);

router.get('/', listAddresses);
router.post(
  '/',
  [
    body('fullName').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('line1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('postalCode').trim().notEmpty(),
    validate,
  ],
  addAddress,
);

router.delete('/:id', deleteAddress);

export default router;
