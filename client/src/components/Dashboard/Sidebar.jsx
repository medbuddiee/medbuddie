import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import logo from '../../../assets/medbuddie_logo.png';
import {
    FaHome, FaBookOpen, FaStar, FaNewspaper,
    FaUserFriends, FaUsers, FaComments, FaChartLine,
    FaRunning, FaPills, FaSearch,
} from 'react-icons/fa';
import { MdOutlinePersonSearch } from 'react-icons/md';

const NAV_TOP = [
    { icon: <FaHome />,     label: 'Health Feed',            path: '/dashboard' },
    { icon: <FaBookOpen />, label: 'Current Guidelines',     path: '/guidelines' },
    { icon: <FaStar />,     label: 'Top Articles of the Week', path: '/top-articles' },
    { icon: <FaNewspaper />, label: 'Recommended Articles',  path: '/recommended' },
    { icon: <FaUserFriends />, label: 'MedBuddies',          path: '/medbuddies' },
    { icon: <MdOutlinePersonSearch size={16} />, label: 'Following', path: '/following' },
    { icon: <FaUsers />,    label: 'Communities',            path: '/communities' },
    { icon: <FaComments />, label: 'Second Opinion',         path: '/second-opinion' },
];

const NAV_BOTTOM = [
    { icon: <FaChartLine />, label: 'Personal Stats', path: '/profile' },
    { icon: <FaRunning />, label: 'Activity', path: '/activity' },
    { icon: <FaPills />, label: 'Medications', path: '/medications' },
];

export default function Sidebar({ onSearch }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchText, setSearchText] = useState('');

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchText.trim()) {
            if (onSearch) {
                // If on dashboard, commit to feed search
                onSearch(searchText.trim());
            } else {
                // Otherwise navigate to dashboard with the search committed
                navigate('/dashboard');
            }
        }
    };

    const NavLink = ({ icon, label, path }) => {
        const active = location.pathname === path;
        return (
            <button
                className={`sidebar-nav-item ${active ? 'sidebar-nav-active' : ''}`}
                onClick={() => navigate(path)}
            >
                <span className="sidebar-nav-icon">{icon}</span>
                <span className="sidebar-nav-label">{label}</span>
            </button>
        );
    };

    return (
        <aside className="sidebar">
            {/* Logo + search — logo navigates to dashboard */}
            <div className="sidebar-header">
                <img
                    src={logo}
                    alt="MedBuddie"
                    className="sidebar-logo"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/dashboard')}
                />
                <div className="sidebar-search-wrap">
                    <FaSearch className="sidebar-search-icon" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="sidebar-search"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        title="Press Enter to search the feed"
                    />
                </div>
            </div>

            {/* Primary navigation */}
            <nav className="sidebar-nav">
                {NAV_TOP.map((item) => (
                    <NavLink key={item.label} {...item} />
                ))}
            </nav>

            {/* Secondary navigation */}
            <div className="sidebar-divider" />
            <nav className="sidebar-nav">
                {NAV_BOTTOM.map((item) => (
                    <NavLink key={item.label} {...item} />
                ))}
            </nav>
        </aside>
    );
}
