import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './Guidelines.css';
import {
    FaSearch, FaHeart,
    FaWind, FaSyringe, FaBrain, FaBone, FaTint,
    FaRibbon, FaVirus, FaUserMd, FaLeaf, FaBookmark,
    FaChevronRight, FaFilter,
} from 'react-icons/fa';
import { MdOutlineBloodtype } from 'react-icons/md';

// ── Specialty metadata ─────────────────────────────────────────────────────────
const SPECIALTY_META = {
    'Cardiovascular':    { icon: FaHeart,     color: '#e53935', bg: '#ffebee' },
    'Respiratory':       { icon: FaWind,      color: '#1e88e5', bg: '#e3f2fd' },
    'Endocrine':         { icon: FaSyringe,   color: '#fb8c00', bg: '#fff3e0' },
    'Gastrointestinal':  { icon: FaLeaf,      color: '#43a047', bg: '#e8f5e9' },
    'Neurology':         { icon: FaBrain,     color: '#7b1fa2', bg: '#f3e5f5' },
    'Musculoskeletal':   { icon: FaBone,      color: '#6d4c41', bg: '#efebe9' },
    'Renal & Urinary':   { icon: FaTint,      color: '#00897b', bg: '#e0f2f1' },
    'Oncology':          { icon: FaRibbon,    color: '#d81b60', bg: '#fce4ec' },
    'Infectious Disease':{ icon: FaVirus,     color: '#00838f', bg: '#e0f7fa' },
    'Geriatrics':        { icon: FaUserMd,    color: '#546e7a', bg: '#eceff1' },
};

const CATEGORIES = [
    'ALL', 'Cardiovascular', 'Respiratory', 'Endocrine', 'Gastrointestinal',
    'Neurology', 'Musculoskeletal', 'Renal & Urinary', 'Oncology',
    'Infectious Disease', 'Geriatrics',
];

const SIDEBAR_SPECIALTIES = [
    'Internal Medicine', 'Cardiology', 'Pulmonology', 'Proctology',
    'Gastroenterology', 'Neurology', 'Rheumatology', 'Nephrology',
    'Oncology', 'Infectious Disease',
];

const BROWSE_TAGS = [
    'Tips for Renal Practices', 'Patient Story', 'Recent Research',
    'Clinical Decision Support', 'Telehealth & Beyond',
];

/* Maps sidebar specialty names → CATEGORIES keys used in guideline data */
const SPECIALTY_TO_CATEGORY = {
    'Internal Medicine':   null,                // null = show all
    'Cardiology':          'Cardiovascular',
    'Pulmonology':         'Respiratory',
    'Proctology':          'Gastrointestinal',
    'Gastroenterology':    'Gastrointestinal',
    'Neurology':           'Neurology',
    'Rheumatology':        'Musculoskeletal',
    'Nephrology':          'Renal & Urinary',
    'Oncology':            'Oncology',
    'Infectious Disease':  'Infectious Disease',
};

const SUGGESTED = [
    { title: 'Pathways Force Physician Patient Decisions', meta: 'Shared Decision Making' },
    { title: 'Surgeon Flea Disease: Pathways for IbsCD Methodologies', meta: 'IBD Management' },
    { title: 'Hypertension Treatment: Inpatient Diuretics', meta: 'Cardiology' },
];

const ASSISTANCE = [
    'Comorbidities Strategies: Gout Policy Update',
    'Hypertension Treatment: Inpatient Diuretics',
    'Postponing Post-Acute Visit to Apolytines',
];

/** Format a PostgreSQL TIMESTAMPTZ string as relative time */
function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)   return `${days} day${days > 1 ? 's' : ''} ago`;
    const wks = Math.floor(days / 7);
    if (wks < 5)    return `${wks} week${wks > 1 ? 's' : ''} ago`;
    const mths = Math.floor(days / 30);
    return `${mths} month${mths > 1 ? 's' : ''} ago`;
}

