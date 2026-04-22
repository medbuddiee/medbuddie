const request = require('supertest');
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

jest.mock('../../config/db', () => ({
    query:   jest.fn(),
    connect: jest.fn(),
}));
const pool = require('../../config/db');

const { router: authRouter } = require('../../routes/auth');

const SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

const app = express();
app.use(express.json());
app.use('/api', authRouter);

beforeEach(() => jest.clearAllMocks());

// ─── POST /api/login ──────────────────────────────────────────────────────────

describe('POST /api/login', () => {
    it('returns 400 when email or password is missing', async () => {
        const res = await request(app).post('/api/login').send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });

    it('returns 400 for an unknown email', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).post('/api/login').send({ email: 'nobody@x.com', password: 'pw' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('returns 400 for a wrong password', async () => {
        const hash = await bcrypt.hash('correct', 10);
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, password: hash }] });
        const res = await request(app).post('/api/login').send({ email: 'u@x.com', password: 'wrong' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('returns a signed JWT on valid credentials', async () => {
        const hash = await bcrypt.hash('secret', 10);
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1, password: hash }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Alice', email: 'u@x.com', medications: [] }] });

        const res = await request(app).post('/api/login').send({ email: 'u@x.com', password: 'secret' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();

        const payload = jwt.verify(res.body.token, SECRET);
        expect(payload.id).toBe(1);
        expect(payload.email).toBe('u@x.com');
    });

    it('includes the full user profile in the response', async () => {
        const hash = await bcrypt.hash('secret', 10);
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 2, password: hash }] })
            .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Bob', email: 'b@x.com', medications: [] }] });

        const res = await request(app).post('/api/login').send({ email: 'b@x.com', password: 'secret' });
        expect(res.body.user).toMatchObject({ id: 2, name: 'Bob' });
    });
});

// ─── POST /api/signup ─────────────────────────────────────────────────────────

describe('POST /api/signup', () => {
    it('returns 400 when email or password is missing', async () => {
        const res = await request(app).post('/api/signup').send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });

    it('returns 201 + JWT on successful signup', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 5, name: 'New', email: 'new@x.com', username: 'new', dob: null, isCaregiver: false }],
        });

        const res = await request(app).post('/api/signup').send({ email: 'new@x.com', password: 'pass123' });
        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('new@x.com');

        const payload = jwt.verify(res.body.token, SECRET);
        expect(payload.id).toBe(5);
    });

    it('returns 400 when email already exists (db conflict)', async () => {
        const conflict = new Error('unique violation');
        conflict.code  = '23505';
        pool.query.mockRejectedValueOnce(conflict);

        const res = await request(app).post('/api/signup').send({ email: 'dup@x.com', password: 'pw' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already exists/i);
    });
});
