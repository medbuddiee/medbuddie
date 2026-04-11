import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Guidelines.css';
import logo from '../../../assets/medbuddie_logo.png';
import {
    FaBell, FaCog, FaUserCircle, FaChevronRight, FaChevronLeft,
    FaBookmark, FaExternalLinkAlt, FaHeart,
} from 'react-icons/fa';

/** Map evidence class → colour */
const CLASS_COLORS = {
    'I':   { bg: '#e8f5e9', color: '#2e7d32', label: 'Class I — Recommended' },
    'IIa': { bg: '#e3f2fd', color: '#1565c0', label: 'Class IIa — Should be considered' },
    'IIb': { bg: '#fff8e1', color: '#f57f17', label: 'Class IIb — May be considered' },
    'III': { bg: '#fce4ec', color: '#c62828', label: 'Class III — Not recommended' },
};
const LEVEL_COLORS = {
    'A': { bg: '#e0f2f1', color: '#00695c' },
    'B': { bg: '#e8eaf6', color: '#283593' },
    'C': { bg: '#f3e5f5', color: '#6a1b9a' },
};

function RecommendationBadge({ cls, level }) {
    const cc = CLASS_COLORS[cls]  || { bg: '#f5f5f5', color: '#555' };
    const lc = LEVEL_COLORS[level] || { bg: '#f5f5f5', color: '#555' };
    return (
        <span className="gd-rec-badges">
            <span className="gd-badge" style={{ background: cc.bg, color: cc.color }}>
                Class {cls}
            </span>
            <span className="gd-badge" style={{ background: lc.bg, color: lc.color }}>
                Level {level}
            </span>
        </span>
    );
}

