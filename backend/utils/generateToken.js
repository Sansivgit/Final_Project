import jwt from 'jsonwebtoken';

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** JWT for dashboard admins — payload includes `scope: 'admin'` so customer tokens cannot access admin APIs. */
export const generateAdminToken = (id) =>
  jwt.sign({ id: String(id), scope: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
