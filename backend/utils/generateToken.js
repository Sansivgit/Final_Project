import jwt from 'jsonwebtoken';

const DEV_JWT_SECRET = 'volt-dev-jwt-secret-change-in-render';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.error('[auth] JWT_SECRET is missing. Set it in the deployment environment.');
  }
  return DEV_JWT_SECRET;
}

export const generateToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** JWT for dashboard admins — payload includes `scope: 'admin'` so customer tokens cannot access admin APIs. */
export const generateAdminToken = (id) =>
  jwt.sign({ id: String(id), scope: 'admin' }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
