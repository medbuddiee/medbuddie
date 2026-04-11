import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Profile.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaSearch, FaCog, FaUserCircle } from 'react-icons/fa';

const TABS = ['Health Overview', 'My Posts', 'Communities & Followers', 'Second Opinions'];

// Sample activity/diet — would come from a dedicated health-tracking API in production
const ACTIVITY = { steps: '7,856', caloriesBurned: '480 kcal', workoutTime: '40 min' };
const DIET = {
    calories: '1,850 g',
    carbohydrates: '235 g',
    protein: '96 g',
    fat: '56 g',
};

export default function ProfilePage() {
    const { user, updateUser } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch full profile from API on mount
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Fall back to userId query param if no token (dev mode)
                const url = token
                    ? '/api/profile'
                    : `/api/profile?userId=${user.id}`;

                const res = await fetch(url, { headers });

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    updateUser(data); // keep context in sync
                } else {
                    // Use whatever is already in context
                    setProfile(user);
                }
            } catch {
                setProfile(user); // fallback to context on network error
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch user's posts when "My Posts" tab is selected
    useEffect(() => {
        if (activeTab !== 1 || !user?.id) return;

        const fetchPosts = async () => {
            try {
                const res = await fetch(`/api/posts?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                }
            } catch {
                // silently fail
            }
        };

        fetchPosts();
    }, [activeTab, user?.id]);

    if (!user) return <div className="loading">Loading...</div>;

    // Merge fetched profile with context (profile wins when available)
    const display = profile || user;
    const meds = display.medications?.filter((m) => m.name) || [];

    return (
        <div className="profile-shell">
            {/* ── Top Navigation ── */}
            <header className="profile-topnav">
                <div
                    className="profile-topnav-left"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/dashboard')}
                >
                    <img src={logo} alt="MedBuddie" width="32" height="32" />
                    <span className="profile-topnav-brand">MedBuddie</span>
                </div>
                <div className="profile-topnav-right">
                    <button
                        className="icon-btn"
                        aria-label="Search"
                        title="Go to dashboard to search"
                        onClick={() => navigate('/dashboard')}
                    >
                        <FaSearch />
                    </button>
                    <button
                        className="icon-btn"
                        aria-label="Settings"
                        title="Edit profile"
                        onClick={() => navigate('/edit-profile')}
                    >
                        <FaCog />
                    </button>
                    <button
                        className="icon-btn"
                        aria-label="Dashboard"
                        title="Back to dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        <FaUserCircle size={24} />
                    </button>
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
                            <h2 className="profile-name">{display.name || 'Jane Doe'}</h2>
                            <p className="profile-subtitle">{display.bio || 'Living with Type 2 Diabetes'}</p>
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

                {/* ── Health Overview ── */}
                {activeTab === 0 && (
                    <>
                        {loading && <p className="loading-inline">Loading profile…</p>}
                        {error && <p className="error-text">{error}</p>}

                        {/* Personal Stats */}
                        <div className="card">
                            <h4 className="card-title">Personal Stats</h4>
                            <div className="divider" />
                            <div className="stats-grid-2x2">
                                <div className="stat-item">
                                    <span className="stat-label">Weight</span>
                                    <span className="stat-value">{display.weight ? `${display.weight} lbs.` : '—'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Blood Pressure</span>
                                    <span className="stat-value">{display.bloodPressure ? `${display.bloodPressure} mmHg` : '—'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Height</span>
                                    <span className="stat-value">{display.height || '—'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">HbA1c</span>
                                    <span className="stat-value">{display.hba1c ? `${display.hba1c} %` : '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Activity + Diet row */}
                        <div className="two-col-row">
                            {/* Activity Summary */}
                            <div className="card">
                                <h4 className="card-title">Activity Summary</h4>
                                <div className="divider" />
                                <div className="summary-list">
                                    {[
                                        ['Steps', ACTIVITY.steps],
                                        ['Calories burned', ACTIVITY.caloriesBurned],
                                        ['Workout time', ACTIVITY.workoutTime],
                                    ].map(([label, val]) => (
                                        <div key={label} className="summary-item">
                                            <span>{label}</span><span>{val}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Medications compact */}
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
                                    {[
                                        ['Calories consumed', DIET.calories],
                                        ['Carbohydrates', DIET.carbohydrates],
                                        ['Protein', DIET.protein],
                                        ['Fat', DIET.fat],
                                    ].map(([label, val]) => (
                                        <div key={label} className="summary-item">
                                            <span>{label}</span><span>{val}</span>
                                        </div>
                                    ))}
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

                        {/* Full Medications table */}
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
                                <p className="empty-text">No medications listed. <button className="inline-link" onClick={() => navigate('/edit-profile')}>Add medications →</button></p>
                            )}
                        </div>
                    </>
                )}

                {/* ── My Posts ── */}
                {activeTab === 1 && (
                    <div className="card">
                        <h4 className="card-title">My Posts</h4>
                        <div className="divider" />
                        {posts.length === 0 ? (
                            <p className="empty-text">No posts yet. Share your health journey on the <button className="inline-link" onClick={() => navigate('/dashboard')}>Health Feed →</button></p>
                        ) : (
                            <div className="posts-list">
                                {posts.map((post) => (
                                    <div key={post.id} className="profile-post-item">
                                        <p className="profile-post-content">{post.content}</p>
                                        <div className="profile-post-meta">
                                            {(post.tags || []).map((tag, i) => (
                                                <span key={i} className="tag">{tag}</span>
                                            ))}
                                            <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Communities & Followers ── */}
                {activeTab === 2 && (
                    <div className="card">
                        <h4 className="card-title">Communities & Followers</h4>
                        <div className="divider" />
                        <p className="empty-text">No communities or followers yet. Browse <button className="inline-link" onClick={() => navigate('/dashboard')}>communities →</button></p>
                    </div>
                )}

                {/* ── Second Opinions ── */}
                {activeTab === 3 && (
                    <div className="card">
                        <h4 className="card-title">Second Opinions</h4>
                        <div className="divider" />
                        <p className="empty-text">No second opinions requested yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
