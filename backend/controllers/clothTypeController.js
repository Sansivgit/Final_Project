import ClothType from '../models/ClothType.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const listClothTypes = async (_req, res, next) => {
  try {
    const items = await ClothType.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
};

export const createClothType = async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const dup = await ClothType.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    }).lean();
    if (dup) {
      return res.status(400).json({
        message: 'Already exists.',
      });
    }
    const maxDoc = await ClothType.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
    const sortOrder = (maxDoc?.sortOrder ?? -1) + 1;
    const doc = await ClothType.create({ name, sortOrder });
    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({
        message: 'Already exists.',
      });
    }
    next(e);
  }
};

export const updateClothType = async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const exists = await ClothType.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    }).lean();
    if (exists && String(exists._id) !== req.params.id) {
      return res.status(400).json({ message: 'Already exists.' });
    }
    const doc = await ClothType.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) {
      return res.status(404).json({ message: 'Cloth type not found' });
    }
    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ message: 'Already exists.' });
    }
    next(e);
  }
};

export const deleteClothType = async (req, res, next) => {
  try {
    const doc = await ClothType.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Cloth type not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
