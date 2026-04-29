import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSocket } from '../../utils/socket';
import PostCard from './PostCard';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import {
    FaArrowLeft, FaTimes, FaCog, FaExclamationTriangle,
    FaPaperclip, FaImage, FaCamera, FaLink as FaLinkIcon,
    FaChevronRight, FaComments, FaBookOpen, FaHeartbeat,
} from 'react-icons/fa';

/* ── Circular progress SVG ────────────────────────────────────────────────── */
function CircularProgress({ value, color = '#005c55' }) {
    const r    = 36;
    const circ = 2 * Math.PI * r;
    const off  = circ * (1 - Math.min(Math.max(value, 0), 100) / 100);
    return (
        <div className="circ-prog-svg-wrap">
            <svg width="92" height="92" viewBox="0 0 92 92">
                <circle cx="46" cy="46" r={r} fill="none" stroke="#e8e8e8" strokeWidth="8" />
                <circle
                    cx="46" cy="46" r={r}
                    fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={off}
                    strokeLinecap="round"
                    transform="rotate(-90 46 46)"
                />
            </svg>
            <div className="circ-prog-inner">
                <span className="circ-prog-val">{value}%</span>
            </div>
        </div>
    );
}

/* ── Leaderboard guideline card ───────────────────────────────────────────── */
const CARD_GRADS = [
    'linear-gradient(145deg,#005c55,#00897b)',
    'linear-gradient(145deg,#1565c0,#42a5f5)',
    'linear-gradient(145deg,#6a1b9a,#ab47bc)',
    'linear-gradient(145deg,#c62828,#ef5350)',
];

function GuidelineCard({ g, index, onClick }) {
    return (
        <div
            className="lb-card"
            style={{ background: CARD_GRADS[index % CARD_GRADS.length] }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClick()}
        >
            <div className="lb-card-overlay" />
            <div className="lb-card-content">
                <p className="lb-card-title">{g.title}</p>
                <p className="lb-card-source">{g.source}</p>
            </div>
        </div>
    );
}

/* ── Constants ─────────────────────────────────────────────────────────────── */
const POST_TYPES = [
    { id: 'medical_question', label: 'Medical Question' },
    { id: 'medical_opinion',  label: 'Medical Opinion'  },
    { id: 'personal',         label: 'Personal'          },
];

const FEED_FILTERS = [
    { id: 'physicians', label: 'Physicians'    },
    { id: 'new',        label: 'New'           },
    { id: 'relevant',   label: 'Most Relevant' },
    { id: 'popular',    label: 'Popular'       },
];

