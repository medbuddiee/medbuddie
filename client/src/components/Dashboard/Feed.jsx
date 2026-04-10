import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import './Dashboard.css';

// ── Fallback data shown when the backend has no posts yet ─────────────────────
const SAMPLE_POSTS = [
    {
        id: 'sample-1',
        authorId: null,
        type: 'medical_opinion',
        author: 'Dr. Sarah Chen',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        content: 'Combining a GLP-1 receptor agonist with an SGLT2 inhibitor for type 2 diabetes mellitus — evidence for a unilateral approach to optimal glycaemic control is growing. Recent RCTs show ~1.5% additional HbA1c reduction versus monotherapy.',
        tags: ['#Type2Diabetes', '#Pharmacology'],
        comments_count: 25,
        likes: 48,
        likedByMe: false,
        views: '25k',
    },
    {
        id: 'sample-2',
        authorId: null,
        type: 'personal',
        author: 'Alex Nguyen',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        content: 'Three months into post-concussion recovery and the combination of graded aerobic exercise, consistent sleep hygiene, and mindfulness has made a noticeable difference. Anyone else had a similar experience?',
        tags: ['#Concussion', '#Recovery'],
        comments_count: 12,
        likes: 60,
        likedByMe: false,
        views: '14k',
    },
    {
        id: 'sample-3',
        authorId: null,
        type: 'medical_opinion',
        author: 'Dr. Marcus Webb',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        content: 'Updated AHA/ACC guidelines now emphasise shared decision-making for statin initiation in the 7.5–10% 10-year ASCVD risk range. Lifestyle optimisation remains first-line for borderline cases — but the conversation should always include patient values.',
        tags: ['#Cardiology', '#Lipids', '#Guidelines'],
        comments_count: 31,
        likes: 112,
        likedByMe: false,
        views: '38k',
    },
];

export default function Feed({ userInfo }) {
    const [postType, setPostType]         = useState('medical');
    const [content, setContent]           = useState('');
    const [physicianOnly, setPhysicianOnly] = useState(false);
    const [posts, setPosts]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [postError, setPostError]       = useState(null);
    const [posting, setPosting]           = useState(false);

    // ── Load posts from the API on mount ──────────────────────────────────────
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/posts?limit=20', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    // Use real posts when available; fall back to samples for first-run UX
                    setPosts(data.length > 0 ? data : SAMPLE_POSTS);
                } else {
                    setPosts(SAMPLE_POSTS);
                }
            } catch {
                // Backend not reachable — show sample posts so the UI isn't empty
                setPosts(SAMPLE_POSTS);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

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

    // ── Toggle like on a post (optimistic UI update) ──────────────────────────
    const handleLike = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Optimistic update — flip likedByMe and adjust count immediately
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
                // Reconcile with server-confirmed counts
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, likes, likedByMe } : p
                ));
            } else {
                // Revert on failure
                setPosts(prev => prev.map(p => {
                    if (p.id !== postId) return p;
                    const reverted = !p.likedByMe;
                    return { ...p, likedByMe: reverted, likes: reverted ? p.likes + 1 : Math.max(0, p.likes - 1) };
                }));
            }
        } catch {
            // Revert optimistic update on network error
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                const reverted = !p.likedByMe;
                return { ...p, likedByMe: reverted, likes: reverted ? p.likes + 1 : Math.max(0, p.likes - 1) };
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
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
            }
        } catch {
            // silent — post remains visible
        }
    };

    // ── Update comments_count when a comment is added/removed ────────────────
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

    const currentUserId = userInfo?.id;

    return (
        <div className="feed">

            {/* ── Post creation box ── */}
            <div className="post-box">
                <div className="post-box-header">
                    <div className="post-box-avatar">
                        {userInfo?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="post-box-placeholder">Share a MedPost…</span>
                </div>

                {/* Post type toggle */}
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

            {/* ── Feed header + physician filter ── */}
            <div className="feed-section-header">
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
            </div>

            {/* ── Post list ── */}
            {loading && <p className="feed-loading">Loading posts…</p>}

            {!loading && visiblePosts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onCommentCountChange={handleCommentCountChange}
                />
            ))}

            {!loading && visiblePosts.length === 0 && (
                <p className="feed-empty">
                    {physicianOnly
                        ? 'No physician posts yet.'
                        : 'No posts found. Be the first to share!'}
                </p>
            )}
        </div>
    );
}
