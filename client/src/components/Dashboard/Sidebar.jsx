// import React from 'react';
// import './Dashboard.css';
// import logo from '../../../assets/medbuddie_logo.png';
//
// export default function Sidebar() {
//     return (
//         <div className="sidebar">
//             <div className="logo-search">
//                 <img src={logo} alt="MedBuddie" className="logo" />
//                 <input type="text" placeholder="Search" className="search-bar" />
//             </div>
//             <nav className="nav-links">
//                 <a href="#">Health Feed</a>
//                 <a href="#">Current Guidelines</a>
//                 <a href="#">Top Articles of the week</a>
//                 <a href="#">Recommended Articles</a>
//                 <a href="#">MedBuddies</a>
//                 <a href="#">Physicians Followed</a>
//                 <a href="#">Communities</a>
//                 <a href="#">Second Opinion</a>
//             </nav>
//         </div>
//     );
// }

import React from 'react';
import './Dashboard.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaHome, FaBookOpen, FaStar, FaUserFriends, FaUserMd, FaUsers, FaSearch, FaComments } from 'react-icons/fa';

export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="logo-search">
                <img src={logo} alt="MedBuddie" className="logo" />
                <div className="search-bar-wrapper">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Search" className="search-bar" />
                </div>
            </div>
            <nav className="nav-links">
                <a href="#"><FaHome /> Health Feed</a>
                <a href="#"><FaBookOpen /> Current Guidelines</a>
                <a href="#"><FaStar /> Top Articles</a>
                <a href="#"><FaStar /> Recommended Articles</a>
                <a href="#"><FaUserFriends /> MedBuddies</a>
                <a href="#"><FaUserMd /> Physicians Followed</a>
                <a href="#"><FaUsers /> Communities</a>
                <a href="#"><FaComments /> Second Opinion</a>
            </nav>
        </div>
    );
}
