import { Router } from 'express';
import { uploadImage, upload } from '../controllers/uploadController.js';
import { protectAdmin } from '../middlewares/adminAuth.js';

const router = Router();

router.post('/', protectAdmin, upload.single('image'), uploadImage);

export default router;
