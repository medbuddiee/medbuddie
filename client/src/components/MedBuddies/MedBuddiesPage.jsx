import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import UserAvatar from '../common/UserAvatar';
import { useUser } from '../../context/UserContext';
import { FaUserPlus, FaUserCheck, FaSearch, FaUserMd } from 'react-icons/fa';
import './MedBuddies.css';

export default function MedBuddiesPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [tab, setTab]           = useState('discover');  // 'discover' | 'following' | 'followers'
    const [people, setPeople]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [query, setQuery]       = useState('');
    const [toggling, setToggling] = useState({});

    const token = localStorage.getItem('token');

    const fetchPeople = useCallback(async (q = '') => {
        setLoading(true);
        try {
            let url = '/api/users';
            if (tab === 'following') url = `/api/users/${user.id}/following`;
            if (tab === 'followers') url = `/api/users/${user.id}/followers`;
            if (q) url += (url.includes('?') ? '&' : '?') + `q=${encodeURIComponent(q)}`;

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) setPeople(await res.json());
        } catch { /* silent */ } finally { setLoading(false); }
    }, [tab, user?.id, token]);

    useEffect(() => { fetchPeople(query); }, [tab]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPeople(query);
    };

    const toggleFollow = async (personId) => {
        if (!token) return;
        setToggling(t => ({ ...t, [personId]: true }));
        try {
            const res = await fetch(`/api/users/${personId}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { following } = await res.json();
                setPeople(prev => prev.map(p =>
                    p.id === personId
                        ? { ...p, isFollowing: following, followersCount: p.followersCount + (following ? 1 : -1) }
                        : p
                ));
            }
        } catch { /* silent */ } finally {
            setToggling(t => ({ ...t, [personId]: false }));
        }
    };

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="buddies-main">
                    <div className="buddies-header">
                        <h2 className="buddies-title">MedBuddies</h2>
                        <p className="buddies-subtitle">Connect with patients, caregivers, and medical professionals</p>
                    </div>

                    {/* Tabs */}
                    <div className="buddies-tabs">
                        {[
                            { key: 'discover',  label: 'Discover People' },
                            { key: 'following', label: `Following` },
                            { key: 'followers', label: `Followers` },
                        ].map(t => (
                            <button
                                key={t.key}
                                className={`buddies-tab ${tab === t.key ? 'active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <form className="buddies-search-form" onSubmit={handleSearch}>
                        <div className="buddies-search-wrap">
                            <FaSearch className="buddies-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or username…"
                                className="buddies-search-input"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="buddies-search-btn">Search</button>
                    </form>

                    {/* People grid */}
                    {loading ? (
                        <p className="buddies-loading">Loading…</p>
                    ) : people.length === 0 ? (
                        <div className="buddies-empty">
                            <p>{tab === 'discover' ? 'No people found.' : tab === 'following' ? "You're not following anyone yet." : "No followers yet."}</p>
                        </div>
                    ) : (
                        <div className="buddies-grid">
                            {people.map(person => (
                                <div key={person.id} className="buddy-card">
                                    <div className="buddy-card-top">
                                        <UserAvatar name={person.name} avatarUrl={person.avatarUrl} size={56} />
                                        {person.isDoctor && (
                                            <span className="buddy-doctor-badge">
                                                <FaUserMd size={11} /> Doctor
                                            </span>
                                        )}
                                    </div>
                                    <div className="buddy-card-info">
                                        <p className="buddy-name">{person.name}</p>
                                        {person.username && <p className="buddy-username">@{person.username}</p>}
                                        {person.bio && <p className="buddy-bio">{person.bio}</p>}
                                        {person.isDoctor && person.doctorSpecialties?.length > 0 && (
                                            <p className="buddy-specialties">
                                                {person.doctorSpecialties.slice(0, 2).join(', ')}
                                            </p>
                                        )}
                                        <div className="buddy-stats">
                                            <span>{person.followersCount || 0} followers</span>
                                            <span>{person.followingCount || 0} following</span>
                                        </div>
                                    </div>
                                    {person.id !== user?.id && (
                                        <button
                                            className={`buddy-follow-btn ${person.isFollowing ? 'following' : ''}`}
                                            onClick={() => toggleFollow(person.id)}
                                            disabled={toggling[person.id]}
                                        >
                                            {person.isFollowing
                                                ? <><FaUserCheck size={13} /> Following</>
                                                : <><FaUserPlus size={13} /> Follow</>
                                            }
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
