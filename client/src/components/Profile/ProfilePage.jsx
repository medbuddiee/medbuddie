import React from 'react';
import { useUser } from '../../context/UserContext';
import './Profile.css';

export default function ProfilePage() {
    const { user } = useUser();

    if (!user) return <div className="loading">Loading...</div>;

    return (
        <div className="profile-page">
            {/* HEADER */}
            <div className="profile-header">
                <div className="profile-info">
                    <img
                        src="https://placehold.co/200x200"
                        alt="avatar"
                        className="profile-avatar"
                    />
                    <div>
                        <h2>{user.name}</h2>
                        <p className="profile-subtitle">{user.bio}</p>
                    </div>
                </div>

                <button
                    className="edit-button"
                    onClick={() => (window.location.href = "/edit-profile")}
                >
                    Edit Profile
                </button>
            </div>

            {/* NAV TABS */}
            <div className="profile-tabs">
                <button className="active">Health Overview</button>
                <button>My Posts</button>
                <button>Communities & Followers</button>
                <button>Second Opinions</button>
            </div>

            {/* PERSONAL STATS CARD */}
            <div className="card">
                <h4>Personal Stats</h4>
                <div className="divider" />

                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">Weight:</span>
                        <span className="stat-value">{user.weight || "—"} lbs</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Height:</span>
                        <span className="stat-value">{user.height || "—"}</span>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">BMI:</span>
                        <span className="stat-value">{user.bmi || "—"}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Blood Pressure:</span>
                        <span className="stat-value">{user.bloodPressure || "—"}</span>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">Lipid Panel:</span>
                        <span className="stat-value">{user.lipidPanel || "—"}</span>
                    </div>
                </div>
            </div>

            {/* MEDICATIONS CARD */}
            <div className="card">
                <h4>Medications</h4>
                <div className="divider" />

                {user.medications?.length > 0 ? (
                    <ul className="medications-list">
                        {user.medications.map((med, idx) => (
                            <li key={idx} className="med-item">
                                <span className="med-name">{med.name}</span>
                                <span className="med-value">{med.frequency}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No medications listed.</p>
                )}
            </div>
        </div>
    );
}
