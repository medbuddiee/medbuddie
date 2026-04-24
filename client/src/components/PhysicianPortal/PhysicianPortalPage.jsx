import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './PhysicianPortal.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaUserMd, FaLock, FaEnvelope, FaIdCard, FaChevronDown, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const ALL_SPECIALTIES = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'General Practice', 'Geriatrics', 'Hematology', 'Infectious Disease',
    'Internal Medicine', 'Nephrology', 'Neurology', 'Obstetrics & Gynecology',
    'Oncology', 'Ophthalmology', 'Orthopedics', 'Otolaryngology',
    'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology',
    'Rheumatology', 'Surgery', 'Urology', 'Vascular Surgery',
];

export default function PhysicianPortalPage() {
    const { login } = useUser();
    const navigate = useNavigate();
    const [tab, setTab] = useState('signin'); // 'signin' | 'register'

    // Sign-in state
    const [siEmail, setSiEmail]       = useState('');
    const [siPassword, setSiPassword] = useState('');
    const [siError, setSiError]       = useState('');
    const [siLoading, setSiLoading]   = useState(false);

    // Register state
    const [reg, setReg] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        npiNumber: '', licenseNumber: '', yearsExperience: '', doctorBio: '',
    });
    const [regSpecialties, setRegSpecialties] = useState([]);
    const [regError, setRegError]   = useState('');
    const [regLoading, setRegLoading] = useState(false);

    // NPI verification state
    const [npiStatus, setNpiStatus]   = useState(null); // null | 'checking' | 'verified' | 'error'
    const [npiResult, setNpiResult]   = useState(null); // NPPES provider data
    const [npiError, setNpiError]     = useState('');

    const verifyNpi = async () => {
        const npi = reg.npiNumber.trim().replace(/\D/g, '');
        if (npi.length !== 10) {
            setNpiError('NPI must be exactly 10 digits');
            setNpiStatus('error');
            return;
        }
        setNpiStatus('checking');
        setNpiError('');
        setNpiResult(null);
        try {
            const res = await fetch(`/api/npi/verify?npi=${npi}`);
            const data = await res.json();
            if (!res.ok || !data.verified) {
                setNpiStatus('error');
                setNpiError(data.error || 'NPI verification failed');
                return;
            }
            setNpiStatus('verified');
            setNpiResult(data);
            // Auto-suggest specialties from NPPES taxonomy
            if (data.specialties?.length) {
                setRegSpecialties(prev => {
                    const merged = [...new Set([...prev, ...data.specialties.filter(s => ALL_SPECIALTIES.includes(s))])];
                    return merged;
                });
            }
        } catch {
            setNpiStatus('error');
            setNpiError('Could not reach verification service. Try again.');
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setSiError('');
        setSiLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: siEmail, password: siPassword }),
            });
            const data = await res.json();
            if (!res.ok) return setSiError(data.error || 'Login failed');
            if (!data.user.isDoctor && !data.user.isVerifiedDoctor)
                return setSiError('This portal is for verified physicians only. Use the member login instead.');
            localStorage.setItem('token', data.token);
            login(data.user);
            navigate('/doctor-dashboard');
        } catch {
            setSiError('Cannot reach server. Please try again.');
        } finally {
            setSiLoading(false);
        }
    };

    const handleRegChange = (e) => setReg(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const toggleSpecialty = (s) =>
        setRegSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError('');
        if (reg.password !== reg.confirmPassword)
            return setRegError('Passwords do not match');
        if (reg.password.length < 8)
            return setRegError('Password must be at least 8 characters');
        if (!regSpecialties.length)
            return setRegError('Select at least one specialty');
        if (npiStatus !== 'verified')
            return setRegError('Please verify your NPI number before registering');
        setRegLoading(true);
        try {
            const res = await fetch('/api/doctor-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reg.name,
                    email: reg.email,
                    password: reg.password,
                    npiNumber: reg.npiNumber.trim().replace(/\D/g, ''),
                    npiVerified: true,
                    licenseNumber: reg.licenseNumber,
                    specialties: regSpecialties,
                    doctorBio: reg.doctorBio,
                    yearsExperience: parseInt(reg.yearsExperience) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) return setRegError(data.error || 'Registration failed');
            localStorage.setItem('token', data.token);
            login(data.user);
            navigate('/doctor-dashboard');
        } catch {
            setRegError('Cannot reach server. Please try again.');
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <div className="pp-shell">
            {/* Header */}
            <header className="pp-header">
                <div className="pp-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="MedBuddie" width="32" height="32" />
                    <span className="pp-brand">MedBuddie</span>
                </div>
                <div className="pp-header-right">
                    <span className="pp-header-hint">Not a physician?</span>
                    <button className="pp-header-btn" onClick={() => navigate('/signin')}>Member Login</button>
                    <button className="pp-header-btn pp-header-btn-filled" onClick={() => navigate('/signup')}>Join as Member</button>
                </div>
            </header>

            <div className="pp-body">
                {/* Left panel — branding */}
                <div className="pp-left">
                    <div className="pp-left-inner">
                        <div className="pp-icon-circle">
                            <FaUserMd size={40} color="#fff" />
                        </div>
                        <h1 className="pp-left-title">Physician Portal</h1>
                        <p className="pp-left-sub">
                            Connect with patients seeking second opinions. Review cases, exchange secure
                            messages, and conduct video consultations — all in one place.
                        </p>
                        <ul className="pp-features">
                            <li>✓ Receive patient consultation requests</li>
                            <li>✓ Secure in-app messaging</li>
                            <li>✓ One-click video &amp; audio calls</li>
                            <li>✓ Manage your availability</li>
                            <li>✓ Verified physician badge</li>
                        </ul>
                    </div>
                </div>

                {/* Right panel — auth */}
                <div className="pp-right">
                    <div className="pp-card">
                        <div className="pp-tabs">
                            <button
                                className={`pp-tab ${tab === 'signin' ? 'active' : ''}`}
                                onClick={() => setTab('signin')}
                            >Sign In</button>
                            <button
                                className={`pp-tab ${tab === 'register' ? 'active' : ''}`}
                                onClick={() => setTab('register')}
                            >Create Account</button>
                        </div>

                        {/* ── Sign In ── */}
                        {tab === 'signin' && (
                            <form className="pp-form" onSubmit={handleSignIn}>
                                <p className="pp-form-hint">Sign in with your verified physician credentials.</p>
                                {siError && <div className="pp-error">{siError}</div>}
                                <div className="pp-field">
                                    <FaEnvelope className="pp-field-icon" />
                                    <input
                                        type="email" placeholder="Physician email address"
                                        value={siEmail} onChange={e => setSiEmail(e.target.value)}
                                        required autoComplete="email"
                                    />
                                </div>
                                <div className="pp-field">
                                    <FaLock className="pp-field-icon" />
                                    <input
                                        type="password" placeholder="Password"
                                        value={siPassword} onChange={e => setSiPassword(e.target.value)}
                                        required autoComplete="current-password"
                                    />
                                </div>
                                <button type="submit" className="pp-submit" disabled={siLoading}>
                                    {siLoading ? 'Signing in…' : 'Sign In to Physician Portal'}
                                </button>
                                <p className="pp-switch-hint">
                                    New physician? <button type="button" className="pp-link" onClick={() => setTab('register')}>Create an account →</button>
                                </p>
                            </form>
                        )}

                        {/* ── Register ── */}
                        {tab === 'register' && (
                            <form className="pp-form pp-register-form" onSubmit={handleRegister}>
                                <p className="pp-form-hint">Your NPI is verified against the NPPES federal registry in real time.</p>
                                {regError && <div className="pp-error">{regError}</div>}

                                <div className="pp-field-group">
                                    <label>Full Name *</label>
                                    <input name="name" placeholder="Dr. Jane Smith" value={reg.name} onChange={handleRegChange} required />
                                </div>
                                <div className="pp-field-group">
                                    <label>Email Address *</label>
                                    <input name="email" type="email" placeholder="doctor@hospital.com" value={reg.email} onChange={handleRegChange} required />
                                </div>
                                <div className="pp-2col">
                                    <div className="pp-field-group">
                                        <label>Password *</label>
                                        <input name="password" type="password" placeholder="Min. 8 characters" value={reg.password} onChange={handleRegChange} required />
                                    </div>
                                    <div className="pp-field-group">
                                        <label>Confirm Password *</label>
                                        <input name="confirmPassword" type="password" placeholder="Repeat password" value={reg.confirmPassword} onChange={handleRegChange} required />
                                    </div>
                                </div>

                                {/* ── NPI Verification ── */}
                                <div className="pp-field-group">
                                    <label><FaIdCard size={12} /> NPI Number * <span className="pp-npi-hint">(10-digit National Provider Identifier)</span></label>
                                    <div className="pp-npi-row">
                                        <input
                                            name="npiNumber"
                                            placeholder="e.g. 1234567890"
                                            value={reg.npiNumber}
                                            onChange={e => {
                                                handleRegChange(e);
                                                setNpiStatus(null);
                                                setNpiResult(null);
                                                setNpiError('');
                                            }}
                                            maxLength={10}
                                            className={npiStatus === 'verified' ? 'pp-input-verified' : npiStatus === 'error' ? 'pp-input-error' : ''}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="pp-verify-btn"
                                            onClick={verifyNpi}
                                            disabled={npiStatus === 'checking' || !reg.npiNumber.trim()}
                                        >
                                            {npiStatus === 'checking' ? 'Verifying…' : 'Verify NPI'}
                                        </button>
                                    </div>

                                    {/* Verification result badge */}
                                    {npiStatus === 'verified' && npiResult && (
                                        <div className="pp-npi-badge pp-npi-verified">
                                            <FaCheckCircle size={14} />
                                            <div className="pp-npi-badge-body">
                                                <strong>NPI Verified</strong> — {npiResult.name}{npiResult.credential ? `, ${npiResult.credential}` : ''}
                                                {npiResult.state && <span className="pp-npi-state"> · {npiResult.city ? `${npiResult.city}, ` : ''}{npiResult.state}</span>}
                                                {npiResult.taxonomies?.length > 0 && (
                                                    <div className="pp-npi-taxonomy">{npiResult.taxonomies.join(' · ')}</div>
                                                )}
                                                {npiResult.specialties?.length > 0 && (
                                                    <div className="pp-npi-specialties-added">
                                                        ✓ Specialties auto-filled from NPPES
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {npiStatus === 'error' && (
                                        <div className="pp-npi-badge pp-npi-error">
                                            <FaTimesCircle size={14} />
                                            <span>{npiError}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pp-2col">
                                    <div className="pp-field-group">
                                        <label>State License Number <span className="pp-optional">(optional)</span></label>
                                        <input name="licenseNumber" placeholder="e.g. MD-CA-001234" value={reg.licenseNumber} onChange={handleRegChange} />
                                    </div>
                                    <div className="pp-field-group">
                                        <label>Years of Experience</label>
                                        <input name="yearsExperience" type="number" min="0" max="60" placeholder="e.g. 12" value={reg.yearsExperience} onChange={handleRegChange} />
                                    </div>
                                </div>

                                <div className="pp-field-group">
                                    <label>Specialties * <span className="pp-selected-count">({regSpecialties.length} selected)</span></label>
                                    <div className="pp-specialty-grid">
                                        {ALL_SPECIALTIES.map(s => (
                                            <button
                                                key={s} type="button"
                                                className={`pp-spec-chip ${regSpecialties.includes(s) ? 'active' : ''}`}
                                                onClick={() => toggleSpecialty(s)}
                                            >{s}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pp-field-group">
                                    <label>Professional Bio</label>
                                    <textarea
                                        name="doctorBio"
                                        placeholder="Briefly describe your background, expertise, and approach to patient care…"
                                        rows={3}
                                        value={reg.doctorBio}
                                        onChange={handleRegChange}
                                    />
                                </div>

                                <button type="submit" className="pp-submit" disabled={regLoading || npiStatus !== 'verified'}>
                                    {regLoading ? 'Creating account…' : 'Create Verified Physician Account'}
                                </button>
                                <p className="pp-switch-hint">
                                    Already have an account? <button type="button" className="pp-link" onClick={() => setTab('signin')}>Sign in →</button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
