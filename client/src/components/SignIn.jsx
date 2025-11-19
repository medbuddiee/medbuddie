import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import logo from '../../assets/medbuddie_logo.png';
import googleIcon from '../../assets/signin/google_logo.png';
import appleIcon from '../../assets/signin/apple_logo.png';
import facebookIcon from '../../assets/signin/facebook_logo.png';
import { useUser } from '../context/UserContext.jsx';

export default function SignIn() {
    const [form, setForm] = useState({
        identifier: '',
        password: '',
        rememberMe: false,
    });

    const navigate = useNavigate();
    const { login } = useUser();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const { identifier, password } = form;

        try {
            // ✔ Try backend login
            const res = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: identifier,
                    password: password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // ✔ Successful backend login
                login(data.user); // store in context
                localStorage.setItem("user", JSON.stringify(data.user));
                return navigate("/dashboard");
            }

            // ❗ If backend login failed, fallback to mock
            if (
                identifier === "kshitijkaushik14@gmail.com" &&
                password === "123456"
            ) {
                login({
                    name: "Kshitij Kaushik",
                    email: identifier,
                });
                return navigate("/dashboard");
            }

            // ❌ Otherwise: invalid credentials
            alert("Invalid email or password");

        } catch (err) {
            console.error("Login error:", err);
            alert("Server error");
        }
    };


    return (
        <>
            <div className="signin-container">
                <div className="signin-card">
                    <div className="signin-header">
                        <div className="logo">
                            <img src={logo} alt="MedBuddie Logo" width="40" height="40" />
                            <span>MedBuddie</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="signin-form">
                        <label>Username or Email</label>
                        <input
                            type="text"
                            name="identifier"
                            value={form.identifier}
                            onChange={handleChange}
                            required
                        />

                        <div className="password-row">
                            <label>Password</label>
                            <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />

                        <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={form.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Remember me on this computer</span>
                        </div>

                        <button type="submit" className="primary-btn">Sign In</button>
                    </form>

                    <a href="/signup" className="create-account-link">Create new account</a>

                    <div className="or-divider"><span>or</span></div>

                    <button className="social-btn apple">
                        <img src={appleIcon} alt="Apple" /> Sign in with Apple
                    </button>
                    <button className="social-btn google">
                        <img src={googleIcon} alt="Google" /> Sign in with Google
                    </button>
                    <button className="social-btn facebook">
                        <img src={facebookIcon} alt="Facebook" /> Sign in with Facebook
                    </button>
                </div>
            </div>

            <footer className="signin-footer">
                <div className="footer-columns">
                    <div>
                        <strong>Company</strong>
                        <ul>
                            <li>About Us</li>
                            <li>Privacy and Security</li>
                            <li>Careers</li>
                            <li>Blog</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Support</strong>
                        <ul>
                            <li>Contact Us</li>
                            <li>Help Center</li>
                            <li>User Agreement</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Research</strong>
                        <ul>
                            <li>Publications</li>
                            <li>Press</li>
                            <li>Funding</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Legal</strong>
                        <ul>
                            <li>Terms</li>
                            <li>Privacy Policy</li>
                            <li>Cookies</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <img src={logo} alt="MedBuddie Logo" className="footer-logo" />
                    <p>© 2025 MedBuddie. All rights reserved. This site is not medical advice.</p>
                </div>
            </footer>
        </>
    );
}
