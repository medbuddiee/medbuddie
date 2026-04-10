import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { FaCommentAlt, FaHeart, FaEllipsisH, FaTrash, FaLink } from 'react-icons/fa';

/** Format an ISO timestamp as a human-readable relative time */
function timeAgo(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
}

/**
 * PostCard
 *
 * Props:
 *   post          — full post object from the API
 *   currentUserId — id of the logged-in user (undefined if not logged in)
 *   onLike(postId)                      — called when user clicks Like
 *   onDelete(postId)                    — called when user deletes the post
 *   onCommentCountChange(postId, delta) — called after adding/removing a comment (+1/-1)
 */
export default function PostCard({ post, currentUserId, onLike, onDelete, onCommentCountChange }) {
    const [showComments, setShowComments]       = useState(false);
    const [comments, setComments]               = useState([]);
    const [commentsLoaded, setCommentsLoaded]   = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText]         = useState('');
    const [submitting, setSubmitting]           = useState(false);
    const [showMenu, setShowMenu]               = useState(false);

    const menuRef    = useRef(null);
    const inputRef   = useRef(null);
    const isOwn      = currentUserId && post.authorId === currentUserId;
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    // Close the "…" dropdown when the user clicks outside it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // Focus the comment input whenever the panel opens
    useEffect(() => {
        if (showComments && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showComments]);

    // ── Toggle comment panel — lazy-loads comments on first open ───────────
    const toggleComments = async () => {
        const opening = !showComments;
        setShowComments(opening);

        if (opening && !commentsLoaded) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${post.id}/comments`);
                if (res.ok) {
                    setComments(await res.json());
                    setCommentsLoaded(true);
                }
            } catch {
                // Network issue — panel will show empty state
            } finally {
                setLoadingComments(false);
            }
        }
    };

    // ── Like toggle — delegates to Feed so the posts array stays in sync ──
    const handleLike = () => {
        if (!isLoggedIn) return;
        if (onLike) onLike(post.id);
    };

    // ── Delete post (own posts only) ───────────────────────────────────────
    const handleDelete = async () => {
        setShowMenu(false);
        if (!isOwn) return;
        if (!window.confirm('Delete this post?')) return;
        if (onDelete) onDelete(post.id);
    };

    // ── Copy link to clipboard ─────────────────────────────────────────────
    const handleCopyLink = () => {
        navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`);
        setShowMenu(false);
    };

    // ── Submit new comment ─────────────────────────────────────────────────
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || submitting || !isLoggedIn) return;

        const token = localStorage.getItem('token');
        setSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentText('');
                if (onCommentCountChange) onCommentCountChange(post.id, +1);
            }
        } catch {
            // silent — user can retry
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete a comment (own comments only) ──────────────────────────────
    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                if (onCommentCountChange) onCommentCountChange(post.id, -1);
            }
        } catch {
            // silent
        }
    };

    return (
        <div className="post-card">

            {/* ── Header: avatar / author / time / menu ── */}
            <div className="post-header">
                <div className="post-author-row">
                    <div className="post-avatar">
                        {post.author?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <span className="post-author">{post.author || post.username}</span>
                        {post.type === 'medical_opinion' && (
                            <span className="post-badge">Physician</span>
                        )}
                        <div className="post-time">{timeAgo(post.created_at)}</div>
                    </div>
                </div>

                {/* "…" overflow menu */}
                <div className="post-menu-container" ref={menuRef}>
                    <button
                        className="post-menu-btn"
                        aria-label="More options"
                        onClick={() => setShowMenu(m => !m)}
                    >
                        <FaEllipsisH />
                    </button>
                    {showMenu && (
                        <div className="post-menu-dropdown">
                            <button className="post-menu-item" onClick={handleCopyLink}>
                                <FaLink size={11} /> Copy link
                            </button>
                            {isOwn && (
                                <button
                                    className="post-menu-item post-menu-delete"
                                    onClick={handleDelete}
                                >
                                    <FaTrash size={11} /> Delete post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <p className="post-content">{post.content}</p>

            {/* ── Tags ── */}
            {post.tags?.length > 0 && (
                <div className="tags">
                    {post.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* ── Footer: comment / like / views ── */}
            <div className="post-footer">
                <button
                    className="post-action-btn"
                    onClick={toggleComments}
                    aria-label="Toggle comments"
                >
                    <FaCommentAlt />
                    <span>{post.comments_count || 0} comment{post.comments_count !== 1 ? 's' : ''}</span>
                </button>

                <button
                    className={`post-action-btn ${post.likedByMe ? 'liked' : ''}`}
                    onClick={handleLike}
                    aria-label={post.likedByMe ? 'Unlike' : 'Like'}
                    title={isLoggedIn ? '' : 'Sign in to like'}
                >
                    <FaHeart />
                    <span>{post.likes || 0}</span>
                </button>

                {post.views && <span className="post-views">{post.views}</span>}
            </div>

            {/* ── Comments panel ── */}
            {showComments && (
                <div className="comments-panel">
                    {loadingComments && (
                        <p className="comments-loading">Loading comments…</p>
                    )}

                    {!loadingComments && comments.length === 0 && (
                        <p className="comments-empty">No comments yet. Be the first!</p>
                    )}

                    {/* Comment list */}
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
                                    title="Delete comment"
                                >
                                    <FaTrash size={10} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Comment input — only shown to logged-in users */}
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
