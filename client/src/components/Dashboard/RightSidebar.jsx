// RightSidebar.jsx
import { FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function RightSidebar({ metrics }) {
    const navigate = useNavigate();

    const handleStatsClick = () => {
        debugger
        const hasProfile = metrics?.weight && metrics?.height;
        if (hasProfile) {
            navigate('/profile');
        } else {
            navigate('/edit-profile');
        }
    };
    return (
        <aside className="right-sidebar">
            <div className="stats-card" onClick={handleStatsClick} style={{ cursor: 'pointer' }}>
                <h4>Personal Stats</h4>
                <p>Weight: {metrics.weight}</p>
                <p>Height: {metrics.height}</p>
                <p>BMI: {metrics.bmi}</p>
                <p>{metrics.bloodPressure}</p>
            </div>
            <div className="widget">
                <h4>
                    Activity <FaChevronDown />
                </h4>
                {/* details go here when expanded */}
            </div>
            <div className="widget">
                <h4>
                    Diet <FaChevronDown />
                </h4>
                {/* details go here */}
            </div>
            <div className="widget">
                <h4>
                    Medications <FaChevronDown />
                </h4>
                {/* details go here */}
            </div>
        </aside>
    );
}
