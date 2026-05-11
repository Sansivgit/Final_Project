import Admin from '../models/Admin.js';

/**
 * Ensures the default dashboard admin exists (idempotent).
 * Password is hashed by Admin model pre-save hook.
 */
export async function ensureDefaultAdmin() {
  try {
    const exists = await Admin.findOne({ email: 'admin@volt.com' });
    if (exists) return;

    await Admin.create({
      name: 'Super Admin',
      email: 'admin@volt.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Default admin created: admin@volt.com (change password in production)');
  } catch (e) {
    console.error('ensureDefaultAdmin:', e.message);
  }
}
