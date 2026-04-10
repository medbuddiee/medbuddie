import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import './Dashboard.css';

// Fallback posts shown when the backend has no data yet
const SAMPLE_POSTS = [
    {
        id: 'sample-1',
        type: 'medical_opinion',
        author: 'Physician',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        content: 'Combining a GLP-1 receptor agonist with an SGLT2 inhibitor for type 2 diabetes mellitus — unilateral approach for optimal glycaemic control.',
        tags: ['#Type2Diabetes', '#Pharmacology'],
        comments_count: 25,
        likes: 48,
        views: '25k',
    },
    {
        id: 'sample-2',
        type: 'personal',
        author: 'User Angao',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        content: 'Coping strategies for post-concussion syndrome — exercise, proper sleep, and stress management can help reduce symptoms significantly.',
        tags: ['#Concussion', '#Recovery'],
        comments_count: 12,
        likes: 60,
        views: '14k',
    },
    {
        id: 'sample-3',
        type: 'medical_opinion',
        author: 'Health Feed',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        content: 'Combining a GLP-1 receptor agonist with an SGLT2 inhibitor for type 2 diabetes mellitus — latest evidence-based guidelines.',
        tags: ['#Concussion', '#Recovery'],
        comments_count: 12,
        likes: 80,
        views: '14k',
    },
];

function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
}

export default function Feed({ userInfo }) {
    const [postType, setPostType] = useState('medical');
    const [content, setContent] = useState('');
    const [physicianOnly, setPhysicianOnly] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load posts from API on mount
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/posts?limit=20');
                if (res.ok) {
                    const data = await res.json();
                    // Use API posts if available, otherwise fall through to sample
                    setPosts(data.length > 0 ? data : SAMPLE_POSTS);
                } else {
                    setPosts(SAMPLE_POSTS);
                }
            } catch {
                // Backend not running — show sample posts
                setPosts(SAMPLE_POSTS);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const handlePost = async () => {
        if (!content.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content, type: postType, tags: [] }),
            });
            if (res.ok) {
                const newPost = await res.json();
                setPosts((prev) => [newPost, ...prev]);
            }
        } catch {
            // silently fail in demo mode
        }
        setContent('');
    };

    const visiblePosts = physicianOnly
        ? posts.filter((p) => p.type === 'medical_opinion')
        : posts;

    return (
        <div className="feed">
            {/* ── Post creation box ── */}
            <div className="post-box">
                <div className="post-box-header">
                    <div className="post-box-avatar">
                        {userInfo?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="post-box-placeholder">Start a MedPost</span>
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
                    placeholder="Write your thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                {content.trim() && (
                    <div className="post-actions">
                        <button className="post-submit-btn" onClick={handlePost}>Post</button>
                    </div>
                )}
            </div>

            {/* ── Feed section header ── */}
            <div className="feed-section-header">
                <h3 className="feed-section-title">Health Feed</h3>
                <div className="physician-toggle">
                    <span className="physician-toggle-label">Physician</span>
                    <button
                        className={`toggle-switch ${physicianOnly ? 'on' : ''}`}
                        onClick={() => setPhysicianOnly(!physicianOnly)}
                        aria-label="Toggle physician-only filter"
                    />
                </div>
            </div>

            {loading && <p className="feed-loading">Loading posts…</p>}

            {!loading && visiblePosts.map((post) => (
                <PostCard
                    key={post.id}
                    user={post.author || post.username}
                    time={timeAgo(post.created_at)}
                    content={post.content}
                    tags={post.tags || []}
                    comments={post.comments_count || 0}
                    likes={post.likes || 0}
                    views={post.views || ''}
                    type={post.type}
                />
            ))}

            {!loading && visiblePosts.length === 0 && (
                <p className="feed-empty">No posts found. Be the first to share!</p>
            )}
        </div>
    );
}
