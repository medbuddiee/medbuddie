import React from 'react';
import './Dashboard.css';
import { useUser } from '../../context/UserContext.jsx';

export default function RightSidebar() {
    const { user } = useUser();

    return (
        <div className="right-sidebar">
            <div className="widget">
                <h4>Current Guidelines</h4>
                <ul>
                    <li>Article aefialestansi</li>
                    <li>Article affiaillous</li>
                    <li>Article an refiating</li>
                    <li>Article cansyfieology</li>
                    <li>Article scientific anere</li>
                </ul>
            </div>

            <div className="widget">
                <h4>Second Opinion</h4>
                <div className="second-opinion">
                    <img src="https://via.placeholder.com/80" alt="Doctor" />
                    <p>Weight: {user?.weight || '172 lbs'}</p>
                    <p>Height: {user?.height || `5'11"`}</p>
                    <p>BMI: {user?.bmi || '24.0'}</p>
                    <p>BP: {user?.bloodPressure || '122/80 mmHg'}</p>
                </div>
            </div>
        </div>
    );
}
