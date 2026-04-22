import React, { useState, useEffect } from 'react';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import UserAvatar from '../common/UserAvatar';
import { useUser } from '../../context/UserContext';
import { FaHeart, FaCommentAlt, FaTrophy, FaMedal, FaUserMd, FaCheckCircle } from 'react-icons/fa';
import './TopArticles.css';

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

const TYPE_COLORS = {
    medical_opinion:  { bg: 'linear-gradient(135deg,#005c55,#00897b)', label: '🩺 Medical Opinion' },
    medical_question: { bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', label: '❓ Medical Question' },
    personal:         { bg: 'linear-gradient(135deg,#6a1b9a,#ab47bc)', label: '💬 Personal' },
};

const RANK_ICONS = [
    <FaTrophy size={18} color="#f9a825" />,
    <FaMedal  size={18} color="#9e9e9e" />,
    <FaMedal  size={18} color="#bf8a30" />,
];

export default function TopArticlesPage() {
    const { user } = useUser();
    const token = localStorage.getItem('token');

    const [posts, setPosts]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/posts/top-week', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPosts(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    const handleLike = async (postId) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { liked } = await res.json();
                setPosts(prev => prev.map(p =>
                    p.id === postId
                        ? { ...p, likes: p.likes + (liked ? 1 : -1), likedByMe: liked }
                        : p
                ));
            }
        } catch { /* silent */ }
    };

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="ta-main">
                    <div className="ta-header">
                        <div className="ta-header-title">
                            <FaTrophy size={22} color="#f9a825" />
                            <div>
                                <h2 className="ta-title">Top Posts of the Week</h2>
                                <p className="ta-subtitle">Most liked posts in the last 7 days from the community</p>
                            </div>
                        </div>
                        <span className="ta-badge">Updated daily</span>
                    </div>

                    {loading ? (
                        <p className="ta-loading">Loading…</p>
                    ) : posts.length === 0 ? (
                        <div className="ta-empty">
                            <FaTrophy size={48} color="#e0e0e0" />
                            <p>No posts this week yet. Be the first to share!</p>
                        </div>
                    ) : (
                        <div className="ta-list">
                            {posts.map((post, idx) => {
                                const meta = TYPE_COLORS[post.type] || TYPE_COLORS.personal;
                                return (
                                    <div key={post.id} className="ta-card">
                                        {/* Rank */}
                                        <div className="ta-rank">
                                            {RANK_ICONS[idx] || <span className="ta-rank-num">#{idx + 1}</span>}
                                        </div>

                                        {/* Colour strip */}
                                        <div className="ta-strip" style={{ background: meta.bg }} />

                                        {/* Body */}
                                        <div className="ta-card-body">
                                            <div className="ta-meta-row">
                                                <span className="ta-type-badge">{meta.label}</span>
                                                <span className="ta-time">{timeAgo(post.created_at)}</span>
                                            </div>

                                            <div className="ta-author-row">
                                                <UserAvatar name={post.author} avatarUrl={post.authorAvatar} size={28} />
                                                <span className="ta-author">
                                                    {post.author}
                                                    {post.authorIsDoctor && (
                                                        <span className="ta-doctor-badge">
                                                            <FaCheckCircle size={9} /> Verified Doctor
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            <p className="ta-content">{post.content}</p>

                                            {post.tags?.length > 0 && (
                                                <div className="ta-tags">
                                                    {post.tags.map((t, i) => <span key={i} className="ta-tag">{t}</span>)}
                                                </div>
                                            )}

                                            <div className="ta-footer">
                                                <button
                                                    className={`ta-like-btn ${post.likedByMe ? 'liked' : ''}`}
                                                    onClick={() => handleLike(post.id)}
                                                >
                                                    <FaHeart size={13} />
                                                    <span>{post.likes} like{post.likes !== 1 ? 's' : ''}</span>
                                                </button>
                                                <span className="ta-comments">
                                                    <FaCommentAlt size={12} /> {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
