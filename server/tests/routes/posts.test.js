const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

jest.mock('../../config/db', () => ({
    query:   jest.fn(),
    connect: jest.fn(),
}));
const pool = require('../../config/db');

const postsRouter = require('../../routes/posts');

const SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';
const validToken = jwt.sign({ id: 1, email: 'u@x.com', name: 'User' }, SECRET, { expiresIn: '1h' });

const app = express();
app.use(express.json());
app.use('/api/posts', postsRouter);

beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = { query: jest.fn(), release: jest.fn() };
    pool.connect.mockResolvedValue(mockClient);
});

describe('GET /api/posts (public)', () => {
    it('returns 200 without a token', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).get('/api/posts');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('POST /api/posts (protected)', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/posts').send({ content: 'hello' });
        expect(res.status).toBe(401);
    });

    it('creates a post with a valid token', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 10, authorId: 1, content: 'hello', type: 'personal', tags: [], likes: 0, comments_count: 0, created_at: new Date() }],
        });
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ content: 'hello', type: 'personal' });
        expect(res.status).toBe(201);
        expect(res.body.content).toBe('hello');
    });

    it('returns 400 when content is empty', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ content: '   ' });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/posts/:id (protected)', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).delete('/api/posts/1');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/posts/:id/like (protected)', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/posts/1/like');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/posts/:id/comments (protected)', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/posts/1/comments').send({ content: 'hi' });
        expect(res.status).toBe(401);
    });
});
