import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Profile.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaSearch, FaCog, FaUserCircle } from 'react-icons/fa';

const TABS = ['Health Overview', 'My Posts', 'Communities & Followers', 'Second Opinions'];

// Sample activity/diet — in a real app these would come from a health-tracking API
const ACTIVITY = { steps: '7,856', caloriesBurned: '480 kcal', workoutTime: '40 min' };
const DIET = {
    calories: '1,850 g',
    carbohydrates: '235 g',
    protein: '96 g',
    fat: '56 g',
};

export default function ProfilePage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    if (!user) return <div className="loading">Loading...</div>;

    const meds = user.medications?.filter((m) => m.name) || [];

    return (
        <div className="profile-shell">
            {/* ── Top Navigation ── */}
            <header className="profile-topnav">
                <div className="profile-topnav-left">
                    <img src={logo} alt="MedBuddie" width="32" height="32" />
                    <span className="profile-topnav-brand">MedBuddie</span>
                </div>
                <div className="profile-topnav-right">
                    <button className="icon-btn" aria-label="Search"><FaSearch /></button>
                    <button className="icon-btn" aria-label="Settings"><FaCog /></button>
                    <button className="icon-btn" aria-label="Profile"><FaUserCircle size={24} /></button>
                </div>
            </header>

            <div className="profile-page">
                {/* ── Profile Header ── */}
                <div className="profile-header">
                    <div className="profile-info">
                        <img
                            src="https://placehold.co/200x200"
                            alt="avatar"
                            className="profile-avatar"
                        />
                        <div>
                            <h2 className="profile-name">{user.name || 'Jane Doe'}</h2>
                            <p className="profile-subtitle">{user.bio || 'Living with Type 2 Diabetes'}</p>
                        </div>
                    </div>
                    <button className="edit-button" onClick={() => navigate('/edit-profile')}>
                        Edit Profile
                    </button>
                </div>

                {/* ── Nav Tabs ── */}
                <div className="profile-tabs">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab}
                            className={activeTab === i ? 'active' : ''}
                            onClick={() => setActiveTab(i)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 0 && (
                    <>
                        {/* ── Personal Stats ── */}
                        <div className="card">
                            <h4 className="card-title">Personal Stats</h4>
                            <div className="divider" />
                            <div className="stats-grid-2x2">
                                <div className="stat-item">
                                    <span className="stat-label">Weight</span>
                                    <span className="stat-value">{user.weight ? `${user.weight} lbs.` : '—'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Blood Pressure</span>
                                    <span className="stat-value">{user.bloodPressure || '—'} mmHg</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Height</span>
                                    <span className="stat-value">{user.height || '—'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">HbA1c</span>
                                    <span className="stat-value">{user.hba1c ? `${user.hba1c} %` : '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Activity + Diet row ── */}
                        <div className="two-col-row">
                            {/* Activity Summary */}
                            <div className="card">
                                <h4 className="card-title">Activity Summary</h4>
                                <div className="divider" />
                                <div className="summary-list">
                                    <div className="summary-item">
                                        <span>Steps</span>
                                        <span>{ACTIVITY.steps}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Calories burned</span>
                                        <span>{ACTIVITY.caloriesBurned}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Workout time</span>
                                        <span>{ACTIVITY.workoutTime}</span>
                                    </div>
                                </div>

                                {/* Medications inline (compact) */}
                                <h4 className="card-title" style={{ marginTop: '1rem' }}>Medications</h4>
                                <div className="divider" />
                                {meds.length > 0 ? (
                                    <div className="meds-compact">
                                        {meds.map((med, i) => (
                                            <div key={i} className="med-compact-item">
                                                <span className="med-name">{med.name}</span>
                                                <span className="med-check">✓</span>
                                                <span className="med-time">
                                                    {['8:04 AM', '8:06 AM', '8:08 AM'][i] || ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-text">No medications listed.</p>
                                )}
                            </div>

                            {/* Diet Summary */}
                            <div className="card">
                                <h4 className="card-title">Diet Summary</h4>
                                <div className="divider" />
                                <div className="summary-list">
                                    <div className="summary-item">
                                        <span>Calories consumed</span>
                                        <span>{DIET.calories}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Carbohydrates</span>
                                        <span>{DIET.carbohydrates}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Protein</span>
                                        <span>{DIET.protein}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Fat</span>
                                        <span>{DIET.fat}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Intermittent Fasting</span>
                                        <span className="if-badges">
                                            <span className="if-badge">16 hr</span>
                                            <span className="if-badge">8 h</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Full Medications table ── */}
                        <div className="card">
                            <h4 className="card-title">Medications</h4>
                            <div className="divider" />
                            {meds.length > 0 ? (
                                <table className="med-table">
                                    <tbody>
                                        {meds.map((med, i) => (
                                            <tr key={i}>
                                                <td className="med-name">{med.name}</td>
                                                <td className="med-day">Today</td>
                                                <td className="med-time-col">
                                                    {['8:04 AM', '8:06 AM', '8:08 AM'][i] || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-text">No medications listed.</p>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 1 && (
                    <div className="card">
                        <p className="empty-text">No posts yet.</p>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="card">
                        <p className="empty-text">No communities or followers yet.</p>
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="card">
                        <p className="empty-text">No second opinions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
