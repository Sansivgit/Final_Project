import Admin from '../models/Admin.js';
import { generateAdminToken } from '../utils/generateToken.js';

export const adminLogin = async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = req.body.password;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = await admin.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateAdminToken(admin._id);
    res.json({
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (e) {
    next(e);
  }
};
