import { Router } from 'express';
import ClothType from '../models/ClothType.js';

const router = Router();

/** Public list of cloth type names for storefront filters (sorted A→Z). */
router.get('/cloth-types', async (_req, res, next) => {
  try {
    const rows = await ClothType.find().select('name').sort({ name: 1 }).lean();
    res.json(rows.map((r) => r.name));
  } catch (e) {
    next(e);
  }
});

export default router;
