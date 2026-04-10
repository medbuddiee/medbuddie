import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import './Dashboard.css';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';

/**
 * Feed
 *
 * Props:
 *   userInfo        — logged-in user object from context
 *   searchQuery     — active search string (empty string = normal feed)
 *   onClearSearch() — called when user dismisses the search results
 */
export default function Feed({ userInfo, searchQuery, onClearSearch }) {
    const [postType, setPostType]           = useState('medical');
    const [content, setContent]             = useState('');
    const [physicianOnly, setPhysicianOnly] = useState(false);
    const [posts, setPosts]                 = useState([]);
    const [loading, setLoading]             = useState(true);
    const [postError, setPostError]         = useState(null);
    const [posting, setPosting]             = useState(false);

    const isSearchMode = Boolean(searchQuery);

    // ── Fetch posts (normal feed or search results) ───────────────────────────
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ limit: 20 });
            if (searchQuery) params.set('q', searchQuery);

            const res = await fetch(`/api/posts?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (res.ok) {
                setPosts(await res.json());
            } else {
                setPosts([]);
            }
        } catch {
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Re-fetch whenever the committed search query changes
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // ── Create a new post ─────────────────────────────────────────────────────
    const handlePost = async () => {
        if (!content.trim() || posting) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setPostError('Sign in to create a post.');
            return;
        }

        setPosting(true);
        setPostError(null);

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: content.trim(), type: postType, tags: [] }),
            });

            if (res.ok) {
                const newPost = await res.json();
                setPosts(prev => [newPost, ...prev]);
                setContent('');
            } else {
                const data = await res.json();
                setPostError(data.error || 'Could not create post.');
            }
        } catch {
            setPostError('Cannot reach the server.');
        } finally {
            setPosting(false);
        }
    };

    // ── Toggle like (optimistic update + server reconciliation) ───────────────
    const handleLike = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Optimistic flip
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const liked = !p.likedByMe;
            return { ...p, likedByMe: liked, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }));

        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { likes, likedByMe } = await res.json();
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, likes, likedByMe } : p
                ));
            } else {
                // Revert
                setPosts(prev => prev.map(p => {
                    if (p.id !== postId) return p;
                    const rev = !p.likedByMe;
                    return { ...p, likedByMe: rev, likes: rev ? p.likes + 1 : Math.max(0, p.likes - 1) };
                }));
            }
        } catch {
            // Revert
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                const rev = !p.likedByMe;
                return { ...p, likedByMe: rev, likes: rev ? p.likes + 1 : Math.max(0, p.likes - 1) };
            }));
        }
    };

    // ── Delete a post ─────────────────────────────────────────────────────────
    const handleDelete = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId));
        } catch {
            // silent — post stays visible
        }
    };

    // ── Keep comments_count in sync after add/remove ──────────────────────────
    const handleCommentCountChange = (postId, delta) => {
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) + delta) }
                : p
        ));
    };

    const visiblePosts = physicianOnly
        ? posts.filter(p => p.type === 'medical_opinion')
        : posts;

    return (
        <div className="feed">

            {/* ── Post creation box — hidden in search mode ── */}
            {!isSearchMode && (
                <div className="post-box">
                    <div className="post-box-header">
                        <div className="post-box-avatar">
                            {userInfo?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="post-box-placeholder">Share a MedPost…</span>
                    </div>

                    <div className="post-type-toggle">
                        <button
                            className={postType === 'medical' ? 'selected' : ''}
                            onClick={() => setPostType('medical')}
                        >
                            Medical opinion
                        </button>
                        <span className="toggle-arrow">›</span>
                        <button
                            className={postType === 'personal' ? 'selected' : ''}
                            onClick={() => setPostType('personal')}
                        >
                            Personal
                        </button>
                    </div>

                    <textarea
                        className="post-textarea"
                        placeholder="Write your thoughts, a clinical note, or a question…"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={3}
                    />

                    {postError && <p className="post-error">{postError}</p>}

                    {content.trim() && (
                        <div className="post-actions">
                            <button
                                className="post-submit-btn"
                                onClick={handlePost}
                                disabled={posting}
                            >
                                {posting ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Feed / search header ── */}
            <div className="feed-section-header">
                {isSearchMode ? (
                    /* Search mode: back button + query label */
                    <div className="search-mode-header">
                        <button
                            className="search-back-btn"
                            onClick={onClearSearch}
                            aria-label="Back to feed"
                        >
                            <FaArrowLeft size={13} />
                        </button>
                        <h3 className="feed-section-title">
                            Results for <span className="search-query-label">"{searchQuery}"</span>
                        </h3>
                        <button
                            className="search-clear-btn"
                            onClick={onClearSearch}
                            aria-label="Clear search"
                            title="Back to Health Feed"
                        >
                            <FaTimes size={13} />
                        </button>
                    </div>
                ) : (
                    /* Normal feed header */
                    <>
                        <h3 className="feed-section-title">Health Feed</h3>
                        <div className="physician-toggle">
                            <span className="physician-toggle-label">Physicians only</span>
                            <button
                                className={`toggle-switch ${physicianOnly ? 'on' : ''}`}
                                onClick={() => setPhysicianOnly(v => !v)}
                                aria-label="Toggle physician-only posts"
                                aria-pressed={physicianOnly}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ── Post list ── */}
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

            {/* ── Empty states ── */}
            {!loading && visiblePosts.length === 0 && (
                <div className="feed-empty-state">
                    {isSearchMode ? (
                        <>
                            <p className="feed-empty">No posts matched "{searchQuery}".</p>
                            <button className="feed-empty-link" onClick={onClearSearch}>
                                ← Back to Health Feed
                            </button>
                        </>
                    ) : physicianOnly ? (
                        <p className="feed-empty">No physician posts yet.</p>
                    ) : (
                        <p className="feed-empty">No posts yet — be the first to share!</p>
                    )}
                </div>
            )}
        </div>
    );
}