function SectionNav({ sections, activeId, onSelect }) {
    return (
        <nav className="gd-section-nav">
            <p className="gd-section-nav-title">Contents</p>
            <ul className="gd-section-nav-list">
                {sections.map(s => (
                    <li key={s.id}>
                        <button
                            className={`gd-section-nav-item ${activeId === s.id ? 'gd-section-nav-active' : ''}`}
                            onClick={() => onSelect(s.id)}
                        >
                            {s.title}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function GuidelineDetail() {
    const { id }      = useParams();
    const navigate    = useNavigate();
    const { user, logout } = useUser();

    const [guideline, setGuideline] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [bookmarked, setBookmarked] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('mb_bookmarks') || '[]');
            return saved.includes(String(id));
        } catch { return false; }
    });

    const toggleBookmark = () => {
        setBookmarked(prev => {
            const next = !prev;
            try {
                const saved = JSON.parse(localStorage.getItem('mb_bookmarks') || '[]');
                const updated = next
                    ? [...new Set([...saved, String(id)])]
                    : saved.filter(b => b !== String(id));
                localStorage.setItem('mb_bookmarks', JSON.stringify(updated));
            } catch { /* ignore */ }
            return next;
        });
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/guidelines/${id}/content`);
                if (res.status === 404) {
                    setError('no-content');
                } else if (!res.ok) {
                    setError('server');
                } else {
                    const data = await res.json();
                    setGuideline(data);
                    if (data.sections?.length) setActiveSection(data.sections[0].id);
                }
            } catch {
                setError('network');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleLogout = () => { logout(); navigate('/signin'); };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="gl-shell">
                <TopBar user={user} onLogout={handleLogout} onBack={() => navigate('/guidelines')} />
                <div className="gd-loading-wrap"><p className="gl-loading">Loading guideline…</p></div>
            </div>
        );
    }

    // ── Error states ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="gl-shell">
                <TopBar user={user} onLogout={handleLogout} onBack={() => navigate('/guidelines')} />
                <div className="gd-loading-wrap">
                    {error === 'no-content' ? (
                        <div className="gd-error-box">
                            <p className="gd-error-title">Full content not yet available</p>
                            <p className="gd-error-sub">
                                Detailed content for this guideline has not been added yet.
                                Check back soon or browse other guidelines.
                            </p>
                            <button className="gd-back-btn" onClick={() => navigate('/guidelines')}>
                                <FaChevronLeft size={12} /> Back to Guidelines
                            </button>
                        </div>
                    ) : (
                        <div className="gd-error-box">
                            <p className="gd-error-title">Could not load guideline</p>
                            <p className="gd-error-sub">Please try again later.</p>
                            <button className="gd-back-btn" onClick={() => navigate('/guidelines')}>
                                <FaChevronLeft size={12} /> Back to Guidelines
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentSection = guideline.sections?.find(s => s.id === activeSection);

    return (
        <div className="gl-shell">
            {/* ── Top nav ── */}
            <TopBar user={user} onLogout={handleLogout} onBack={() => navigate('/guidelines')} />

            {/* ── Hero ── */}
            <div className="gd-hero">
                <div className="gd-hero-inner">
                    <button className="gd-back-btn" onClick={() => navigate('/guidelines')}>
                        <FaChevronLeft size={12} /> Most Recent Guidelines
                    </button>
                    <div className="gd-hero-meta">
                        <span className="gd-specialty-badge">{guideline._meta?.specialty}</span>
                        <span className="gd-source-badge">{guideline.source}</span>
                        <span className="gd-version-badge">{guideline.version}</span>
                    </div>
                    <h1 className="gd-hero-title">{guideline.title}</h1>
                    {guideline.authors?.length > 0 && (
                        <p className="gd-hero-authors">
                            {guideline.authors.slice(0, 4).join(', ')}
                            {guideline.authors.length > 4 ? ` +${guideline.authors.length - 4} more` : ''}
                        </p>
                    )}
                    <div className="gd-hero-actions">
                        <button
                            className={`gd-action-btn gd-action-bookmark ${bookmarked ? 'gd-bookmarked' : ''}`}
                            onClick={toggleBookmark}
                            title={bookmarked ? 'Remove bookmark' : 'Bookmark this guideline'}
                        >
                            <FaBookmark size={13} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}
                        </button>
                        {guideline.doi && (
                            <a
                                className="gd-action-btn gd-action-doi"
                                href={`https://doi.org/${guideline.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FaExternalLinkAlt size={12} /> View Source
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Key highlights strip ── */}
            {guideline.keyHighlights?.length > 0 && (
                <div className="gd-highlights-bar">
                    <div className="gd-highlights-inner">
                        <p className="gd-highlights-label">Key Highlights</p>
                        <ul className="gd-highlights-list">
                            {guideline.keyHighlights.map((h, i) => (
                                <li key={i} className="gd-highlight-item">
                                    <span className="gd-highlight-dot" />
                                    {h}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Body: sidebar nav + content ── */}
            <div className="gd-body">

                {/* Left section nav */}
                {guideline.sections?.length > 0 && (
                    <SectionNav
                        sections={guideline.sections}
                        activeId={activeSection}
                        onSelect={scrollToSection}
                    />
                )}

                {/* Main content */}
                <main className="gd-main">
                    {guideline.sections?.map(section => (
                        <section key={section.id} id={`section-${section.id}`} className="gd-section">
                            <h2 className="gd-section-title">{section.title}</h2>

                            {section.content && (
                                <p className="gd-section-content">{section.content}</p>
                            )}

                            {/* Classification table */}
                            {section.table && (
                                <div className="gd-table-wrap">
                                    {section.table.caption && (
                                        <p className="gd-table-caption">{section.table.caption}</p>
                                    )}
                                    <table className="gd-table">
                                        <thead>
                                            <tr>
                                                {section.table.headers.map((h, i) => (
                                                    <th key={i}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.table.rows.map((row, ri) => (
                                                <tr key={ri}>
                                                    {row.map((cell, ci) => (
                                                        <td key={ci}>{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Recommendations list */}
                            {section.recommendations?.length > 0 && (
                                <div className="gd-rec-list">
                                    {section.recommendations.map(rec => (
                                        <div key={rec.id} className="gd-rec-item">
                                            <p className="gd-rec-text">{rec.text}</p>
                                            <RecommendationBadge cls={rec.class} level={rec.level} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Subsections (e.g. Special Populations) */}
                            {section.subsections?.map((sub, si) => (
                                <div key={si} className="gd-subsection">
                                    <h3 className="gd-subsection-title">{sub.title}</h3>
                                    <ul className="gd-subsection-list">
                                        {sub.points.map((pt, pi) => (
                                            <li key={pi} className="gd-subsection-point">{pt}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    ))}

                    {/* Evidence Classification legend */}
                    {guideline.evidenceClassification && (
                        <section className="gd-section gd-evidence-legend">
                            <h2 className="gd-section-title">Evidence Classification</h2>
                            <div className="gd-legend-grid">
                                <div className="gd-legend-col">
                                    <p className="gd-legend-col-title">Class of Recommendation</p>
                                    {guideline.evidenceClassification.classes.map(c => (
                                        <div key={c.class} className="gd-legend-item">
                                            <span
                                                className="gd-badge"
                                                style={{ background: CLASS_COLORS[c.class]?.bg || '#f5f5f5', color: CLASS_COLORS[c.class]?.color || '#555' }}
                                            >
                                                Class {c.class}
                                            </span>
                                            <span className="gd-legend-text">{c.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="gd-legend-col">
                                    <p className="gd-legend-col-title">Level of Evidence</p>
                                    {guideline.evidenceClassification.levels.map(l => (
                                        <div key={l.level} className="gd-legend-item">
                                            <span
                                                className="gd-badge"
                                                style={{ background: LEVEL_COLORS[l.level]?.bg || '#f5f5f5', color: LEVEL_COLORS[l.level]?.color || '#555' }}
                                            >
                                                Level {l.level}
                                            </span>
                                            <span className="gd-legend-text">{l.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* References */}
                    {guideline.references?.length > 0 && (
                        <section className="gd-section">
                            <h2 className="gd-section-title">References</h2>
                            <ol className="gd-references">
                                {guideline.references.map((ref, i) => (
                                    <li key={i} className="gd-reference-item">{ref}</li>
                                ))}
                            </ol>
                        </section>
                    )}
                </main>
            </div>

            {/* ── Footer ── */}
            <footer className="gl-footer-bar">
                <span>{guideline.source} · {guideline.version}</span>
                {guideline.doi && (
                    <span className="gl-footer-links">DOI: {guideline.doi}</span>
                )}
            </footer>
        </div>
    );
}

/** Shared top nav for the detail page */
function TopBar({ user, onLogout, onBack }) {
    const navigate = useNavigate();
    return (
        <header className="gl-topnav">
            <div className="gl-topnav-left" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <img src={logo} alt="MedBuddie" width="28" height="28" />
                <span className="gl-topnav-brand">MedBuddie</span>
            </div>
            <nav className="gl-subnav">
                <button className="gl-subnav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="gl-subnav-item">Community Forum</button>
                <button className="gl-subnav-item gl-subnav-active" onClick={() => navigate('/guidelines')}>
                    Most Recent Guidelines
                </button>
            </nav>
            <div className="gl-topnav-right">
                <button className="gl-icon-btn" aria-label="Notifications"><FaBell /></button>
                <button className="gl-icon-btn" aria-label="Settings"><FaCog /></button>
                <button
                    className="gl-avatar-btn"
                    onClick={onLogout}
                    title={`${user?.name || user?.email} — click to sign out`}
                >
                    <FaUserCircle size={26} />
                </button>
            </div>
        </header>
    );
}
