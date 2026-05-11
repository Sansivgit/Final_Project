import mongoose from 'mongoose';
import User from '../models/User.js';

function normalizeAddressKey(a) {
  const parts = [
    (a.line1 || '').trim().toLowerCase(),
    (a.line2 || '').trim().toLowerCase(),
    (a.city || '').trim().toLowerCase(),
    (a.state || '').trim().toLowerCase(),
    (a.postalCode || '').trim().toLowerCase(),
    (a.phone || '').trim().toLowerCase(),
  ];
  return parts.join('|');
}

export const listAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses').lean();
    res.json(Array.isArray(user?.addresses) ? user.addresses : []);
  } catch (e) {
    next(e);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const payload = {
      label: typeof req.body.label === 'string' ? req.body.label.trim() : '',
      fullName: String(req.body.fullName || '').trim(),
      phone: String(req.body.phone || '').trim(),
      line1: String(req.body.line1 || '').trim(),
      line2: typeof req.body.line2 === 'string' ? req.body.line2.trim() : '',
      city: String(req.body.city || '').trim(),
      state: String(req.body.state || '').trim(),
      postalCode: String(req.body.postalCode || '').trim(),
      country:
        typeof req.body.country === 'string' && req.body.country.trim()
          ? req.body.country.trim()
          : 'India',
    };
    if (
      !payload.fullName ||
      !payload.phone ||
      !payload.line1 ||
      !payload.city ||
      !payload.state ||
      !payload.postalCode
    ) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }

    const key = normalizeAddressKey(payload);
    for (const existing of user.addresses || []) {
      if (normalizeAddressKey(existing) === key) {
        return res.status(400).json({ message: 'Address already exists' });
      }
    }

    user.addresses.push(payload);
    await user.save();
    const added = user.addresses[user.addresses.length - 1];
    res.status(201).json(added);
  } catch (e) {
    next(e);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid address id' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const before = user.addresses.length;
    user.addresses = user.addresses.filter((a) => String(a._id) !== id);
    if (user.addresses.length === before) {
      return res.status(404).json({ message: 'Address not found' });
    }
    await user.save();
    res.json({ message: 'Address removed' });
  } catch (e) {
    next(e);
  }
};
