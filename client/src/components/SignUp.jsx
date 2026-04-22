import React, { useState, useEffect } from 'react';
import './SignUp.css';
import logo from '../../assets/medbuddie_logo.png';
import appleIcon from '../../assets/signup/apple_logo.png';
import facebookIcon from '../../assets/signup/facebook_logo.png';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

export default function SignUp() {
    const navigate = useNavigate();
    const { login } = useUser();

    const [form, setForm] = useState({
        email: '',
        password: '',
        showPassword: false,
        dob: { year: '', month: '', day: '' },
        isCaregiver: false,
        acceptedTerms: false,
    });
    useEffect(() => {
        if (!window.google) return;
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
                        alert(data.error || 'Google sign-up failed');
                    }
                } catch {
                    alert('Server error during Google sign-up');
                }
            },
        });
    }, [login, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name in form.dob) {
            setForm({ ...form, dob: { ...form.dob, [name]: value } });
        } else {
            setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        }
    };

    const togglePassword = () =>
        setForm((prev) => ({ ...prev, showPassword: !prev.showPassword }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { year, month, day } = form.dob;
        const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const username = form.email.split('@')[0];

        const payload = {
            name: username,
            email: form.email,
            username,
            password: form.password,
            dob,
            isCaregiver: form.isCaregiver,
        };

        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.user);
                localStorage.setItem('token', data.token);
                return navigate('/dashboard');
            }
            alert(data.error || 'Signup failed');
        } catch {
            alert('Network error — is the backend running?');
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return (
        <div className="signup-page">
            {/* ── Top bar ── */}
            <header className="signup-topbar">
                <div className="signup-topbar-logo">
                    <img src={logo} alt="MedBuddie" width="36" height="36" />
                    <span className="signup-brand">MedBuddie</span>
                </div>
                <div className="signup-signin-hint">
                    Already a member?{' '}
                    <a href="/signin">Sign in</a>
                </div>
            </header>

            {/* ── Card ── */}
            <main className="signup-main">
                <div className="signup-card">
                    <h1 className="signup-headline">Connect. Learn. Heal.</h1>

                    <form onSubmit={handleSubmit} className="signup-form">
                        {/* Email */}
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Your email address will not be shared"
                            required
                        />

                        {/* Password */}
                        <label>Password</label>
                        <div className="password-wrapper">
                            <input
                                type={form.showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={togglePassword}
                                aria-label="Toggle password visibility"
                            >
                                {form.showPassword ? '🙈' : '👁'}
                            </button>
                        </div>

                        {/* Date of birth */}
                        <label className="dob-label">Date of birth</label>
                        <div className="dob-row">
                            <div className="dob-field">
                                <span className="dob-sub-label">YEAR</span>
                                <select name="year" value={form.dob.year} onChange={handleChange} required>
                                    <option value=""></option>
                                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="dob-field">
                                <span className="dob-sub-label">MONTH</span>
                                <select name="month" value={form.dob.month} onChange={handleChange} required>
                                    <option value=""></option>
                                    {months.map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="dob-field">
                                <span className="dob-sub-label">DAY</span>
                                <select name="day" value={form.dob.day} onChange={handleChange} required>
                                    <option value=""></option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="signup-checkbox-group">
                            <label className="signup-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isCaregiver"
                                    checked={form.isCaregiver}
                                    onChange={handleChange}
                                />
                                <span>I am joining as a caregiver for someone else</span>
                            </label>
                            <label className="signup-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="acceptedTerms"
                                    checked={form.acceptedTerms}
                                    onChange={handleChange}
                                    required
                                />
                                <span>
                                    I agree to the MedBuddie{' '}
                                    <a href="/terms">terms &amp; conditions</a>
                                    {' '}and{' '}
                                    <a href="/privacy">privacy policy</a>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={`signup-submit-btn ${!form.acceptedTerms ? 'disabled' : ''}`}
                            disabled={!form.acceptedTerms}
                        >
                            Create account
                        </button>
                    </form>

                    <div className="or-divider"><span>or</span></div>

                    <button
                        className="social-btn facebook"
                        onClick={() => {
                            window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${import.meta.env.VITE_FB_APP_ID || '4735178640041107'}&redirect_uri=${encodeURIComponent('http://localhost:3000/facebook-callback')}&scope=email,public_profile`;
                        }}
                    >
                        <img src={facebookIcon} alt="Facebook" />
                        Sign up with Facebook
                    </button>
                    <button className="social-btn apple">
                        <img src={appleIcon} alt="Apple" />
                        Sign up with Apple
                    </button>
                    <button
                        className="social-btn google"
                        onClick={() => window.google?.accounts.id.prompt()}
                    >
                        <span className="google-g">G</span>
                        Sign up with Google
                    </button>

                    <p className="signup-disclaimer">
                        We don&apos;t share any of the information you report on Patientslikeme,
                        with these providers.
                    </p>
                </div>
            </main>
        </div>
    );
}
