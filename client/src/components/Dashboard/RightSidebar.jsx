import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { FaChevronRight } from 'react-icons/fa';

const TOP_ARTICLES = [
    'New guidelines for Type 2 Diabetes management',
    'Understanding cardiovascular risk factors',
    'Managing chronic pain with mindfulness',
    'Advances in immunotherapy for cancer',
    'Sleep disorders and mental health connection',
    'Gut microbiome and immune system',
    'Benefits of intermittent fasting',
    'New research on Alzheimer\'s prevention',
];

const MEDBUDDIES = ['A', 'B', 'C', 'D'];

export default function RightSidebar({ metrics }) {
    const navigate = useNavigate();

    const hasProfile = metrics?.weight && metrics?.height;

    return (
        <aside className="right-sidebar">
            {/* Current Guidelines */}
            <div className="rs-widget rs-link-widget" onClick={() => navigate('/guidelines')}>
                <span className="rs-widget-title">Current Guidelines</span>
                <FaChevronRight size={12} className="rs-chevron" />
            </div>

            {/* Top Articles */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Top Articles of the Week</span>
                </div>
                <ol className="rs-article-list">
                    {TOP_ARTICLES.map((article, i) => (
                        <li key={i}>
                            <span className="rs-article-num">{i + 1}.</span>
                            <span className="rs-article-title">{article}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Private Messages */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Private Messages</span>
                </div>
                <div className="rs-avatar-row">
                    {MEDBUDDIES.map((initial, i) => (
                        <div key={i} className="rs-avatar">{initial}</div>
                    ))}
                </div>
            </div>

            {/* MedBuddies */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">MedBuddies</span>
                    <button className="rs-more-btn" onClick={() => navigate('/medbuddies')}>
                        more <FaChevronRight size={10} />
                    </button>
                </div>
                <div className="rs-avatar-row">
                    {MEDBUDDIES.map((initial, i) => (
                        <div key={i} className="rs-avatar">{initial}</div>
                    ))}
                </div>
                <div className="rs-community-list">
                    <div className="rs-community-item" onClick={() => navigate('/communities')}>
                        <span>Communities</span>
                        <FaChevronRight size={10} />
                    </div>
                    <div className="rs-community-item">
                        <span>Joined</span>
                        <FaChevronRight size={10} />
                    </div>
                </div>
            </div>

            {/* Personal Stats */}
            <div
                className="rs-widget rs-stats-widget"
                onClick={() => navigate(hasProfile ? '/profile' : '/edit-profile')}
                style={{ cursor: 'pointer' }}
            >
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Personal Stats</span>
                </div>
                <div className="rs-stats-list">
                    {[
                        ['Weight', metrics?.weight ? `${metrics.weight} lbs.` : '—'],
                        ['Height', metrics?.height || '—'],
                        ['BMI', metrics?.bmi || '—'],
                        ['Blood Pressure', metrics?.bloodPressure || '—'],
                    ].map(([label, value]) => (
                        <div key={label} className="rs-stat-row">
                            <span className="rs-stat-label">{label}</span>
                            <span className="rs-stat-value">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
