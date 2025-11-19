// // client/src/components/Profile/ProfilePage.jsx
// import React, { useEffect, useState } from 'react';
// import './Profile.css';
//
// export default function ProfilePage() {
//     const [profile, setProfile] = useState(null);
//
//     useEffect(() => {
//         fetch('http://localhost:5000/api/profile')
//             .then((res) => res.json())
//             .then(setProfile)
//             .catch(console.error);
//     }, []);
//
//     if (!profile) return <div className="loading">Loading…</div>;
//
//     return (
//         <div className="profile-page">
//             <div className="profile-header">
//                 <div className="profile-name">
//                     <h1>{profile.name}</h1>
//                     <p>{profile.bio}</p>
//                 </div>
//                 <button onClick={() => (window.location.href = '/edit-profile')}>
//                     Edit Profile
//                 </button>
//             </div>
//
//             <h3>Personal Stats</h3>
//             <div className="stats-grid">
//                 <div className="stat-card">
//                     <h4>Weight</h4>
//                     <p>{profile.weight || '—'} lbs</p>
//                 </div>
//                 <div className="stat-card">
//                     <h4>Height</h4>
//                     <p>{profile.height || '—'}</p>
//                 </div>
//                 <div className="stat-card">
//                     <h4>BMI</h4>
//                     <p>{profile.bmi || '—'}</p>
//                 </div>
//                 <div className="stat-card">
//                     <h4>Blood Pressure</h4>
//                     <p>{profile.bloodPressure || '—'}</p>
//                 </div>
//                 <div className="stat-card">
//                     <h4>Lipid Panel</h4>
//                     <p>{profile.lipidPanel || '—'}</p>
//                 </div>
//             </div>
//
//             <h3>Medications</h3>
//             <ul className="medications-list">
//                 {profile.medications && profile.medications.length > 0 ? (
//                     profile.medications.map((med, idx) => (
//                         <li key={idx}>
//                             {med.name} – {med.frequency}
//                         </li>
//                     ))
//                 ) : (
//                     <li>No medications listed.</li>
//                 )}
//             </ul>
//         </div>
//     );
// }


import React from 'react';
import { useUser } from '../../context/UserContext';
import './Profile.css';

export default function ProfilePage() {
    const { user } = useUser();

    if (!user) return <div className="loading">Loading...</div>;

    return (
        <div className="profile-page">
            {/* HEADER */}
            <div className="profile-header">
                <div className="profile-info">
                    <img
                        src="https://placehold.co/200x200"
                        alt="avatar"
                        className="profile-avatar"
                    />
                    <div>
                        <h1>{user.name}</h1>
                        <p className="profile-subtitle">{user.bio}</p>
                    </div>
                </div>

                <button
                    className="edit-button"
                    onClick={() => (window.location.href = "/edit-profile")}
                >
                    Edit Profile
                </button>
            </div>

            {/* NAV TABS */}
            <div className="profile-tabs">
                <button className="active">Health Overview</button>
                <button>My Posts</button>
                <button>Communities & Followers</button>
                <button>Second Opinions</button>
            </div>

            {/* PERSONAL STATS CARD */}
            <div className="card">
                <h3>Personal Stats</h3>
                <div className="stats-grid">
                    <div>
                        <h4>Weight</h4>
                        <p>{user.weight || "—"} lbs</p>
                    </div>
                    <div>
                        <h4>Height</h4>
                        <p>{user.height || "—"}</p>
                    </div>
                    <div>
                        <h4>BMI</h4>
                        <p>{user.bmi || "—"}</p>
                    </div>
                    <div>
                        <h4>Blood Pressure</h4>
                        <p>{user.bloodPressure || "—"}</p>
                    </div>
                    <div>
                        <h4>Lipid Panel</h4>
                        <p>{user.lipidPanel || "—"}</p>
                    </div>
                </div>
            </div>

            {/* MEDICATIONS CARD */}
            <div className="card">
                <h3>Medications</h3>
                {user.medications?.length > 0 ? (
                    <ul className="medications-list">
                        {user.medications.map((med, idx) => (
                            <li key={idx} className="med-item">
                                <span>{med.name}</span>
                                <span className="med-freq">{med.frequency}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No medications listed.</p>
                )}
            </div>
        </div>
    );
}
