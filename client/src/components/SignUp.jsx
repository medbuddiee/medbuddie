import React, { useState } from 'react';
import './SignUp.css';
import logo from '../../assets/medbuddie_logo.png';
import appleIcon from '../../assets/signup/apple_logo.png';
import facebookIcon from '../../assets/signup/facebook_logo.png';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = '369701342975-ntoanlmiauclime0ketc2csdp7r299q6.apps.googleusercontent.com';

export default function SignUp() {
    const [form, setForm] = useState({
        email: '',
        password: '',
        username: '',
        dob: { year: '', month: '', day: '' },
        isCaregiver: false,
        acceptedTerms: false,
    });

    const navigate = useNavigate();

    const handleGoogleSuccess = (credentialResponse) => {
        console.log('Google Login Success:', credentialResponse);
        // You may send the credentialResponse.credential to backend here
    };

    const handleGoogleFailure = () => {
        alert('Google login failed');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name in form.dob) {
            setForm({ ...form, dob: { ...form.dob, [name]: value } });
        } else {
            setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dob = `${form.dob.year}-${form.dob.month.padStart(2, '0')}-${form.dob.day.padStart(2, '0')}`;

        const payload = {
            name: form.username,
            email: form.email,
            username: form.username,
            password: form.password,
            dob,
            isCaregiver: form.isCaregiver,
            acceptedTerms: form.acceptedTerms
        };

        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            let data;
            try {
                data = await response.json();
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                return alert("Signup error!");
            }

            if (response.ok) {
                alert('Signup successful!');
            } else {
                alert(`Error: ${data.error}`);
            }
            return navigate("/dashboard");
        } catch (err) {
            console.error('Network error:', err);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="signup-container">
                <div className="signup-card">
                    <div className="signup-header">
                        <div className="logo">
                            <img
                                src={logo}
                                alt="MedBuddie Logo"
                                width="40"
                                height="40"
                                style={{ display: 'inline-block' }}
                            />
                            <span>MedBuddie</span>
                        </div>
                        <div className="header-text">
                            <span>Already a member? <a href="/signin">Sign in</a></span>
                        </div>
                    </div>

                    <h2>Living better starts here.</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="inputField">
                            <label>Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Your email address will not be shared" required />

                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="" required />

                            <label>Username</label>
                            <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="This is visible to other MedBuddie members." required />
                        </div>

                        <label>Date of birth</label>
                        <div className="dob-row">
                            <select name="year" value={form.dob.year} onChange={handleChange} required>
                                <option value="">YEAR</option>
                                {Array.from({ length: 100 }, (_, i) => 2024 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select name="month" value={form.dob.month} onChange={handleChange} required>
                                <option value="">MONTH</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                            <select name="day" value={form.dob.day} onChange={handleChange} required>
                                <option value="">DAY</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div className="signup-condition checkbox-groups">
                            <label>
                                <input type="checkbox" name="isCaregiver" checked={form.isCaregiver} onChange={handleChange} className='checkbox-style' />
                                I am joining as a caregiver for someone else
                            </label>
                            <label>
                                <input type="checkbox"
                                       name="acceptedTerms"
                                       checked={form.acceptedTerms}
                                       onChange={handleChange}
                                       required
                                />
                                <span>I agree to the MedBuddie <a href="/terms">terms & conditions of use</a> <a href="/privacy"> and privacy policy</a></span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={!form.acceptedTerms}
                            className={!form.acceptedTerms ? 'button-disabled' : 'button-active'}
                        >    Create Account
                        </button>
                    </form>

                    <div className="or-divider"><span>or</span></div>

                    <button
                        className="social-btn facebook"
                        onClick={() => {
                            window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=4735178640041107&redirect_uri=http://localhost:3000/facebook-callback&scope=email,public_profile`;
                        }}
                    >
                        <img src={facebookIcon} alt="Facebook" /> Sign up with Facebook
                    </button>
                    <button className="social-btn apple">
                        <img src={appleIcon} alt="Apple" /> Sign up with Apple
                    </button>

                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleFailure}
                            shape="pill"
                            size="large"
                            width="100%"
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
