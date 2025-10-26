// client/src/components/Profile/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import './Profile.css';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(setProfile)
            .catch(console.error);
    }, []);

    if (!profile) return <div className="loading">Loading…</div>;

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>{profile.name}</h1>
                <p>{profile.username}</p>
                <p>DOB: {new Date(profile.dob).toLocaleDateString()}</p>
                <button onClick={() => window.location.href = '/edit-profile'}>
                    Edit Profile
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Weight</h3>
                    <p>{profile.weight} lbs</p>
                </div>
                <div className="stat-card">
                    <h3>Height</h3>
                    <p>{profile.height}</p>
                </div>
                <div className="stat-card">
                    <h3>BMI</h3>
                    <p>{profile.bmi}</p>
                </div>
                <div className="stat-card">
                    <h3>Blood Pressure</h3>
                    <p>{profile.blood_pressure}</p>
                </div>
            </div>
        </div>
    );
}
