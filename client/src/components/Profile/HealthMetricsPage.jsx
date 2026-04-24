import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './Profile.css';
import './HealthMetrics.css';
import {
    FaHeartbeat, FaRunning, FaAppleAlt,
    FaPills, FaWeight, FaChartLine, FaTint, FaFire,
} from 'react-icons/fa';

/* ── Circular progress (mini) ─────────────────────────────────────────────── */
function Ring({ value, color, size = 72 }) {
    const r    = (size / 2) - 8;
    const circ = 2 * Math.PI * r;
    const off  = circ * (1 - Math.min(Math.max(value, 0), 100) / 100);
    return (
        <div className="hm-ring-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eee" strokeWidth="7" />
                <circle
                    cx={size/2} cy={size/2} r={r}
                    fill="none" stroke={color} strokeWidth="7"
                    strokeDasharray={circ} strokeDashoffset={off}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size/2} ${size/2})`}
                />
            </svg>
            <div className="hm-ring-inner">
                <span className="hm-ring-val" style={{ color }}>{value}%</span>
            </div>
        </div>
    );
}

/* ── Trend pill ───────────────────────────────────────────────────────────── */
function Trend({ up, label }) {
    return (
        <span className={`hm-trend ${up ? 'hm-trend-up' : 'hm-trend-down'}`}>
            {up ? '↑' : '↓'} {label}
        </span>
    );
}

/* ── Horizontal bar ───────────────────────────────────────────────────────── */
function HBar({ pct, color }) {
    return (
        <div className="hm-hbar-track">
            <div className="hm-hbar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HEALTH METRICS PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function HealthMetricsPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    /* Fetch full profile for health data */
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        fetch('/api/profile', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(r => r.ok ? r.json() : null)
            .then(d => setProfile(d || user))
            .catch(() => setProfile(user));
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const display = profile || user || {};
    const meds    = display.medications?.filter(m => m.name) || [];

    /* ── Derived values ─────────────────────────────────────────────────── */
    const bmi   = parseFloat(display.bmi)   || 0;
    const bmiPct = bmi ? Math.min(Math.round((bmi / 40) * 100), 100) : 0;

    const weightNum = parseFloat(display.weight) || 0;
    const goalWeight = 155;
    const weightPct  = weightNum ? Math.round((goalWeight / weightNum) * 100) : 0;

    /* Activity/diet goals from localStorage (set via Edit Health Metrics page) */
    const savedGoals = (() => {
        try { return JSON.parse(localStorage.getItem('hm_activity_diet') || '{}'); } catch { return {}; }
    })();
    const activity = {
        steps: 7856,
        stepsGoal:  savedGoals.stepsGoal          || 10000,
        calories:   480,
        calGoal:    savedGoals.caloriesBurnedGoal  || 600,
        workout:    40,
        workoutGoal: savedGoals.workoutGoal        || 60,
    };
    const diet = {
        calories:     1850,
        caloriesGoal: savedGoals.caloriesIntakeGoal || 2200,
        carbs:        235, carbsGoal: savedGoals.carbsGoal   || 300,
        protein:       96, proteinGoal: savedGoals.proteinGoal || 130,
        fat:           56, fatGoal:   savedGoals.fatGoal     || 70,
    };

    const stepsPct    = Math.round((activity.steps / activity.stepsGoal) * 100);
    const calDietPct  = Math.round((diet.calories  / diet.caloriesGoal)  * 100);

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
            <Sidebar />
            <div className="hm-page profile-page-scrollable">

                {/* ── Page title ── */}
                <div className="hm-page-title-row">
                    <div>
                        <h2 className="hm-page-title">
                            <FaChartLine size={18} style={{ marginRight: 8, color: '#005c55' }} />
                            Health Metrics &amp; Insights
                        </h2>
                        <p className="hm-page-sub">
                            Detailed overview of your health data — updated from your profile.
                        </p>
                    </div>
                    <button className="edit-button" onClick={() => navigate('/edit-health-metrics')}>
                        Update Data
                    </button>
                </div>

                {/* ══ Row 1: Summary rings ══ */}
                <div className="hm-rings-row">

                    <div className="hm-ring-card">
                        <div className="hm-ring-card-icon" style={{ background: '#e0f2f1' }}>
                            <FaHeartbeat color="#005c55" size={16} />
                        </div>
                        <Ring value={82} color="#005c55" />
                        <p className="hm-ring-label">Health Score</p>
                        <Trend up label="3% this month" />
                    </div>

                    <div className="hm-ring-card">
                        <div className="hm-ring-card-icon" style={{ background: '#e3f2fd' }}>
                            <FaRunning color="#1565c0" size={16} />
                        </div>
                        <Ring value={stepsPct} color="#1565c0" />
                        <p className="hm-ring-label">Steps Goal</p>
                        <p className="hm-ring-sub">{activity.steps.toLocaleString()} / {activity.stepsGoal.toLocaleString()}</p>
                    </div>

                    <div className="hm-ring-card">
                        <div className="hm-ring-card-icon" style={{ background: '#fce4ec' }}>
                            <FaFire color="#c62828" size={16} />
                        </div>
                        <Ring value={calDietPct} color="#c62828" />
                        <p className="hm-ring-label">Calories</p>
                        <p className="hm-ring-sub">{diet.calories} / {diet.caloriesGoal} kcal</p>
                    </div>

                    <div className="hm-ring-card">
                        <div className="hm-ring-card-icon" style={{ background: '#f3e5f5' }}>
                            <FaPills color="#6a1b9a" size={16} />
                        </div>
                        <Ring value={meds.length > 0 ? 100 : 0} color="#6a1b9a" />
                        <p className="hm-ring-label">Medications</p>
                        <p className="hm-ring-sub">{meds.length} active</p>
                    </div>

                </div>

                {/* ══ Row 2: Vitals + Activity ══ */}
                <div className="hm-two-col">

                    {/* Vitals */}
                    <div className="card">
                        <div className="hm-card-head">
                            <FaTint color="#c62828" size={14} />
                            <h4 className="card-title" style={{ margin: 0 }}>Vital Statistics</h4>
                        </div>
                        <div className="divider" style={{ marginTop: '0.6rem' }} />

                        <div className="hm-vital-list">
                            {[
                                {
                                    label: 'Weight',
                                    val: display.weight ? `${display.weight} lbs` : '—',
                                    sub: `Goal: ${goalWeight} lbs`,
                                    pct: weightPct,
                                    color: '#005c55',
                                },
                                {
                                    label: 'BMI',
                                    val: display.bmi || '—',
                                    sub: 'Normal: 18.5–24.9',
                                    pct: bmiPct,
                                    color: bmi > 0 && bmi <= 24.9 ? '#005c55' : '#e65100',
                                },
                                {
                                    label: 'Blood Pressure',
                                    val: display.bloodPressure ? `${display.bloodPressure} mmHg` : '—',
                                    sub: 'Target: < 130/80',
                                    pct: 72,
                                    color: '#1565c0',
                                },
                                {
                                    label: 'HbA1c',
                                    val: display.hba1c ? `${display.hba1c}%` : '—',
                                    sub: 'Target: < 7%',
                                    pct: display.hba1c ? Math.round((7 / display.hba1c) * 100) : 0,
                                    color: '#6a1b9a',
                                },
                                {
                                    label: 'Height',
                                    val: display.height || '—',
                                    sub: null,
                                    pct: null,
                                    color: '#005c55',
                                },
                            ].map(row => (
                                <div key={row.label} className="hm-vital-row">
                                    <div className="hm-vital-top">
                                        <span className="hm-vital-label">{row.label}</span>
                                        <span className="hm-vital-val">{row.val}</span>
                                    </div>
                                    {row.sub && <p className="hm-vital-sub">{row.sub}</p>}
                                    {row.pct !== null && row.val !== '—' && (
                                        <HBar pct={row.pct} color={row.color} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="card">
                        <div className="hm-card-head">
                            <FaRunning color="#1565c0" size={14} />
                            <h4 className="card-title" style={{ margin: 0 }}>Activity Tracking</h4>
                        </div>
                        <div className="divider" style={{ marginTop: '0.6rem' }} />

                        <div className="hm-activity-stats">
                            {[
                                { label: 'Steps Today',     val: activity.steps.toLocaleString(), goal: `/ ${activity.stepsGoal.toLocaleString()}`, pct: stepsPct, color: '#1565c0' },
                                { label: 'Calories Burned', val: `${activity.calories} kcal`,     goal: `/ ${activity.calGoal} kcal goal`, pct: Math.round((activity.calories / activity.calGoal) * 100), color: '#e65100' },
                                { label: 'Workout Time',    val: `${activity.workout} min`,        goal: `/ ${activity.workoutGoal} min goal`, pct: Math.round((activity.workout / activity.workoutGoal) * 100), color: '#005c55' },
                            ].map(a => (
                                <div key={a.label} className="hm-activity-row">
                                    <div className="hm-activity-row-top">
                                        <span className="hm-activity-label">{a.label}</span>
                                        <span className="hm-activity-val">
                                            <strong>{a.val}</strong>
                                            <span className="hm-activity-goal">{a.goal}</span>
                                        </span>
                                    </div>
                                    <HBar pct={a.pct} color={a.color} />
                                </div>
                            ))}
                        </div>

                        {/* Weekly snapshot */}
                        <h5 className="hm-subsection-title">Weekly Steps</h5>
                        <div className="hm-week-bars">
                            {[
                                { day: 'Mon', pct: 80 },
                                { day: 'Tue', pct: 65 },
                                { day: 'Wed', pct: 90 },
                                { day: 'Thu', pct: 45 },
                                { day: 'Fri', pct: 78 },
                                { day: 'Sat', pct: 55 },
                                { day: 'Sun', pct: 78 },
                            ].map(d => (
                                <div key={d.day} className="hm-week-bar-col">
                                    <div className="hm-week-bar-track">
                                        <div
                                            className="hm-week-bar-fill"
                                            style={{ height: `${d.pct}%`, background: '#1565c0' }}
                                        />
                                    </div>
                                    <span className="hm-week-day">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ══ Row 3: Diet + Medications ══ */}
                <div className="hm-two-col">

                    {/* Diet */}
                    <div className="card">
                        <div className="hm-card-head">
                            <FaAppleAlt color="#2e7d32" size={14} />
                            <h4 className="card-title" style={{ margin: 0 }}>Diet Summary</h4>
                        </div>
                        <div className="divider" style={{ marginTop: '0.6rem' }} />

                        <div className="hm-macro-grid">
                            {[
                                { label: 'Calories',      val: `${diet.calories}`,  unit: 'kcal', goal: diet.caloriesGoal, color: '#e65100' },
                                { label: 'Carbohydrates', val: `${diet.carbs}`,     unit: 'g',    goal: diet.carbsGoal,   color: '#f9a825' },
                                { label: 'Protein',       val: `${diet.protein}`,   unit: 'g',    goal: diet.proteinGoal, color: '#1565c0' },
                                { label: 'Fat',           val: `${diet.fat}`,       unit: 'g',    goal: diet.fatGoal,     color: '#c62828' },
                            ].map(m => {
                                const pct = Math.round((parseInt(m.val) / m.goal) * 100);
                                return (
                                    <div key={m.label} className="hm-macro-item">
                                        <div className="hm-macro-top">
                                            <span className="hm-macro-label">{m.label}</span>
                                            <span className="hm-macro-val" style={{ color: m.color }}>
                                                {m.val} {m.unit}
                                            </span>
                                        </div>
                                        <HBar pct={pct} color={m.color} />
                                        <span className="hm-macro-goal">Goal: {m.goal} {m.unit}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="hm-fasting-row">
                            <span className="hm-fasting-label">Intermittent Fasting</span>
                            <div className="if-badges">
                                <span className="if-badge">16 hr fast</span>
                                <span className="if-badge">8 hr eat</span>
                            </div>
                        </div>
                    </div>

                    {/* Medications */}
                    <div className="card">
                        <div className="hm-card-head">
                            <FaPills color="#6a1b9a" size={14} />
                            <h4 className="card-title" style={{ margin: 0 }}>Medication Schedule</h4>
                        </div>
                        <div className="divider" style={{ marginTop: '0.6rem' }} />

                        {meds.length > 0 ? (
                            <div className="hm-med-list">
                                {meds.map((med, i) => (
                                    <div key={i} className="hm-med-item">
                                        <div className="hm-med-dot" style={{ background: ['#005c55','#1565c0','#c62828','#f9a825'][i % 4] }} />
                                        <div className="hm-med-body">
                                            <span className="hm-med-name">{med.name}</span>
                                            {med.frequency && (
                                                <span className="hm-med-freq">{med.frequency}</span>
                                            )}
                                        </div>
                                        <span className="hm-med-time">
                                            {['8:00 AM', '12:00 PM', '6:00 PM', '10:00 PM'][i % 4]}
                                        </span>
                                        <span className="hm-med-check">✓</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="hm-empty">
                                <p className="empty-text">No medications listed.</p>
                                <button className="inline-link" onClick={() => navigate('/edit-profile')}>
                                    Add medications →
                                </button>
                            </div>
                        )}

                        <div className="hm-med-cta">
                            <button className="edit-button" onClick={() => navigate('/edit-health-metrics')}>
                                Manage Medications
                            </button>
                        </div>
                    </div>

                </div>

                {/* ══ Health Goals ══ */}
                <div className="card">
                    <div className="hm-card-head">
                        <FaWeight color="#005c55" size={14} />
                        <h4 className="card-title" style={{ margin: 0 }}>Health Goals</h4>
                    </div>
                    <div className="divider" style={{ marginTop: '0.6rem' }} />

                    <div className="hm-goals-grid">
                        {[
                            { icon: '🏃', title: 'Daily Steps',      target: `${activity.stepsGoal.toLocaleString()} steps`, current: `${activity.steps.toLocaleString()} steps`, pct: stepsPct, color: '#1565c0' },
                            { icon: '⚖',  title: 'Target Weight',    target: `${goalWeight} lbs`, current: display.weight ? `${display.weight} lbs` : '—', pct: weightPct, color: '#005c55' },
                            { icon: '🍎', title: 'Calorie Intake',   target: `${diet.caloriesGoal} kcal`, current: `${diet.calories} kcal`, pct: calDietPct, color: '#e65100' },
                            { icon: '💊', title: 'Medication Streak', target: '30 days',        current: '14 days',                                      pct: 47,          color: '#6a1b9a' },
                        ].map(g => (
                            <div key={g.title} className="hm-goal-card">
                                <div className="hm-goal-icon">{g.icon}</div>
                                <p className="hm-goal-title">{g.title}</p>
                                <p className="hm-goal-current">{g.current}</p>
                                <p className="hm-goal-target">Goal: {g.target}</p>
                                <HBar pct={g.pct} color={g.color} />
                                <span className="hm-goal-pct" style={{ color: g.color }}>{g.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ CTA row ══ */}
                <div className="hm-cta-row">
                    <button className="save-button" onClick={() => navigate('/edit-health-metrics')}>
                        Update Health Data
                    </button>
                    <button className="cancel-button" onClick={() => navigate('/profile')}>
                        View Full Profile
                    </button>
                    <button className="cancel-button" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>

            </div>
            </div>
        </div>
    );
}
