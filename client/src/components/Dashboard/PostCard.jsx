// import React from 'react';
// import './Dashboard.css';
//
// export default function PostCard({ user, time, content, tags, comments, likes, views }) {
//     return (
//         <div className="post-card">
//             <div className="post-header">
//                 <strong>{user}</strong>
//                 <span>{time}</span>
//             </div>
//             <p>{content}</p>
//             <div className="tags">
//                 {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
//             </div>
//             <div className="post-footer">
//                 <span>{comments} comments</span>
//                 <span>{likes} ❤</span>
//                 <span>{views}</span>
//             </div>
//         </div>
//     );
// }

import React from 'react';
import './Dashboard.css';
import { FaCommentAlt, FaHeart } from 'react-icons/fa';

export default function PostCard({ user, time, content, tags, comments, likes, views }) {
    return (
        <div className="post-card">
            <div className="post-header">
                <strong>{user}</strong>
                <span>{time}</span>
            </div>
            <p>{content}</p>
            <div className="tags">
                {tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                ))}
            </div>
            <div className="post-footer">
                <span><FaCommentAlt /> {comments} comments</span>
                <span><FaHeart /> {likes} ❤</span>
                <span>{views}</span>
            </div>
        </div>
    );
}
