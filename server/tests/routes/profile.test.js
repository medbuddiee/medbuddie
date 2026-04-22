const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

jest.mock('../../config/db', () => ({ query: jest.fn() }));
const pool = require('../../config/db');

jest.mock('multer', () => {
    const multer = () => ({ single: () => (_req, _res, next) => next() });
    multer.diskStorage = () => ({});
    return multer;
});
jest.mock('fs', () => ({ mkdirSync: jest.fn() }));

const profileRouter = require('../../routes/profile');

const SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';
const validToken = jwt.sign({ id: 1, email: 'u@x.com', name: 'User' }, SECRET, { expiresIn: '1h' });

const app = express();
app.use(express.json());
app.use('/api/profile', profileRouter);

const PROFILE_ROW = {
    id: 1, name: 'User', username: 'user', bio: null,
    weight: null, height: null, bmi: null,
    bloodPressure: null, lipidPanel: null, hba1c: null,
    medications: [], email: 'u@x.com', avatarUrl: null,
};

beforeEach(() => jest.clearAllMocks());

// ─── GET /api/profile ─────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(401);
    });

    it('returns 401 with a bad token', async () => {
        const res = await request(app).get('/api/profile').set('Authorization', 'Bearer bad.token');
        expect(res.status).toBe(401);
    });

    it('returns profile data with a valid token', async () => {
        pool.query.mockResolvedValueOnce({ rows: [PROFILE_ROW] });
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${validToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 1, name: 'User' });
    });

    it('does NOT accept userId query param as auth (no fallback)', async () => {
        const res = await request(app).get('/api/profile?userId=1');
        expect(res.status).toBe(401);
    });
});

// ─── PUT /api/profile ─────────────────────────────────────────────────────────

describe('PUT /api/profile', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).put('/api/profile').send({ name: 'Hacker' });
        expect(res.status).toBe(401);
    });

    it('does NOT accept userId in body as auth (no fallback)', async () => {
        const res = await request(app).put('/api/profile').send({ userId: 1, name: 'Hacker' });
        expect(res.status).toBe(401);
    });

    it('updates profile with a valid token', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1, name: 'Updated', bio: null, weight: null, height: null, bmi: null, bloodPressure: null, hba1c: null, lipidPanel: null, medications: [] }],
        });
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Updated' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated');
    });
});
