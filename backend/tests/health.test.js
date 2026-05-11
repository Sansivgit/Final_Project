import request from 'supertest';

/**
 * Integration tests expect MongoDB when hitting DB routes.
 * GET /api/health works without DB (DB connects only via server.js).
 */
import app from '../app.js';

describe('Health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
