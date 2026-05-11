import { Router } from 'express';
import {
  listUsers,
  getUserAdminDetails,
  deleteUser,
  toggleBlockUser,
} from '../controllers/userController.js';
import { protectAdmin } from '../middlewares/adminAuth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', listUsers);
router.get('/:id/details', getUserAdminDetails);
router.delete('/:id', deleteUser);
router.patch('/:id/block', toggleBlockUser);

export default router;
