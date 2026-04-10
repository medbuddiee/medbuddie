import React, { useState } from 'react';
import './Dashboard.css';
import { FaCommentAlt, FaHeart, FaEllipsisH } from 'react-icons/fa';

export default function PostCard({ user, time, content, tags, comments, likes, views, type }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes || 0);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount((c) => (liked ? c - 1 : c + 1));
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-author-row">
                    <div className="post-avatar">{user?.[0]?.toUpperCase() || 'U'}</div>
                    <div>
                        <span className="post-author">{user}</span>
                        {type === 'medical_opinion' && (
                            <span className="post-badge">Physician</span>
                        )}
                        <div className="post-time">{time}</div>
                    </div>
                </div>
                <button className="post-menu-btn" aria-label="More options">
                    <FaEllipsisH />
                </button>
            </div>

            <p className="post-content">{content}</p>

            <div className="tags">
                {(tags || []).map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                ))}
            </div>

            <div className="post-footer">
                <button className="post-action-btn" aria-label="Comment">
                    <FaCommentAlt /> <span>{comments} comments</span>
                </button>
                <button
                    className={`post-action-btn ${liked ? 'liked' : ''}`}
                    onClick={handleLike}
                    aria-label="Like"
                >
                    <FaHeart /> <span>{likeCount}</span>
                </button>
                <span className="post-views">{views}</span>
            </div>
        </div>
    );
}
