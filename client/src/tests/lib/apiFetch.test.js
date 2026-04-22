import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../../lib/apiFetch';

describe('apiFetch', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('passes through the request when no token is stored', async () => {
        await apiFetch('/api/profile');
        expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
            headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
        }));
    });

    it('adds Authorization header when a token is in localStorage', async () => {
        localStorage.setItem('token', 'my-jwt');
        await apiFetch('/api/profile');
        expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer my-jwt' }),
        }));
    });

    it('allows caller to override headers', async () => {
        localStorage.setItem('token', 'my-jwt');
        await apiFetch('/api/posts', { headers: { 'Content-Type': 'application/json' } });
        expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: 'Bearer my-jwt',
                'Content-Type': 'application/json',
            }),
        }));
    });

    it('forwards method and body options', async () => {
        localStorage.setItem('token', 'tok');
        await apiFetch('/api/posts', { method: 'POST', body: JSON.stringify({ x: 1 }) });
        expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ x: 1 }),
        }));
    });
});
