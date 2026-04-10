import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Profile.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaCog } from 'react-icons/fa';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'];

export default function EditProfilePage() {
    const { user, updateUser } = useUser();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                bio: user.bio || '',
                weight: user.weight || '',
                height: user.height || '',
                bmi: user.bmi || '',
                bloodPressure: user.bloodPressure || '',
                hba1c: user.hba1c || '',
                lipidPanel: user.lipidPanel || '',
                medications: user.medications?.length
                    ? user.medications
                    : [
                          { name: '', frequency: '' },
                          { name: '', frequency: '' },
                          { name: '', frequency: '' },
                      ],
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleMedChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            medications: prev.medications.map((m, i) =>
                i === index ? { ...m, [field]: value } : m
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) return alert('User not loaded');
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, ...form }),
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || 'Update failed');
            updateUser(data);
            navigate('/profile');
        } catch {
            alert('Server error');
        }
    };

    if (!form) return <div className="loading">Loading...</div>;

    return (
        <div className="edit-page-shell">
            {/* ── Header ── */}
            <header className="edit-header">
                <div className="edit-header-logo">
                    <img src={logo} alt="MedBuddie" width="32" height="32" />
                    <span className="edit-brand">MedBuddie</span>
                </div>
                <button className="icon-btn" aria-label="Settings">
                    <FaCog size={20} color="#888" />
                </button>
            </header>

            {/* ── Form ── */}
            <div className="edit-profile-page">
                <form className="edit-profile-form" onSubmit={handleSubmit}>
                    {/* Avatar */}
                    <div className="avatar-container">
                        <img src="https://placehold.co/400x400" alt="Profile" className="avatar" />
                        <button type="button" className="change-photo-btn">Change Photo</button>
                    </div>

                    {/* Name */}
                    <h4 className="field-section-label">Name</h4>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="full-input"
                        required
                    />

                    {/* Bio */}
                    <h4 className="field-section-label">Bio</h4>
                    <input
                        type="text"
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        className="full-input"
                    />

                    {/* Personal Information */}
                    <h4 className="field-section-label">Personal Information</h4>
                    <div className="grid-3">
                        <div className="field-col">
                            <label>Weight</label>
                            <input type="text" name="weight" value={form.weight} onChange={handleChange} />
                        </div>
                        <div className="field-col">
                            <label>Height</label>
                            <input type="text" name="height" value={form.height} onChange={handleChange} />
                        </div>
                        <div className="field-col">
                            <label>BMI</label>
                            <input type="text" name="bmi" value={form.bmi} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Health Data */}
                    <h4 className="field-section-label">Health Data</h4>
                    <div className="grid-3">
                        <div className="field-col">
                            <label>Blood Pressure</label>
                            <input type="text" name="bloodPressure" value={form.bloodPressure} onChange={handleChange} placeholder="e.g. 135/85 mmHg" />
                        </div>
                        <div className="field-col">
                            <label>HbA1c %</label>
                            <input type="text" name="hba1c" value={form.hba1c} onChange={handleChange} placeholder="e.g. 7.1" />
                        </div>
                        <div className="field-col">
                            <label>Lipid Panel</label>
                            <input type="text" name="lipidPanel" value={form.lipidPanel} onChange={handleChange} placeholder="e.g. Normal" />
                        </div>
                    </div>

                    {/* Medications */}
                    <h4 className="field-section-label">Medications</h4>
                    {form.medications.map((med, i) => (
                        <div key={i} className="med-row">
                            <input
                                type="text"
                                value={med.name}
                                placeholder="Medication name"
                                onChange={(e) => handleMedChange(i, 'name', e.target.value)}
                                className="med-name-input"
                            />
                            <div className="med-freq-wrapper">
                                <select
                                    value={med.frequency}
                                    onChange={(e) => handleMedChange(i, 'frequency', e.target.value)}
                                    className="med-freq-select"
                                >
                                    <option value="">Select frequency</option>
                                    {FREQUENCIES.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}

                    {/* Action buttons */}
                    <div className="buttons-row">
                        <button type="submit" className="save-button">Save Changes</button>
                        <button type="button" className="cancel-button" onClick={() => navigate('/profile')}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
