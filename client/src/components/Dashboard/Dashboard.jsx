import React, { useContext, useState } from 'react';
import Sidebar from './Sidebar';
import Feed from './Feed';
import RightSidebar from './RightSidebar';
import TopNav from './TopNav';
import { UserContext } from '../../context/UserContext';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useContext(UserContext);
    // searchQuery is the committed query driving the Feed (set on Enter / "See all")
    const [searchQuery, setSearchQuery] = useState('');

    if (!user) return <div className="dashboard-loading">Loading dashboard...</div>;

    return (
        <div className="dashboard-shell">
            <TopNav
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
            />
            <div className="dashboard-body">
                <Sidebar onSearch={setSearchQuery} />
                <Feed
                    userInfo={user}
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery('')}
                />
                <RightSidebar metrics={{
                    weight:        user.weight,
                    height:        user.height,
                    bmi:           user.bmi,
                    bloodPressure: user.bloodPressure,
                }} />
            </div>
        </div>
    );
}
