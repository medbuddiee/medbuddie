import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import { useUser } from '../../context/UserContext';
import { FaPlus, FaUsers, FaSearch, FaTimes } from 'react-icons/fa';
import './Communities.css';

const CATEGORIES = ['All', 'Cardiology', 'Oncology', 'Neurology', 'Endocrinology',
    'Respiratory', 'Gastroenterology', 'Mental Health', 'Pediatrics',
    'Orthopedics', 'Dermatology', 'General'];

const CATEGORY_ICONS = {
    Cardiology: '❤️', Oncology: '🎗️', Neurology: '🧠', Endocrinology: '⚗️',
    Respiratory: '🫁', Gastroenterology: '🫀', 'Mental Health': '🧘',
    Pediatrics: '👶', Orthopedics: '🦴', Dermatology: '🩹', General: '🏥',
};

export default function CommunitiesPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [tab, setTab]               = useState('browse');
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [category, setCategory]     = useState('All');
    const [query, setQuery]           = useState('');
    const [toggling, setToggling]     = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm]             = useState({ name: '', description: '', category: 'General', icon: '🏥' });
    const [creating, setCreating]     = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/communities?limit=60';
            if (tab === 'mine') {
                // Filter communities where isMember
            }
            if (category !== 'All') url += `&category=${encodeURIComponent(category)}`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setCommunities(tab === 'mine' ? data.filter(c => c.isMember) : data);
            }
        } catch { /* silent */ } finally { setLoading(false); }
    }, [tab, category, token]);

    useEffect(() => { load(); }, [tab, category]);

    const handleSearch = (e) => { e.preventDefault(); load(); };

    const toggleJoin = async (id, e) => {
        e.stopPropagation();
        if (!token) return;
        setToggling(t => ({ ...t, [id]: true }));
        try {
            const res = await fetch(`/api/communities/${id}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { member } = await res.json();
                setCommunities(prev => prev.map(c =>
                    c.id === id
                        ? { ...c, isMember: member, membersCount: c.membersCount + (member ? 1 : -1) }
                        : c
                ));
            }
        } catch { /* silent */ } finally {
            setToggling(t => ({ ...t, [id]: false }));
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const newCommunity = await res.json();
                setCommunities(prev => [newCommunity, ...prev]);
                setShowCreate(false);
                setForm({ name: '', description: '', category: 'General', icon: '🏥' });
                navigate(`/communities/${newCommunity.id}`);
            }
        } catch { /* silent */ } finally { setCreating(false); }
    };

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="comm-main">
                    <div className="comm-header">
                        <div>
                            <h2 className="comm-title">Medical Communities</h2>
                            <p className="comm-subtitle">Join communities around conditions, specialties & health topics</p>
                        </div>
                        <button className="comm-create-btn" onClick={() => setShowCreate(true)}>
                            <FaPlus size={13} /> Create Community
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="comm-tabs">
                        {[{ key: 'browse', label: 'Browse All' }, { key: 'mine', label: 'My Communities' }].map(t => (
                            <button key={t.key} className={`comm-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Category filter */}
                    <div className="comm-categories">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`comm-cat-btn ${category === cat ? 'active' : ''}`}
                                onClick={() => setCategory(cat)}
                            >
                                {CATEGORY_ICONS[cat] && <span>{CATEGORY_ICONS[cat]}</span>}
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <form className="comm-search-form" onSubmit={handleSearch}>
                        <div className="comm-search-wrap">
                            <FaSearch className="comm-search-icon" />
                            <input
                                type="text"
                                placeholder="Search communities…"
                                className="comm-search-input"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                    </form>

                    {/* Grid */}
                    {loading ? (
                        <p className="comm-loading">Loading…</p>
                    ) : communities.length === 0 ? (
                        <div className="comm-empty">
                            <FaUsers size={40} color="#ccc" />
                            <p>{tab === 'mine' ? "You haven't joined any communities yet." : 'No communities found.'}</p>
                            <button className="comm-create-btn" onClick={() => setShowCreate(true)}>
                                <FaPlus size={13} /> Be the first to create one
                            </button>
                        </div>
                    ) : (
                        <div className="comm-grid">
                            {communities.map(c => (
                                <div key={c.id} className="comm-card" onClick={() => navigate(`/communities/${c.id}`)}>
                                    <div className="comm-card-icon">{c.icon}</div>
                                    <div className="comm-card-body">
                                        <div className="comm-card-header">
                                            <h3 className="comm-card-name">{c.name}</h3>
                                            <span className="comm-card-cat">{c.category}</span>
                                        </div>
                                        <p className="comm-card-desc">{c.description || 'A community for medical discussions.'}</p>
                                        <div className="comm-card-footer">
                                            <span className="comm-card-stat">
                                                <FaUsers size={11} /> {c.membersCount} member{c.membersCount !== 1 ? 's' : ''}
                                            </span>
                                            <button
                                                className={`comm-join-btn ${c.isMember ? 'joined' : ''}`}
                                                onClick={(e) => toggleJoin(c.id, e)}
                                                disabled={toggling[c.id]}
                                            >
                                                {c.isMember ? 'Joined ✓' : '+ Join'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Create community modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create a Community</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleCreate} className="create-comm-form">
                            <div className="create-comm-icon-row">
                                {['🏥','❤️','🧠','🫁','🎗️','⚗️','🧘','👶','🦴','🩹','🫀','💊'].map(ico => (
                                    <button
                                        key={ico} type="button"
                                        className={`icon-btn ${form.icon === ico ? 'active' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, icon: ico }))}
                                    >
                                        {ico}
                                    </button>
                                ))}
                            </div>
                            <label className="form-label">Community Name *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Heart Health Warriors"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required maxLength={100}
                            />
                            <label className="form-label">Category</label>
                            <select
                                className="form-input"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            >
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                            </select>
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="What is this community about?"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                maxLength={500}
                            />
                            <button type="submit" className="form-submit-btn" disabled={creating || !form.name.trim()}>
                                {creating ? 'Creating…' : 'Create Community'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
