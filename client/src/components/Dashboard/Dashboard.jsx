import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import Feed from './Feed';
import RightSidebar from './RightSidebar';
import TopNav from './TopNav';
import { UserContext } from '../../context/UserContext';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useContext(UserContext);

    if (!user) return <div className="dashboard-loading">Loading dashboard...</div>;

    return (
        <div className="dashboard-shell">
            <TopNav />
            <div className="dashboard-body">
                <Sidebar />
                <Feed userInfo={user} />
                <RightSidebar metrics={{
                    weight: user.weight,
                    height: user.height,
                    bmi: user.bmi,
                    bloodPressure: user.bloodPressure,
                }} />
            </div>
        </div>
    );
}