/* ══════════════════════════════════════════════════════════════════════════════
   FEED
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Feed({ userInfo, searchQuery, onClearSearch }) {
    const navigate = useNavigate();

    const [postType,   setPostType]   = useState('medical_question');
    const [feedFilter, setFeedFilter] = useState('new');
    const [content,    setContent]    = useState('');
    const [posts,      setPosts]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [postError,  setPostError]  = useState(null);
    const [posting,    setPosting]    = useState(false);
    const [guidelines, setGuidelines] = useState([]);
    const [attachedFiles, setAttachedFiles] = useState([]);

    const fileInputRef  = useRef(null);
    const imageInputRef = useRef(null);

    const isSearchMode = Boolean(searchQuery);
    const firstName = userInfo?.name?.split(' ')[0] || userInfo?.username || 'Doctor';

    /* ── Fetch posts ─────────────────────────────────────────────────────── */
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const token  = localStorage.getItem('token');
            const params = new URLSearchParams({ limit: 20 });
            if (searchQuery) params.set('q', searchQuery);
            const res = await fetch(`/api/posts?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setPosts(res.ok ? await res.json() : []);
        } catch {
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    // Real-time feed updates via Socket.io
    useEffect(() => {
        const socket = getSocket();

        const onCreated = (post) => {
            setPosts(prev => {
                // Don't add if already exists (own post already added optimistically)
                if (prev.some(p => p.id === post.id)) return prev;
                return [post, ...prev];
            });
        };

        const onLiked = ({ id, likes, likedByMe }) => {
            setPosts(prev => prev.map(p =>
                p.id === id ? { ...p, likes, likedByMe } : p
            ));
        };

        const onDeleted = ({ id }) => {
            setPosts(prev => prev.filter(p => p.id !== id));
        };

        socket.on('post:created', onCreated);
        socket.on('post:liked',   onLiked);
        socket.on('post:deleted', onDeleted);

        return () => {
            socket.off('post:created', onCreated);
            socket.off('post:liked',   onLiked);
            socket.off('post:deleted', onDeleted);
        };
    }, []);

    /* ── Fetch guidelines for leaderboard ───────────────────────────────── */
    useEffect(() => {
        fetch('/api/guidelines?limit=4')
            .then(r => r.ok ? r.json() : [])
            .then(d => setGuidelines(d.slice(0, 4)))
            .catch(() => {});
    }, []);

    /* ── Create post ─────────────────────────────────────────────────────── */
    const handlePost = async () => {
        if (!content.trim() || posting) return;
        const token = localStorage.getItem('token');
        if (!token) { setPostError('Sign in to create a post.'); return; }
        setPosting(true);
        setPostError(null);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: content.trim(), type: postType, tags: [] }),
            });
            if (res.ok) {
                const newPost = await res.json();
                setPosts(prev => [newPost, ...prev]);
                setContent('');
                setFeedFilter('new'); // ensure the new post is visible
            } else {
                setPostError((await res.json()).error || 'Could not create post.');
            }
        } catch {
            setPostError('Cannot reach the server.');
        } finally {
            setPosting(false);
        }
    };

    /* ── Like (optimistic) ───────────────────────────────────────────────── */
    const handleLike = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const flip = prev => prev.map(p => {
            if (p.id !== postId) return p;
            const liked = !p.likedByMe;
            return { ...p, likedByMe: liked, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        });
        setPosts(flip);
        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { likes, likedByMe } = await res.json();
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes, likedByMe } : p));
            } else {
                setPosts(flip); // revert
            }
        } catch {
            setPosts(flip); // revert
        }
    };

    /* ── Delete post ─────────────────────────────────────────────────────── */
    const handleDelete = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId));
        } catch { /* silent */ }
    };

    /* ── Comment count sync ──────────────────────────────────────────────── */
    const handleCommentCountChange = (postId, delta) =>
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) + delta) }
                : p
        ));

    /* ── Filter + sort display ───────────────────────────────────────────── */
    const visiblePosts = useMemo(() => {
        let list = feedFilter === 'physicians'
            ? posts.filter(p => p.type === 'medical_opinion')
            : [...posts];

        if (feedFilter === 'popular') {
            list.sort((a, b) =>
                ((b.likes || 0) + (b.comments_count || 0)) -
                ((a.likes || 0) + (a.comments_count || 0))
            );
        } else if (feedFilter === 'relevant') {
            list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }
        // 'new' and 'physicians' keep API order (newest first)
        return list;
    }, [posts, feedFilter]);

    const recentDiscussions = posts.slice(0, 3);

    return (
        <div className="feed">

            {/* ══ Welcome banner ══ */}
            {!isSearchMode && (
                <>
                    <div className="feed-welcome">
                        <div className="feed-welcome-left">
                            <h2 className="feed-welcome-title">Welcome {firstName}!</h2>
                            <div className="feed-tabs">
                                {POST_TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        className={`feed-tab ${postType === t.id ? 'feed-tab-active' : ''}`}
                                        onClick={() => setPostType(t.id)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            className="feed-settings-btn"
                            onClick={() => navigate('/edit-profile')}
                        >
                            <FaCog size={13} /> Settings
                        </button>
                    </div>

                    <div className="feed-info-banner">
                        <FaExclamationTriangle className="feed-banner-icon" size={13} />
                        <span>
                            Always include the source when providing a medical treatment,
                            otherwise others will be asked of one.
                        </span>
                    </div>
                </>
            )}

            {/* ══ Start a MedPost ══ */}
            {!isSearchMode && (
                <div className="post-box">
                    <div className="post-box-top-row">
                        <span className="post-box-title">Start a MedPost</span>
                        <span className="post-box-tips-badge">Personal Tips</span>
                    </div>

                    <div className="post-type-tabs">
                        {POST_TYPES.map(t => (
                            <button
                                key={t.id}
                                className={`post-type-tab ${postType === t.id ? 'post-type-tab-active' : ''}`}
                                onClick={() => setPostType(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="post-create-row">
                        <textarea
                            className="post-textarea"
                            placeholder="Add a post…"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={2}
                        />
                        <button
                            className="post-submit-btn"
                            onClick={handlePost}
                            disabled={posting || !content.trim()}
                        >
                            {posting ? '…' : 'Post'}
                        </button>
                    </div>

                    {postError && <p className="post-error">{postError}</p>}

                    {/* Hidden file inputs */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={e => {
                            const f = e.target.files[0];
                            if (f) setAttachedFiles(prev => [...prev, f.name]);
                            e.target.value = '';
                        }}
                    />
                    <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                            const f = e.target.files[0];
                            if (f) setAttachedFiles(prev => [...prev, f.name]);
                            e.target.value = '';
                        }}
                    />

                    {attachedFiles.length > 0 && (
                        <div className="post-attached-files">
                            {attachedFiles.map((name, i) => (
                                <span key={i} className="post-attached-chip">
                                    📎 {name}
                                    <button
                                        className="post-attached-remove"
                                        onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                                    >×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="post-box-footer">
                        <div className="post-box-icons">
                            <FaPaperclip
                                title="Attach file"
                                style={{ cursor: 'pointer' }}
                                onClick={() => fileInputRef.current.click()}
                            />
                            <FaImage
                                title="Add image"
                                style={{ cursor: 'pointer' }}
                                onClick={() => imageInputRef.current.click()}
                            />
                            <FaCamera
                                title="Add photo"
                                style={{ cursor: 'pointer' }}
                                onClick={() => imageInputRef.current.click()}
                            />
                            <FaLinkIcon title="Add link" style={{ cursor: 'pointer' }} />
                        </div>
                        <span className="post-box-signed">
                            Signed: {userInfo?.name || userInfo?.username || 'Anonymous'}
                        </span>
                    </div>
                </div>
            )}

            {/* ══ Health Feed header ══ */}
            <div className="feed-section-header">
                {isSearchMode ? (
                    <div className="search-mode-header">
                        <button className="search-back-btn" onClick={onClearSearch} aria-label="Back to feed">
                            <FaArrowLeft size={13} />
                        </button>
                        <h3 className="feed-section-title">
                            Results for <span className="search-query-label">"{searchQuery}"</span>
                        </h3>
                        <button className="search-clear-btn" onClick={onClearSearch} aria-label="Clear search">
                            <FaTimes size={13} />
                        </button>
                    </div>
                ) : (
                    <div className="feed-header-row">
                        <h3 className="feed-section-title">Health Feed</h3>
                        <div className="feed-filter-bar">
                            {FEED_FILTERS.map(f => (
                                <button
                                    key={f.id}
                                    className={`feed-filter-btn ${feedFilter === f.id ? 'feed-filter-active' : ''}`}
                                    onClick={() => setFeedFilter(f.id)}
                                >
                                    {f.label}
                                    {(f.id === 'relevant' || f.id === 'popular') ? ' ▼' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ══ Posts ══ */}
            {loading && (
                <p className="feed-loading">
                    {isSearchMode ? `Searching for "${searchQuery}"…` : 'Loading posts…'}
                </p>
            )}

            {!loading && visiblePosts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={userInfo?.id}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onCommentCountChange={handleCommentCountChange}
                />
            ))}

            {!loading && visiblePosts.length === 0 && (
                <div className="feed-empty-state">
                    {isSearchMode ? (
                        <>
                            <p className="feed-empty">No posts matched "{searchQuery}".</p>
                            <button className="feed-empty-link" onClick={onClearSearch}>
                                ← Back to Health Feed
                            </button>
                        </>
                    ) : feedFilter === 'physicians' ? (
                        <p className="feed-empty">No physician posts yet.</p>
                    ) : (
                        <p className="feed-empty">No posts yet — be the first to share!</p>
                    )}
                </div>
            )}

            {/* ══ Action buttons ══ */}
            {!isSearchMode && (
                <div className="feed-action-row">
                    <button
                        className="feed-action-primary"
                        onClick={() => navigate('/second-opinion')}
                    >
                        Get a Second Opinion <FaChevronRight size={11} />
                    </button>
                    <button
                        className="feed-action-secondary"
                        onClick={() => navigate('/profile')}
                    >
                        View Health Record &amp; History +
                    </button>
                </div>
            )}

            {/* ══ Bottom grid: Health Trends + Leaderboard + Recent Discussions ══ */}
            {!isSearchMode && (
                <div className="feed-bottom-grid">

                    {/* ── Health Trends ── */}
                    <div className="health-trends-widget">
                        <div className="ht-header">
                            <h3 className="ht-title">
                                Health Trends <span className="ht-info-icon">ⓘ</span>
                            </h3>
                            <button className="ht-more-btn" onClick={() => navigate('/profile')}>
                                More
                            </button>
                        </div>

                        <div className="ht-circles">
                            <div className="ht-circle-item">
                                <CircularProgress value={93} color="#005c55" />
                                <p className="ht-circle-label">Steps Today</p>
                                <p className="ht-circle-sub">
                                    Based on earlier plans, and recommendations for your health.
                                </p>
                            </div>
                            <div className="ht-circle-item">
                                <CircularProgress value={82} color="#1565c0" />
                                <p className="ht-circle-label">Your Health Score</p>
                                <p className="ht-circle-sub">
                                    Considering and combining health metrics, diseases and strategies.
                                </p>
                            </div>
                        </div>

                        <button
                            className="ht-cta-btn"
                            onClick={() => navigate('/health-metrics')}
                        >
                            View Detailed Insights ›
                        </button>

                        <div className="ht-goals-section">
                            <h4 className="ht-goals-title">Set Your Health Goals ✎</h4>
                            <button
                                className="ht-cta-btn"
                                onClick={() => navigate('/health-metrics')}
                            >
                                View Detailed Insights ›
                            </button>
                        </div>
                    </div>

                    {/* ── Leaderboard + Recent Discussions ── */}
                    <div className="lb-discussions-col">

                        {/* Leaderboard */}
                        <div className="lb-section">
                            <h3 className="lb-title">Leaderboard</h3>
                            <div className="lb-grid">
                                {(guidelines.length > 0 ? guidelines : [{id:0},{id:1},{id:2},{id:3}])
                                    .map((g, i) => (
                                        <GuidelineCard
                                            key={g.id ?? i}
                                            g={g}
                                            index={i}
                                            onClick={() => {
                                                if (!g.title) return;
                                                g.file_key
                                                    ? navigate(`/guidelines/${g.id}`)
                                                    : navigate('/guidelines');
                                            }}
                                        />
                                    ))}
                            </div>
                        </div>

                        {/* Recent Discussions */}
                        <div className="rd-section">
                            <div className="rd-header">
                                <h3 className="rd-title">Recent Discussions</h3>
                                <button
                                    className="rd-see-all"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    See all
                                </button>
                            </div>
                            <div className="rd-list">
                                {recentDiscussions.length > 0
                                    ? recentDiscussions.map(p => (
                                        <div key={p.id} className="rd-item">
                                            <div className="rd-item-icon">
                                                <FaComments size={13} />
                                            </div>
                                            <div className="rd-item-body">
                                                <p className="rd-item-title">
                                                    {p.content?.length > 65
                                                        ? p.content.slice(0, 65) + '…'
                                                        : p.content}
                                                </p>
                                                <span className="rd-item-meta">
                                                    {p.author} &bull; {p.likes || 0} likes &bull;&nbsp;
                                                    {p.comments_count || 0} comment{p.comments_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <span className="rd-item-count">{p.likes || 0}</span>
                                        </div>
                                    ))
                                    : !loading && (
                                        <p className="rd-empty">No discussions yet.</p>
                                    )
                                }
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
