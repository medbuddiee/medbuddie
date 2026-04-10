import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import {
    FaCommentAlt, FaHeart, FaEllipsisH, FaTrash, FaLink,
    FaUserMd, FaUser, FaQuestion, FaChevronRight,
} from 'react-icons/fa';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}

/* ── Type metadata ───────────────────────────────────────────────────────── */
const TYPE_META = {
    medical_opinion:  {
        label: 'Medical Opinion',
        Icon:  FaUserMd,
        grad:  'linear-gradient(145deg,#005c55 0%,#00897b 100%)',
    },
    medical_question: {
        label: 'Medical Question',
        Icon:  FaQuestion,
        grad:  'linear-gradient(145deg,#1565c0 0%,#42a5f5 100%)',
    },
    personal: {
        label: 'Personal',
        Icon:  FaUser,
        grad:  'linear-gradient(145deg,#6a1b9a 0%,#ab47bc 100%)',
    },
};

/* ══════════════════════════════════════════════════════════════════════════════
   POST CARD
   ══════════════════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, currentUserId, onLike, onDelete, onCommentCountChange }) {
    const [showComments,      setShowComments]      = useState(false);
    const [comments,          setComments]          = useState([]);
    const [commentsLoaded,    setCommentsLoaded]    = useState(false);
    const [loadingComments,   setLoadingComments]   = useState(false);
    const [commentText,       setCommentText]       = useState('');
    const [submitting,        setSubmitting]        = useState(false);
    const [showMenu,          setShowMenu]          = useState(false);

    const menuRef  = useRef(null);
    const inputRef = useRef(null);
    const isOwn      = currentUserId && post.authorId === currentUserId;
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    const meta = TYPE_META[post.type] || TYPE_META.personal;

    /* ── Close menu on outside click ─────────────────────────────────────── */
    useEffect(() => {
        const h = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [showMenu]);

    /* ── Focus comment input when panel opens ─────────────────────────────── */
    useEffect(() => {
        if (showComments && inputRef.current) inputRef.current.focus();
    }, [showComments]);

    /* ── Toggle comments (lazy load) ─────────────────────────────────────── */
    const toggleComments = async () => {
        const opening = !showComments;
        setShowComments(opening);
        if (opening && !commentsLoaded) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${post.id}/comments`);
                if (res.ok) { setComments(await res.json()); setCommentsLoaded(true); }
            } catch { /* silent */ } finally { setLoadingComments(false); }
        }
    };

    /* ── Like ─────────────────────────────────────────────────────────────── */
    const handleLike = () => {
        if (!isLoggedIn) return;
        if (onLike) onLike(post.id);
    };

    /* ── Delete post ─────────────────────────────────────────────────────── */
    const handleDelete = () => {
        setShowMenu(false);
        if (!isOwn || !window.confirm('Delete this post?')) return;
        if (onDelete) onDelete(post.id);
    };

    /* ── Copy link ───────────────────────────────────────────────────────── */
    const handleCopyLink = () => {
        navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`);
        setShowMenu(false);
    };

    /* ── Submit comment ──────────────────────────────────────────────────── */
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || submitting || !isLoggedIn) return;
        const token = localStorage.getItem('token');
        setSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentText('');
                if (onCommentCountChange) onCommentCountChange(post.id, +1);
            }
        } catch { /* silent */ } finally { setSubmitting(false); }
    };

    /* ── Delete comment ──────────────────────────────────────────────────── */
    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                if (onCommentCountChange) onCommentCountChange(post.id, -1);
            }
        } catch { /* silent */ }
    };

    return (
        <div className="post-card">

            {/* ══ Main row: thumbnail + content ══ */}
            <div className="post-card-main">

                {/* Colored gradient thumbnail with icon */}
                <div className="post-card-thumb" style={{ background: meta.grad }}>
                    <meta.Icon size={24} color="rgba(255,255,255,0.85)" />
                </div>

                {/* Content area */}
                <div className="post-card-content">

                    {/* Meta row: type badge · date · menu */}
                    <div className="post-card-meta-row">
                        <span className="post-type-badge">{meta.label}</span>
                        <span className="post-date-label">{formatDate(post.created_at)}</span>

                        {/* ··· overflow menu */}
                        <div className="post-menu-container" ref={menuRef}>
                            <button
                                className="post-menu-btn"
                                onClick={() => setShowMenu(m => !m)}
                                aria-label="More options"
                            >
                                <FaEllipsisH size={12} />
                            </button>
                            {showMenu && (
                                <div className="post-menu-dropdown">
                                    <button className="post-menu-item" onClick={handleCopyLink}>
                                        <FaLink size={11} /> Copy link
                                    </button>
                                    {isOwn && (
                                        <button className="post-menu-item post-menu-delete" onClick={handleDelete}>
                                            <FaTrash size={11} /> Delete post
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Author name + physician badge */}
                    <p className="post-card-author">
                        {post.author || post.username}
                        {post.type === 'medical_opinion' && (
                            <span className="post-badge"> · Physician</span>
                        )}
                    </p>

                    {/* Post content preview */}
                    <p className="post-card-preview">{post.content}</p>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                        <div className="tags">
                            {post.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
                        </div>
                    )}

                    {/* Footer: Like · Comment · Learn more */}
                    <div className="post-card-footer">
                        <button
                            className={`post-action-btn ${post.likedByMe ? 'liked' : ''}`}
                            onClick={handleLike}
                            title={isLoggedIn ? '' : 'Sign in to like'}
                        >
                            <FaHeart size={13} />
                            <span>Like{post.likes > 0 ? ` (${post.likes})` : ''}</span>
                        </button>

                        <button className="post-action-btn" onClick={toggleComments}>
                            <FaCommentAlt size={12} />
                            <span>
                                Comment
                                {post.comments_count > 0 ? ` (${post.comments_count})` : ''}
                            </span>
                        </button>

                        {post.views > 0 && (
                            <span className="post-views">{post.views} views</span>
                        )}

                        <button className="post-learn-more" onClick={toggleComments}>
                            Learn more <FaChevronRight size={9} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ══ Comments panel (full width below main row) ══ */}
            {showComments && (
                <div className="comments-panel">
                    {loadingComments && (
                        <p className="comments-loading">Loading comments…</p>
                    )}
                    {!loadingComments && comments.length === 0 && (
                        <p className="comments-empty">No comments yet. Be the first!</p>
                    )}

                    {comments.map(c => (
                        <div key={c.id} className="comment-item">
                            <div className="comment-avatar">
                                {c.author?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="comment-body">
                                <span className="comment-author">{c.author}</span>
                                <p className="comment-text">{c.content}</p>
                                <span className="comment-time">{timeAgo(c.created_at)}</span>
                            </div>
                            {c.authorId === currentUserId && (
                                <button
                                    className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(c.id)}
                                    aria-label="Delete comment"
                                >
                                    <FaTrash size={10} />
                                </button>
                            )}
                        </div>
                    ))}

                    {isLoggedIn ? (
                        <form className="comment-form" onSubmit={handleCommentSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                className="comment-input"
                                placeholder="Write a comment…"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                disabled={submitting}
                                maxLength={500}
                            />
                            <button
                                type="submit"
                                className="comment-submit-btn"
                                disabled={!commentText.trim() || submitting}
                            >
                                {submitting ? '…' : 'Post'}
                            </button>
                        </form>
                    ) : (
                        <p className="comments-signin-prompt">
                            Sign in to leave a comment.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
