import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import { useUser } from '../../context/UserContext';
import { FaUserMd, FaCheckCircle, FaStar, FaGraduationCap, FaIdCard } from 'react-icons/fa';
import './DoctorPortal.css';

const SPECIALTIES = [
    'Cardiology', 'Neurology', 'Oncology', 'Endocrinology', 'Gastroenterology',
    'Pulmonology', 'Nephrology', 'Orthopedics', 'Dermatology', 'Psychiatry',
    'Pediatrics', 'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Urology',
    'Rheumatology', 'Hematology', 'Infectious Disease', 'Geriatrics', 'Emergency Medicine',
    'General Practice', 'Internal Medicine', 'Radiology', 'Anesthesiology', 'Surgery',
];

export default function DoctorPortalPage() {
    const { user, updateUser } = useUser();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [selected, setSelected]   = useState(user?.doctorSpecialties || []);
    const [licenseNum, setLicenseNum] = useState(user?.licenseNumber || '');
    const [doctorBio, setDoctorBio]   = useState(user?.doctorBio || '');
    const [yearsExp, setYearsExp]     = useState(user?.yearsExperience || '');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);

    if (user?.isDoctor && user?.isVerifiedDoctor && !success) {
        return (
            <div className="dashboard-shell">
                <TopNav searchQuery="" onSearch={() => {}} />
                <div className="dashboard-body">
                    <Sidebar />
                    <main className="dp-main">
                        <div className="dp-verified-banner">
                            <FaCheckCircle size={40} color="#2e7d32" />
                            <h2>You are a verified doctor</h2>
                            <p>Your profile shows a verified doctor badge. Patients can request consultations with you from the Second Opinion section.</p>
                            <div className="dp-specialties-display">
                                {(user.doctorSpecialties || []).map(s => (
                                    <span key={s} className="dp-spec-chip">{s}</span>
                                ))}
                            </div>
                            <button className="dp-nav-btn" onClick={() => navigate('/second-opinion')}>
                                View My Consultations
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const toggleSpecialty = (s) => {
        setSelected(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selected.length || !licenseNum.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/users/doctor-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    specialties: selected,
                    licenseNumber: licenseNum.trim(),
                    doctorBio: doctorBio.trim(),
                    yearsExperience: parseInt(yearsExp) || 0,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                updateUser({
                    isDoctor: true,
                    isVerifiedDoctor: true,
                    doctorSpecialties: updated.doctorSpecialties,
                    licenseNumber: updated.licenseNumber,
                    doctorBio: updated.doctorBio,
                    yearsExperience: updated.yearsExperience,
                });
                setSuccess(true);
            } else {
                const d = await res.json();
                alert(d.error || 'Registration failed');
            }
        } catch { alert('Network error'); } finally { setSubmitting(false); }
    };

    if (success) {
        return (
            <div className="dashboard-shell">
                <TopNav searchQuery="" onSearch={() => {}} />
                <div className="dashboard-body">
                    <Sidebar />
                    <main className="dp-main">
                        <div className="dp-verified-banner">
                            <FaCheckCircle size={48} color="#2e7d32" />
                            <h2>Welcome to the Doctor Network!</h2>
                            <p>Your doctor profile is now active. Patients will be able to find you and request consultations.</p>
                            <button className="dp-nav-btn" onClick={() => navigate('/second-opinion')}>
                                View My Consultations
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="dp-main">
                    {/* Hero */}
                    <div className="dp-hero">
                        <div className="dp-hero-icon"><FaUserMd size={36} color="#005c55" /></div>
                        <div>
                            <h2 className="dp-hero-title">Doctor Registration Portal</h2>
                            <p className="dp-hero-sub">Register your medical credentials to offer second opinions and consultations to patients on MedBuddie.</p>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="dp-benefits">
                        {[
                            { icon: <FaStar color="#f9a825" />,     text: 'Get a Verified Doctor badge on all your posts and profile' },
                            { icon: <FaUserMd color="#005c55" />,  text: 'Patients can request second opinions directly from you' },
                            { icon: <FaGraduationCap color="#1565c0" />, text: 'Be listed in the specialist directory by specialty' },
                        ].map((b, i) => (
                            <div key={i} className="dp-benefit-row">
                                <span className="dp-benefit-icon">{b.icon}</span>
                                <span>{b.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <form className="dp-form" onSubmit={handleSubmit}>
                        <h3 className="dp-section-title"><FaIdCard size={15} /> Medical License</h3>
                        <div className="dp-field">
                            <label className="dp-label">License Number *</label>
                            <input
                                className="dp-input"
                                placeholder="e.g. MD-123456"
                                value={licenseNum}
                                onChange={e => setLicenseNum(e.target.value)}
                                required
                            />
                            <p className="dp-hint">Your state/national medical license number. We display this on your profile for patient trust.</p>
                        </div>

                        <div className="dp-field">
                            <label className="dp-label">Years of Experience</label>
                            <input
                                className="dp-input"
                                type="number"
                                min="0"
                                max="60"
                                placeholder="e.g. 12"
                                value={yearsExp}
                                onChange={e => setYearsExp(e.target.value)}
                            />
                        </div>

                        <div className="dp-field">
                            <label className="dp-label">Professional Bio</label>
                            <textarea
                                className="dp-input"
                                rows={3}
                                placeholder="Briefly describe your background, hospital affiliations, and areas of focus…"
                                value={doctorBio}
                                onChange={e => setDoctorBio(e.target.value)}
                                maxLength={600}
                            />
                        </div>

                        <h3 className="dp-section-title"><FaGraduationCap size={15} /> Specialties * <span className="dp-hint-inline">(select all that apply)</span></h3>
                        <div className="dp-specialty-grid">
                            {SPECIALTIES.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`dp-spec-btn ${selected.includes(s) ? 'active' : ''}`}
                                    onClick={() => toggleSpecialty(s)}
                                >
                                    {selected.includes(s) && <FaCheckCircle size={11} />}
                                    {s}
                                </button>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <p className="dp-selected-count">{selected.length} specialt{selected.length === 1 ? 'y' : 'ies'} selected</p>
                        )}

                        <button
                            type="submit"
                            className="dp-submit-btn"
                            disabled={submitting || !selected.length || !licenseNum.trim()}
                        >
                            {submitting ? 'Registering…' : 'Register as a Verified Doctor'}
                        </button>
                    </form>
                </main>
            </div>
        </div>
    );
}
