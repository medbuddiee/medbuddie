import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../../components/SignUp';
import { UserProvider } from '../../context/UserContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderSignUp() {
    return render(
        <UserProvider>
            <MemoryRouter>
                <SignUp />
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

describe('SignUp form', () => {
    it('renders email, password fields and a create account button', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('redirects to /dashboard (not /signin) on successful signup', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: { id: 3, name: 'newuser' }, token: 'new-jwt' }),
        });

        renderSignUp();

        fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: 'new@x.com' } });
        fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
        fireEvent.submit(document.querySelector('form.signup-form'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/signup', expect.objectContaining({ method: 'POST' }));
            expect(localStorage.getItem('token')).toBe('new-jwt');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('does NOT navigate to /signin after signup', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: { id: 3, name: 'newuser' }, token: 'tok' }),
        });

        renderSignUp();
        fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: 'n@x.com' } });
        fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'pw' } });
        fireEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
        fireEvent.submit(document.querySelector('form.signup-form'));

        await waitFor(() => {
            expect(mockNavigate).not.toHaveBeenCalledWith('/signin');
        });
    });
});

describe('Google sign-up button', () => {
    it('renders the Google sign-up button', () => {
        renderSignUp();
        expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    });

    it('calls google.accounts.id.prompt() when clicked', () => {
        const prompt = vi.fn();
        vi.stubGlobal('google', { accounts: { id: { initialize: vi.fn(), prompt } } });

        renderSignUp();
        fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
        expect(prompt).toHaveBeenCalled();

        vi.unstubAllGlobals();
    });
});
