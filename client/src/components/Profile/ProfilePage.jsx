// client/src/components/Profile/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import './Profile.css';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetch('/api/profile')
            .then((res) => res.json())
            .then(setProfile)
            .catch(console.error);
    }, []);

    if (!profile) return <div className="loading">Loading…</div>;

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-name">
                    <h1>{profile.name}</h1>
                    <p>{profile.bio}</p>
                </div>
                <button onClick={() => (window.location.href = '/edit-profile')}>
                    Edit Profile
                </button>
            </div>

            <h3>Personal Stats</h3>
            <div className="stats-grid">
                <div className="stat-card">
                    <h4>Weight</h4>
                    <p>{profile.weight || '—'} lbs</p>
                </div>
                <div className="stat-card">
                    <h4>Height</h4>
                    <p>{profile.height || '—'}</p>
                </div>
                <div className="stat-card">
                    <h4>BMI</h4>
                    <p>{profile.bmi || '—'}</p>
                </div>
                <div className="stat-card">
                    <h4>Blood Pressure</h4>
                    <p>{profile.bloodPressure || '—'}</p>
                </div>
                <div className="stat-card">
                    <h4>Lipid Panel</h4>
                    <p>{profile.lipidPanel || '—'}</p>
                </div>
            </div>

            <h3>Medications</h3>
            <ul className="medications-list">
                {profile.medications && profile.medications.length > 0 ? (
                    profile.medications.map((med, idx) => (
                        <li key={idx}>
                            {med.name} – {med.frequency}
                        </li>
                    ))
                ) : (
                    <li>No medications listed.</li>
                )}
            </ul>
        </div>
    );
}
