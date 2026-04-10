import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Dashboard.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaSearch, FaCog, FaBell, FaUserCircle } from 'react-icons/fa';

export default function TopNav() {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    return (
        <header className="topnav">
            <div className="topnav-left">
                <img src={logo} alt="MedBuddie" width="28" height="28" />
                <span className="topnav-brand">MedBuddie</span>
            </div>

            <div className="topnav-center">
                <div className="topnav-search-wrap">
                    <FaSearch className="topnav-search-icon" />
                    <input type="text" placeholder="Search" className="topnav-search" />
                </div>
            </div>

            <div className="topnav-right">
                <button className="topnav-icon-btn" aria-label="Notifications"><FaBell /></button>
                <button className="topnav-icon-btn" aria-label="Settings"><FaCog /></button>
                <button
                    className="topnav-avatar-btn"
                    onClick={handleLogout}
                    title={`Signed in as ${user?.name || user?.email} — click to sign out`}
                >
                    <FaUserCircle size={28} />
                </button>
            </div>
        </header>
    );
}
