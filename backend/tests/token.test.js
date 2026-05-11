import { generateToken } from '../utils/generateToken.js';

describe('generateToken', () => {
  it('returns a JWT string when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-only';
    const token = generateToken('507f1f77bcf86cd799439011');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });
});
