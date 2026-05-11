import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * Requires Bearer JWT issued by POST /api/admin/login (`scope: 'admin'`).
 * Attaches `req.admin` (password excluded). Customer tokens cannot pass.
 */
export const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.scope !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
