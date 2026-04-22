import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './Profile.css';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'];

export default function EditProfilePage() {
    const { user, updateUser } = useUser();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const photoInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            // Initialise avatar preview from saved profile
            if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
            setForm({
                name:          user.name          || '',
                bio:           user.bio           || '',
                weight:        user.weight        || '',
                height:        user.height        || '',
                bmi:           user.bmi           || '',
                // Support both camelCase (from API) and snake_case (legacy localStorage)
                bloodPressure: user.bloodPressure || user.blood_pressure || '',
                hba1c:         user.hba1c         || '',
                lipidPanel:    user.lipidPanel    || user.lipid_panel    || '',
                medications:   user.medications?.filter(m => m.name || m.frequency).length
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
        if (!user?.id) return setSaveError('User session not found — please sign in again.');

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const token = localStorage.getItem('token');

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    // Filter out empty medication rows before saving
                    medications: form.medications.filter(m => m.name.trim()),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveError(data.error || 'Update failed — please try again.');
                return;
            }

            // Merge saved data back into context (preserves email, username, token etc.)
            updateUser(data);
            setSaveSuccess(true);

            // Navigate back after a short delay so user sees the success message
            setTimeout(() => navigate('/profile'), 800);

        } catch {
            setSaveError('Cannot reach the server. Make sure the backend is running.');
        } finally {
            setSaving(false);
        }
    };

    if (!form) return <div className="loading">Loading profile…</div>;

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
            <Sidebar />
            <div className="edit-profile-page profile-page-scrollable">
                <form className="edit-profile-form" onSubmit={handleSubmit}>
                    {/* Avatar */}
                    <div className="avatar-container">
                        <img
                            src={avatarPreview || 'https://placehold.co/400x400'}
                            alt="Profile"
                            className="avatar"
                            style={{ cursor: 'pointer' }}
                            onClick={() => photoInputRef.current.click()}
                            title="Click to change photo"
                        />
                        <input
                            type="file"
                            ref={photoInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                // Show instant local preview
                                setAvatarPreview(URL.createObjectURL(file));
                                e.target.value = '';
                                // Upload to server
                                const token = localStorage.getItem('token');
                                if (!token) return;
                                setUploadingAvatar(true);
                                try {
                                    const formData = new FormData();
                                    formData.append('avatar', file);
                                    const res = await fetch('/api/profile/avatar', {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` },
                                        body: formData,
                                    });
                                    if (res.ok) {
                                        const { avatarUrl } = await res.json();
                                        // Persist the server URL so it survives refresh
                                        setAvatarPreview(avatarUrl);
                                        updateUser({ ...user, avatarUrl });
                                    }
                                } catch { /* silent — local preview still shown */ }
                                finally { setUploadingAvatar(false); }
                            }}
                        />
                        <button
                            type="button"
                            className="change-photo-btn"
                            onClick={() => photoInputRef.current.click()}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                        </button>
                    </div>

                    {/* Status messages */}
                    {saveError   && <p className="form-error">{saveError}</p>}
                    {saveSuccess && <p className="form-success">Profile saved!</p>}

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
                        placeholder="Tell us a bit about yourself…"
                    />

                    {/* Personal Information */}
                    <h4 className="field-section-label">Personal Information</h4>
                    <div className="grid-3">
                        <div className="field-col">
                            <label>Weight</label>
                            <input type="text" name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 172 lbs" />
                        </div>
                        <div className="field-col">
                            <label>Height</label>
                            <input type="text" name="height" value={form.height} onChange={handleChange} placeholder="e.g. 5'7&quot;" />
                        </div>
                        <div className="field-col">
                            <label>BMI</label>
                            <input type="text" name="bmi" value={form.bmi} onChange={handleChange} placeholder="e.g. 26.9" />
                        </div>
                    </div>

                    {/* Health Data */}
                    <h4 className="field-section-label">Health Data</h4>
                    <div className="grid-3">
                        <div className="field-col">
                            <label>Blood Pressure</label>
                            <input type="text" name="bloodPressure" value={form.bloodPressure} onChange={handleChange} placeholder="e.g. 122/78" />
                        </div>
                        <div className="field-col">
                            <label>HbA1c %</label>
                            <input type="text" name="hba1c" value={form.hba1c} onChange={handleChange} placeholder="e.g. 6.8" />
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
                        <button type="submit" className="save-button" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate('/profile')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}
