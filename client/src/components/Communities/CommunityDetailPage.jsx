import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import PostCard from '../Dashboard/PostCard';
import UserAvatar from '../common/UserAvatar';
import { useUser } from '../../context/UserContext';
import { FaUsers, FaArrowLeft, FaPen } from 'react-icons/fa';
import './Communities.css';

export default function CommunityDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const token = localStorage.getItem('token');

    const [community, setCommunity]     = useState(null);
    const [posts, setPosts]             = useState([]);
    const [members, setMembers]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [postText, setPostText]       = useState('');
    const [postType, setPostType]       = useState('personal');
    const [submitting, setSubmitting]   = useState(false);
    const [joiningLoading, setJoiningLoading] = useState(false);
    const [tab, setTab]                 = useState('posts'); // 'posts' | 'members'

    useEffect(() => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        Promise.all([
            fetch(`/api/communities/${id}`, { headers }).then(r => r.json()),
            fetch(`/api/communities/${id}/posts`, { headers }).then(r => r.json()),
            fetch(`/api/communities/${id}/members`).then(r => r.json()),
        ]).then(([comm, postsData, membersData]) => {
            setCommunity(comm);
            setPosts(Array.isArray(postsData) ? postsData : []);
            setMembers(Array.isArray(membersData) ? membersData : []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [id, token]);

    const toggleJoin = async () => {
        if (!token) return;
        setJoiningLoading(true);
        try {
            const res = await fetch(`/api/communities/${id}/join`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { member } = await res.json();
                setCommunity(c => ({
                    ...c, isMember: member,
                    membersCount: c.membersCount + (member ? 1 : -1),
                }));
            }
        } catch { /* silent */ } finally { setJoiningLoading(false); }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!postText.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/communities/${id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: postText.trim(), type: postType }),
            });
            if (res.ok) {
                const newPost = await res.json();
                setPosts(prev => [{
                    ...newPost,
                    author: user.name,
                    username: user.username,
                    authorId: user.id,
                    authorAvatar: user.avatarUrl,
                }, ...prev]);
                setPostText('');
                setCommunity(c => ({ ...c, postsCount: (c.postsCount || 0) + 1 }));
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to post');
            }
        } catch { /* silent */ } finally { setSubmitting(false); }
    };

    const handleLike = async (postId) => {
        const t = localStorage.getItem('token');
        if (!t) return;
        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST', headers: { Authorization: `Bearer ${t}` },
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

    if (loading) return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body"><Sidebar /><main className="comm-main"><p className="comm-loading">Loading…</p></main></div>
        </div>
    );

    if (!community || community.error) return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body"><Sidebar /><main className="comm-main">
                <p style={{ padding: '2rem', color: '#888' }}>Community not found.</p>
            </main></div>
        </div>
    );

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="comm-detail-main">
                    {/* Back */}
                    <button className="comm-back-btn" onClick={() => navigate('/communities')}>
                        <FaArrowLeft size={13} /> Back to Communities
                    </button>

                    {/* Community hero */}
                    <div className="comm-hero">
                        <div className="comm-hero-icon">{community.icon}</div>
                        <div className="comm-hero-info">
                            <h1 className="comm-hero-name">{community.name}</h1>
                            <span className="comm-hero-cat">{community.category}</span>
                            {community.description && <p className="comm-hero-desc">{community.description}</p>}
                            <div className="comm-hero-meta">
                                <span><FaUsers size={12} /> {community.membersCount} members</span>
                                <span>Created by {community.creatorName || 'unknown'}</span>
                            </div>
                        </div>
                        <button
                            className={`comm-join-btn-hero ${community.isMember ? 'joined' : ''}`}
                            onClick={toggleJoin}
                            disabled={joiningLoading}
                        >
                            {community.isMember ? 'Leave Community' : 'Join Community'}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="comm-detail-tabs">
                        {[{ key: 'posts', label: `Posts (${community.postsCount || 0})` }, { key: 'members', label: `Members (${community.membersCount})` }].map(t => (
                            <button key={t.key} className={`comm-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'posts' && (
                        <>
                            {/* Post creator — only if member */}
                            {community.isMember && (
                                <form className="comm-post-form" onSubmit={handlePost}>
                                    <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={36} />
                                    <div className="comm-post-inputs">
                                        <div className="comm-post-type-row">
                                            {['personal', 'medical_question', 'medical_opinion'].map(t => (
                                                <button
                                                    key={t} type="button"
                                                    className={`post-type-chip ${postType === t ? 'active' : ''}`}
                                                    onClick={() => setPostType(t)}
                                                >
                                                    {t === 'personal' ? '💬 Personal' : t === 'medical_question' ? '❓ Question' : '🩺 Opinion'}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            className="comm-post-textarea"
                                            placeholder={`Share something with the ${community.name} community…`}
                                            value={postText}
                                            onChange={e => setPostText(e.target.value)}
                                            rows={3}
                                            maxLength={2000}
                                        />
                                        <button type="submit" className="comm-post-submit" disabled={!postText.trim() || submitting}>
                                            {submitting ? 'Posting…' : <><FaPen size={12} /> Post</>}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Posts list */}
                            {posts.length === 0 ? (
                                <div className="comm-empty" style={{ marginTop: '2rem' }}>
                                    <p>No posts yet. {community.isMember ? 'Be the first to post!' : 'Join the community to post.'}</p>
                                </div>
                            ) : (
                                <div className="comm-posts-list">
                                    {posts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            currentUserId={user?.id}
                                            onLike={handleLike}
                                            onDelete={() => {}}
                                            onCommentCountChange={() => {}}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'members' && (
                        <div className="comm-members-list">
                            {members.map(m => (
                                <div key={m.id} className="comm-member-row">
                                    <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size={40} />
                                    <div>
                                        <p className="comm-member-name">
                                            {m.name}
                                            {m.isDoctor && <span className="buddy-doctor-badge" style={{ marginLeft: 8 }}>Doctor</span>}
                                        </p>
                                        {m.username && <p className="comm-member-username">@{m.username}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
