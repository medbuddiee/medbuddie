// LeftNav.jsx
import { FaHome, FaBookOpen, FaStar, FaUserFriends, FaUserMd, FaUsers, FaComments } from 'react-icons/fa';
export default function LeftNav() {
    return (
        <aside className="left-nav">
            <div className="nav-icons">
                <FaHome />
                {/* other icons like search/chat/profile can go here */}
            </div>
            <nav className="nav-links">
                <a href="#">Current Guidelines</a>
                <a href="#">Top Articles of Week</a>
                <a href="#">Recommended Articles</a>
                <a href="#">MedBuddies</a>
                <a href="#">Dr. W. Nguyen</a>
                <a href="#">Dr. S. Patel</a>
                <a href="#">Dr. J. Rivera</a>
                <a href="#">Dr. L. Thompson</a>
                <div className="second-opinion-btn">
                    Get a Second Opinion
                </div>
            </nav>
        </aside>
    );
}