export default function GuidelinesPage() {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const [guidelines, setGuidelines]             = useState([]);
    const [loading, setLoading]                   = useState(true);
    const [activeCategory, setActiveCategory]     = useState('ALL');
    const [search, setSearch]                     = useState('');
    const [checkedSpecialties, setCheckedSpecialties] = useState(
        new Set(['Cardiology', 'Pulmonology'])
    );

    // ── Fetch guidelines from API ───────────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/guidelines?limit=200');
                if (res.ok) setGuidelines(await res.json());
            } catch {
                // backend unreachable — stays empty
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Filter client-side by category + specialty checkboxes + search ──────
    const filtered = useMemo(() => {
        let items = guidelines;

        // 1. Category bar filter
        if (activeCategory !== 'ALL') {
            items = items.filter(g => g.specialty === activeCategory);
        }

        // 2. Specialty checkbox filter (only when category is ALL)
        if (activeCategory === 'ALL' && checkedSpecialties.size > 0) {
            const mappedCategories = new Set();
            let includeAll = false;
            checkedSpecialties.forEach(spec => {
                const cat = SPECIALTY_TO_CATEGORY[spec];
                if (cat === null) { includeAll = true; }
                else if (cat)      { mappedCategories.add(cat); }
            });
            if (!includeAll && mappedCategories.size > 0) {
                items = items.filter(g => mappedCategories.has(g.specialty));
            }
        }

        // 3. Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(
                g => g.title.toLowerCase().includes(q) ||
                     g.summary.toLowerCase().includes(q) ||
                     g.specialty.toLowerCase().includes(q)
            );
        }
        return items;
    }, [guidelines, activeCategory, checkedSpecialties, search]);

    // ── Group filtered results by specialty ─────────────────────────────────
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(g => {
            if (!map[g.specialty]) map[g.specialty] = [];
            map[g.specialty].push(g);
        });
        // Preserve the canonical order from CATEGORIES
        return CATEGORIES
            .filter(c => c !== 'ALL' && map[c])
            .map(c => ({ specialty: c, items: map[c] }));
    }, [filtered]);

    const toggleSpecialty = (spec) => {
        setCheckedSpecialties(prev => {
            const next = new Set(prev);
            next.has(spec) ? next.delete(spec) : next.add(spec);
            return next;
        });
    };

    const handleLogout = () => { logout(); navigate('/signin'); };

    const meta = (spec) => SPECIALTY_META[spec] || { icon: FaHeart, color: '#005c55', bg: '#e0f2f1' };

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
            <Sidebar />
            <div className="gl-shell-inner">

            {/* ── Hero ── */}
            <div className="gl-hero">
                <div className="gl-hero-inner">
                    <h1 className="gl-hero-title">Most Recent Guidelines</h1>
                    <p className="gl-hero-sub">
                        Get the latest evidence-based medical guidelines organised by organ system.
                        Find updated treatment protocols, diagnostic recommendations, and management strategies.
                    </p>
                </div>
            </div>

            {/* ── Primary category filter bar ── */}
            <div className="gl-catbar-wrap">
                <div className="gl-catbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`gl-cat-btn ${activeCategory === cat ? 'gl-cat-active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="gl-body">

                {/* ── Main column ── */}
                <main className="gl-main">

                    {/* Section header */}
                    <div className="gl-section-top">
                        <div className="gl-section-titles">
                            <h2 className="gl-section-title">Most Recent Guidelines</h2>
                            <span className="gl-section-sub">by Organ system</span>
                        </div>
                        <div className="gl-section-actions">
                            <div className="gl-search-wrap">
                                <FaSearch className="gl-search-icon" />
                                <input
                                    className="gl-search"
                                    type="text"
                                    placeholder="Search for guidelines…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="gl-medpost-btn" onClick={() => navigate('/dashboard')}>
                                Start a MedPost <FaChevronRight size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Secondary category tabs */}
                    <div className="gl-catbar gl-catbar-secondary">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`gl-cat-btn ${activeCategory === cat ? 'gl-cat-active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {loading && <p className="gl-loading">Loading guidelines…</p>}

                    {/* Empty state */}
                    {!loading && grouped.length === 0 && (
                        <p className="gl-empty">
                            {search ? `No guidelines matched "${search}".` : 'No guidelines found.'}
                        </p>
                    )}

                    {/* Guidelines grid — 2 cards per row */}
                    {!loading && (
                        <div className="gl-grid">
                            {grouped.map(({ specialty, items }) => {
                                const { icon: Icon, color, bg } = meta(specialty);
                                return (
                                    <div key={specialty} className="gl-card">
                                        {/* Card header */}
                                        <div className="gl-card-header">
                                            <span className="gl-spec-icon" style={{ background: bg, color }}>
                                                <Icon size={18} />
                                            </span>
                                            <div>
                                                <span className="gl-spec-name">{specialty}</span>
                                                <span className="gl-spec-count">
                                                    {items.length} guideline{items.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Top 3 guidelines */}
                                        <ul className="gl-item-list">
                                            {items.slice(0, 3).map(item => (
                                                <li key={item.id} className="gl-item">
                                                    <div className="gl-item-row">
                                                        <span className="gl-item-dot" style={{ background: color }} />
                                                        <span
                                                            className="gl-item-title gl-item-title-link"
                                                            onClick={() => navigate(`/guidelines/${item.id}`)}
                                                            title="View full guideline"
                                                        >
                                                            {item.title}
                                                        </span>
                                                        <span className="gl-item-time">{timeAgo(item.published_at)}</span>
                                                    </div>
                                                    {item.summary && (
                                                        <p className="gl-item-summary">{item.summary}</p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Card footer */}
                                        <div className="gl-card-footer">
                                            <span className="gl-footer-tag">Community Recommendations</span>
                                            <span className="gl-footer-bookmarks">
                                                <FaBookmark size={10} /> {items[0]?.bookmark_count ?? 0}
                                            </span>
                                            <span className="gl-footer-source">{items[0]?.source}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* ── Right sidebar ── */}
                <aside className="gl-sidebar">

                    {/* Filter by Specialty */}
                    <div className="gl-widget">
                        <div className="gl-widget-header">
                            <span className="gl-widget-title">
                                <FaFilter size={11} style={{ marginRight: 5 }} />
                                Filter by Specialty
                            </span>
                        </div>
                        <ul className="gl-checklist">
                            {SIDEBAR_SPECIALTIES.map(spec => (
                                <li key={spec} className="gl-check-item">
                                    <label className="gl-check-label">
                                        <input
                                            type="checkbox"
                                            className="gl-checkbox"
                                            checked={checkedSpecialties.has(spec)}
                                            onChange={() => toggleSpecialty(spec)}
                                        />
                                        <span>{spec}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Browse by Tags */}
                    <div className="gl-widget">
                        <div className="gl-widget-header">
                            <span className="gl-widget-title">Browse by Tags</span>
                        </div>
                        <div className="gl-tags">
                            {BROWSE_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    className="gl-tag"
                                    onClick={() => setSearch(tag)}
                                    title={`Filter by "${tag}"`}
                                >{tag}</button>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Reading */}
                    <div className="gl-widget">
                        <div className="gl-widget-header">
                            <span className="gl-widget-title">Suggested Reading</span>
                        </div>
                        <ul className="gl-suggested-list">
                            {SUGGESTED.map((s, i) => (
                                <li key={i} className="gl-suggested-item">
                                    <div className="gl-suggested-thumb">
                                        <span style={{ fontSize: '1.1rem' }}>📄</span>
                                    </div>
                                    <div>
                                        <p className="gl-suggested-title">{s.title}</p>
                                        <span className="gl-suggested-meta">{s.meta}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Need Assistance */}
                    <div className="gl-widget">
                        <div className="gl-widget-header">
                            <span className="gl-widget-title">Need Assistance?</span>
                        </div>
                        <ul className="gl-assist-list">
                            {ASSISTANCE.map((item, i) => (
                                <li key={i} className="gl-assist-item">
                                    <FaChevronRight size={9} className="gl-assist-arrow" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>

            {/* ── Footer ── */}
            <footer className="gl-footer-bar">
                <span>Find the latest guidelines 1.4k ALL</span>
                <span className="gl-footer-links">
                    Most Impactful Guidelines &bull; Guidelines &bull; Practitioners and OOD Update &bull;
                    Medications &bull; Infectious Media &bull; MedBuddie Discussions
                </span>
            </footer>
            </div>
            </div>
        </div>
    );
}
