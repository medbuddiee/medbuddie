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

