// TopNav.jsx
import logo from '../../../assets/medbuddie_logo.png';
import { FaCog } from 'react-icons/fa';

export default function TopNav() {
    return (
        <header className="top-nav">
            <img src={logo} alt="MedBuddie" className="logo-small" />
            <input type="text" className="top-search" placeholder="Search" />
            <div className="profile-area">
                <span>14 | h</span>
                <img src="https://via.placeholder.com/32" className="profile-pic" alt="Profile" />
                <FaCog />
            </div>
        </header>
    );
}
