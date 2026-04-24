import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import logo from '../../assets/medbuddie_logo.png';
import googleIcon from '../../assets/signin/google_logo.png';
import appleIcon from '../../assets/signin/apple_logo.png';
import { useUser } from '../context/UserContext.jsx';

export default function SignIn() {
    const [form, setForm] = useState({ identifier: '', password: '', rememberMe: false });
    const navigate = useNavigate();
    const { login } = useUser();

    useEffect(() => {
        const initGoogle = () => {
            if (!window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    try {
                        const res = await fetch('/api/google-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: response.credential }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                            login(data.user);
                            localStorage.setItem('token', data.token);
                            navigate('/dashboard');
                        } else {
                            alert(data.error || 'Google sign-in failed');
                        }
                    } catch {
                        alert('Server error during Google sign-in');
                    }
                },
            });
        };

        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (script) {
                script.addEventListener('load', initGoogle);
                return () => script.removeEventListener('load', initGoogle);
            }
        }
    }, [login, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.identifier, password: form.password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.user);
                if (data.token) localStorage.setItem('token', data.token);
                return navigate('/dashboard');
            }
            alert(data.error || 'Invalid credentials');
        } catch {
            alert('Server error — is the backend running?');
        }
    };

    return (
        <>
            <div className="signin-page">
                {/* ── Top bar ── */}
                <header className="signin-topbar">
                    <div className="signin-topbar-logo">
                        <img src={logo} alt="MedBuddie" width="36" height="36" />
                        <span className="signin-brand">MedBuddie</span>
                    </div>
                    <a href="/signup" className="signin-create-link">Create new account</a>
                </header>

                {/* ── Card ── */}
                <main className="signin-main">
                    <div className="signin-card">
                        <h1 className="signin-title">Sign in</h1>

                        <form onSubmit={handleLogin} className="signin-form">
                            <label htmlFor="identifier">Email or username</label>
                            <input
                                id="identifier"
                                type="text"
                                name="identifier"
                                value={form.identifier}
                                onChange={handleChange}
                                placeholder="Enter your email or username"
                                required
                            />

                            <div className="password-row">
                                <label htmlFor="password">Password</label>
                                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />

                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    id="rememberMe"
                                    checked={form.rememberMe}
                                    onChange={handleChange}
                                />
                                <label htmlFor="rememberMe">Remember me</label>
                            </div>

                            <button type="submit" className="signin-primary-btn">Sign in</button>
                        </form>

                        <div className="or-divider"><span>or</span></div>

                        <button
                            className="social-btn apple"
                            onClick={() => alert('Apple Sign In is not yet available. Please sign in with email or Google.')}
                        >
                            <img src={appleIcon} alt="Apple" />
                            Sign in with Apple
                        </button>
                        <button
                            className="social-btn google"
                            onClick={() => {
                                if (window.google?.accounts?.id) {
                                    window.google.accounts.id.prompt();
                                } else {
                                    alert('Google Sign In is still loading. Please wait a moment and try again.');
                                }
                            }}
                        >
                            <img src={googleIcon} alt="Google" />
                            Sign in with Google
                        </button>
                    </div>
                </main>
            </div>

            {/* ── Footer ── */}
            <footer className="signin-footer">
                <div className="footer-inner">
                    <div className="footer-links-group">
                        <div className="footer-col">
                            <strong>COMPANY</strong>
                            <ul>
                                <li>About Us</li>
                                <li>Privacy Policy</li>
                                <li>Terms of Use</li>
                                <li>Press</li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <strong>LEARN MORE</strong>
                            <ul>
                                <li>Community</li>
                                <li>Physician Portal</li>
                                <li>Pricing</li>
                                <li>FAQ</li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-brand-col">
                        <div className="footer-patientslikeme">
                            <img src={logo} alt="Patientslikeme" width="28" height="28" />
                            <span>Patientslikeme</span>
                            <span className="footer-plus">+</span>
                        </div>
                        <div className="footer-social-icons">
                            <button aria-label="Facebook">f</button>
                            <button aria-label="Twitter">t</button>
                            <button aria-label="Google">g</button>
                            <button aria-label="LinkedIn">in</button>
                            <button aria-label="YouTube">▶</button>
                        </div>
                        <p className="footer-privacy-pref">Privacy Preferences</p>
                        <p className="footer-copy">(c) 2024 MedBuddie. All Rights Reserved.</p>
                        <p className="footer-soc">MedBuddie is SOC 2-Type II accredited</p>
                    </div>
                </div>
            </footer>
        </>
    );
}
