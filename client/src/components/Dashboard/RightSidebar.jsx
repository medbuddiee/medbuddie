import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { FaChevronRight, FaBookOpen, FaHeartbeat } from 'react-icons/fa';

/* ── Static mock data ─────────────────────────────────────────────────────── */
// Bar values: relative activity over the last 12 time slots
const BAR_DATA = [22, 40, 36, 58, 72, 55, 78, 63, 88, 70, 82, 93];

const TOP_MEMBERS = [
    { name: 'Dr. Nguyen', steps: '8,432', color: '#b2dfdb' },
    { name: 'Dr. Datal',  steps: '6,200', color: '#c8e6c9' },
    { name: 'Eulinsh',    steps: '6,243', color: '#bbdefb' },
    { name: 'Real P.',    steps: '8,440', color: '#e1bee7' },
    { name: 'Angela C.',  steps: '8,200', color: '#fce4ec' },
    { name: 'Bar W.',     steps: '6,432', color: '#fff9c4' },
];

/* ── Mini bar chart ──────────────────────────────────────────────────────── */
function MiniBarChart({ data }) {
    const max = Math.max(...data, 1);
    return (
        <div className="rs-mini-chart">
            {data.map((v, i) => (
                <div key={i} className="rs-mini-bar-col">
                    <div
                        className="rs-mini-bar"
                        style={{ height: `${Math.round((v / max) * 100)}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   RIGHT SIDEBAR
   ══════════════════════════════════════════════════════════════════════════════ */
export default function RightSidebar({ metrics }) {
    const navigate = useNavigate();
    const hasProfile = metrics?.weight || metrics?.height || metrics?.bmi;

    /* Metric rows: connected to real user data from UserContext via Dashboard */
    const statRows = [
        {
            icon: '⚖',
            label:   'Weight',
            current: metrics?.weight ? `${metrics.weight} lb` : '—',
            target:  '155 lb',
        },
        {
            icon: '📏',
            label:   'Height',
            current: metrics?.height || '—',
            target:  null,
        },
        {
            icon: '📊',
            label:   'BMI',
            current: metrics?.bmi    || '—',
            target:  '25.1',
        },
        {
            icon: '💉',
            label:   'Blood Pressure',
            current: metrics?.bloodPressure || '—',
            target:  null,
        },
    ];

    return (
        <aside className="right-sidebar">

            {/* ── Personal Stats (health metrics) ── */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Personal Stats</span>
                    <button
                        className="rs-pill-btn"
                        onClick={() => navigate(hasProfile ? '/profile' : '/edit-profile')}
                    >
                        {hasProfile ? 'About' : 'Set up'} ›
                    </button>
                </div>

                <div className="rs-stat-rows">
                    {statRows.map(r => (
                        <div key={r.label} className="rs-stat-row-new">
                            <span className="rs-stat-icon-col">{r.icon}</span>
                            <span className="rs-stat-label-new">{r.label}</span>
                            <span className="rs-stat-val-new">{r.current}</span>
                            {r.target && (
                                <span className="rs-stat-target">{r.target}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="rs-stat-cta-row">
                    <button
                        className="rs-cta-outline"
                        onClick={() => navigate('/edit-profile')}
                    >
                        Update health data
                    </button>
                    <button
                        className="rs-cta-solid"
                        onClick={() => navigate('/profile')}
                    >
                        View Profile
                    </button>
                </div>
            </div>

            {/* ── Activity / Steps widget ── */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Personal Stats</span>
                    <span className="rs-streak-badge">Streak up ↑</span>
                </div>

                <div className="rs-chart-labels">
                    <span>All</span>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                </div>

                <MiniBarChart data={BAR_DATA} />

                <div className="rs-steps-info">
                    <div className="rs-steps-row">
                        <span className="rs-steps-label">Your Steps Goals</span>
                        <span className="rs-steps-val rs-steps-primary">8,400 steps</span>
                    </div>
                    <div className="rs-steps-row">
                        <span className="rs-steps-label">Peers Avg: 113%</span>
                        <span className="rs-steps-val">7,100 steps</span>
                    </div>
                </div>

                <div className="rs-chart-filter-row">
                    <span className="rs-chart-filter-label">Steps:</span>
                    <span className="rs-chart-filter-active">D1</span>
                    <span className="rs-chart-filter-sep">|</span>
                    <span className="rs-chart-filter-label">Realistic Trend ▼</span>
                </div>
            </div>

            {/* ── Helpful Resources ── */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Helpful Resources</span>
                    <button
                        className="rs-see-all-btn"
                        onClick={() => navigate('/guidelines')}
                    >
                        See All
                    </button>
                </div>

                <div className="rs-resource-list">
                    <div
                        className="rs-resource-item"
                        onClick={() => navigate('/guidelines')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="rs-resource-thumb rs-resource-teal">
                            <FaBookOpen size={13} color="#005c55" />
                        </div>
                        <div className="rs-resource-body">
                            <p className="rs-resource-title">Current Guidelines</p>
                            <p className="rs-resource-sub">
                                Latest evidence-based clinical recommendations
                            </p>
                        </div>
                        <FaChevronRight size={10} className="rs-resource-arrow" />
                    </div>

                    <div
                        className="rs-resource-item"
                        onClick={() => navigate('/profile')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="rs-resource-thumb rs-resource-blue">
                            <FaHeartbeat size={13} color="#1565c0" />
                        </div>
                        <div className="rs-resource-body">
                            <p className="rs-resource-title">Health Monitoring</p>
                            <p className="rs-resource-sub">
                                Tips for monitoring your medication intake
                            </p>
                        </div>
                        <FaChevronRight size={10} className="rs-resource-arrow" />
                    </div>
                </div>
            </div>

            {/* ── Top Members ── */}
            <div className="rs-widget">
                <div className="rs-widget-header">
                    <span className="rs-widget-title">Top Members</span>
                </div>
                <div className="rs-member-list">
                    {TOP_MEMBERS.map((m, i) => (
                        <div key={i} className="rs-member-item">
                            <div
                                className="rs-member-avatar"
                                style={{ background: m.color }}
                            >
                                {m.name[0]}
                            </div>
                            <span className="rs-member-name">{m.name}</span>
                            <span className="rs-member-steps">{m.steps} steps</span>
                        </div>
                    ))}
                </div>
            </div>

        </aside>
    );
}
