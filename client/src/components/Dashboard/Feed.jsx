import React from 'react';
import PostCard from './PostCard';
import './Dashboard.css';

export default function Feed() {
    return (
        <div className="feed">
            <div className="post-box">
                <h4>Start a MedPost</h4>
                <div className="toggle-post">
                    <button className="selected">Medical opinion</button>
                    <button>Personal</button>
                </div>
                <textarea placeholder="Write your thoughts..."/>
            </div>

            <h3>Health Feed</h3>
            <PostCard
                user="Neurologist"
                time="3 hours ago"
                content="Procedural volumes for catheter ablation of atrial fibrillation with electrophysiology fellows"
                tags={['#Cardiology', '#Electrophysiology']}
                comments={25}
                likes={48}
                views="25k"
            />
            <PostCard
                user="User Angao"
                time="3 hours ago"
                content="Coping strategies for post-concussion syndrome, stress management."
                tags={['#Cardiology', '#Electrophysiology']}
                comments={12}
                likes={60}
                views="12k"
            />
            <PostCard
                user="Physician"
                time="5 hours ago"
                content="Procedural volumes for catheter ablation of atrial fibrillation with electrophysiology fellows"
                tags={['#Cardiology', '#Electrophysiology']}
                comments={8}
                likes={50}
                views="12k"
            />
        </div>
    )
}