import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FacebookCallback from '../../components/SignUp/FacebookCallback';
import { UserProvider } from '../../context/UserContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderCallback(search = '') {
    return render(
        <UserProvider>
            <MemoryRouter initialEntries={[`/facebook-callback${search}`]}>
                <Routes>
                    <Route path="/facebook-callback" element={<FacebookCallback />} />
                </Routes>
            </MemoryRouter>
        </UserProvider>
    );
}

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('alert', vi.fn());
    localStorage.clear();
    mockNavigate.mockClear();
});

describe('FacebookCallback', () => {
    it('redirects to /signin when no code is in the URL', async () => {
        renderCallback('');
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/signin'));
    });

    it('stores the token and redirects to /dashboard on success', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: { id: 7, name: 'FBUser' }, token: 'fb-jwt' }),
        });

        renderCallback('?code=valid_code');

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/auth/facebook', expect.objectContaining({ method: 'POST' }));
            expect(localStorage.getItem('token')).toBe('fb-jwt');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('shows an alert and redirects to /signin on failure', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Facebook authentication failed' }),
        });

        renderCallback('?code=bad_code');

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/signin');
        });
    });
});
