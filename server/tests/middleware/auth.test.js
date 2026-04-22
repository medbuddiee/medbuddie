const jwt = require('jsonwebtoken');
const { authenticate, softAuthenticate } = require('../../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';
const VALID_PAYLOAD = { id: 1, email: 'user@test.com', name: 'Test User' };

function mockReq(token) {
    return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

function mockRes() {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    return res;
}

const validToken   = jwt.sign(VALID_PAYLOAD, SECRET, { expiresIn: '1h' });
const expiredToken = jwt.sign(VALID_PAYLOAD, SECRET, { expiresIn: -1 });
const wrongSecret  = jwt.sign(VALID_PAYLOAD, 'wrong-secret', { expiresIn: '1h' });

// ─── authenticate ────────────────────────────────────────────────────────────

describe('authenticate', () => {
    it('calls next and sets req.user with a valid token', () => {
        const req = mockReq(validToken);
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject({ id: 1, email: 'user@test.com' });
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when no Authorization header is present', () => {
        const req = mockReq(null);
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for an expired token', () => {
        const req = mockReq(expiredToken);
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for a token signed with the wrong secret', () => {
        const req = mockReq(wrongSecret);
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for a malformed token string', () => {
        const req = mockReq('not.a.jwt');
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

// ─── softAuthenticate ─────────────────────────────────────────────────────────

describe('softAuthenticate', () => {
    it('always calls next with no token', () => {
        const req = mockReq(null);
        const res = mockRes();
        const next = jest.fn();
        softAuthenticate(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeUndefined();
    });

    it('sets req.user and calls next with a valid token', () => {
        const req = mockReq(validToken);
        const res = mockRes();
        const next = jest.fn();
        softAuthenticate(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject({ id: 1 });
    });

    it('still calls next (no 401) with an invalid token', () => {
        const req = mockReq('garbage');
        const res = mockRes();
        const next = jest.fn();
        softAuthenticate(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeUndefined();
    });

    it('still calls next with an expired token', () => {
        const req = mockReq(expiredToken);
        const res = mockRes();
        const next = jest.fn();
        softAuthenticate(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeUndefined();
    });
});
