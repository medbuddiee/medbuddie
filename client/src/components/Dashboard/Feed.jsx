import React, { useState } from 'react';
import PostCard from './PostCard';
import './Dashboard.css';

const SAMPLE_POSTS = [
    {
        id: 1,
        type: 'medical_opinion',
        user: 'Physician',
        time: '8 hours ago',
        content: 'Combining a GLP-1 receptor agonist with an SGLT2 inhibitor for type 2 diabetes mellitus — unilateral approach.',
        tags: ['#Type2Diabetes', '#Pharmacology'],
        comments: 25,
        likes: 48,
        views: '25k',
    },
    {
        id: 2,
        type: 'personal',
        user: 'User Angao',
        time: '5 hours ago',
        content: 'Coping strategies for post-concussion syndrome — exercise, proper sleep, and stress management can help reduce symptoms.',
        tags: ['#Concussion', '#Recovery'],
        comments: 12,
        likes: 60,
        views: '14k',
    },
    {
        id: 3,
        type: 'medical_opinion',
        user: 'Health Feed',
        time: '2 days ago',
        content: 'Combining a GLP-1 receptor agonist with an SGLT2 inhibitor for type 2 diabetes mellitus — latest guidelines.',
        tags: ['#Concussion', '#Recovery'],
        comments: 12,
        likes: 80,
        views: '14k',
    },
];

export default function Feed({ userInfo }) {
    const [postType, setPostType] = useState('medical');
    const [content, setContent] = useState('');
    const [physicianOnly, setPhysicianOnly] = useState(false);

    const handlePost = async () => {
        if (!content.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content, type: postType, tags: [] }),
            });
            setContent('');
        } catch {
            // silently fail in demo mode
        }
    };

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
                {content && (
                    <div className="post-actions">
                        <button className="post-submit-btn" onClick={handlePost}>Post</button>
                    </div>
                )}
            </div>

            {/* ── Feed section ── */}
            <div className="feed-section-header">
                <h3 className="feed-section-title">Health Feed</h3>
                <div className="physician-toggle">
                    <span className="physician-toggle-label">Physician</span>
                    <button
                        className={`toggle-switch ${physicianOnly ? 'on' : ''}`}
                        onClick={() => setPhysicianOnly(!physicianOnly)}
                        aria-label="Physician filter"
                    />
                </div>
            </div>

            {SAMPLE_POSTS.filter((p) => !physicianOnly || p.type === 'medical_opinion').map((post) => (
                <PostCard key={post.id} {...post} />
            ))}
        </div>
    );
}
