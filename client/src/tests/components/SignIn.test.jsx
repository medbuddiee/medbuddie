import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignIn from '../../components/SignIn';
import { UserProvider } from '../../context/UserContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderSignIn() {
    return render(
        <UserProvider>
            <MemoryRouter>
                <SignIn />
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

describe('SignIn form', () => {
    it('renders email, password fields and a sign-in button', () => {
        renderSignIn();
        expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('calls /api/login with email and password on submit', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: { id: 1, name: 'Alice' }, token: 'jwt-abc' }),
        });

        renderSignIn();
        fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'alice@x.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'POST' }));
            const body = JSON.parse(fetch.mock.calls[0][1].body);
            expect(body.email).toBe('alice@x.com');
            expect(body.password).toBe('secret');
        });
    });

    it('stores the JWT in localStorage and navigates to /dashboard on success', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: { id: 1, name: 'Alice' }, token: 'jwt-abc' }),
        });

        renderSignIn();
        fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'alice@x.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('jwt-abc');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('shows an alert and does NOT navigate on failed login', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Invalid credentials' }),
        });

        renderSignIn();
        fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'bad@x.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Invalid credentials');
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});

describe('Google sign-in button', () => {
    it('renders the Google sign-in button', () => {
        renderSignIn();
        expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });

    it('calls google.accounts.id.prompt() when clicked', () => {
        const prompt = vi.fn();
        vi.stubGlobal('google', { accounts: { id: { initialize: vi.fn(), prompt } } });

        renderSignIn();
        fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
        expect(prompt).toHaveBeenCalled();

        vi.unstubAllGlobals();
    });
});
