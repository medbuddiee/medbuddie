// import React, { useContext } from 'react';
// import Sidebar from './Sidebar';
// import Feed from './Feed';
// import RightSidebar from './RightSidebar';
// import { UserContext } from '../../context/UserContext';
// import './Dashboard.css';
//
// export default function Dashboard() {
//     const { user } = useContext(UserContext);
//
//     if (!user) return <div>Loading dashboard...</div>;
//
//     return (
//         <div className="dashboard">
//             <Sidebar userName={user.name} />
//             <Feed userInfo={user} />
//             <RightSidebar metrics={{
//                 weight: user.weight,
//                 height: user.height,
//                 bmi: user.bmi,
//                 bloodPressure: user.bloodPressure
//             }} />
//         </div>
//     );
// }
//
//
// // Dashboard.jsx
// import React, { useContext } from 'react';
// import Sidebar from './Sidebar';
// import Feed from './Feed';
// import RightSidebar from './RightSidebar';
// import { UserContext } from '../../context/UserContext';
// import './Dashboard.css';
//
// export default function Dashboard() {
//     const { user } = useContext(UserContext);
//
//     if (!user) return <div>Loading dashboard...</div>;
//
//     return (
//         <div className="dashboard-container">
//             <div className="top-nav">
//                 <div className="brand">MedBuddie</div>
//                 <input type="text" placeholder="Search" className="top-search" />
//                 <div className="profile-info">
//                     <span>14 | h</span>
//                     <img src="https://via.placeholder.com/32" alt="Profile" className="profile-pic" />
//                 </div>
//             </div>
//             <div className="dashboard-body">
//                 <Sidebar userName={user.name} />
//                 <Feed userInfo={user} />
//                 <RightSidebar metrics={{
//                     weight: user.weight,
//                     height: user.height,
//                     bmi: user.bmi,
//                     bloodPressure: user.bloodPressure
//                 }} />
//             </div>
//         </div>
//     );
// }

// Dashboard.jsx
import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import Feed from './Feed';
import RightSidebar from './RightSidebar';
import { UserContext } from '../../context/UserContext';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useContext(UserContext);

    if (!user) return <div>Loading dashboard...</div>;

    return (
        <div className="dashboard">
            <Sidebar userName={user.name} />
            <Feed userInfo={user} />
            <RightSidebar metrics={{
                weight: user.weight,
                height: user.height,
                bmi: user.bmi,
                bloodPressure: user.bloodPressure
            }} />
        </div>
    );
}

