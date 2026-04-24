import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './Profile.css';
import './HealthMetrics.css';
import {
    FaHeartbeat, FaRunning, FaAppleAlt,
    FaPills, FaWeight, FaChartLine, FaTint, FaPlus, FaTrash,
} from 'react-icons/fa';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Weekly', 'As needed'];

const LS_KEY = 'hm_activity_diet';

function loadActivityDiet() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        stepsGoal: 10000,
        caloriesBurnedGoal: 600,
        workoutGoal: 60,
        caloriesIntakeGoal: 2200,
        carbsGoal: 300,
        proteinGoal: 130,
        fatGoal: 70,
    };
}

export default function EditHealthMetricsPage() {
    const { user, updateUser } = useUser();
    const navigate = useNavigate();

    const [vitals, setVitals] = useState(null);
    const [activity, setActivity] = useState(null);
    const [meds, setMeds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        fetch('/api/profile', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(r => r.ok ? r.json() : user)
            .then(data => {
                const d = data || user;
                setVitals({
                    weight:        d.weight        || '',
                    height:        d.height        || '',
                    bmi:           d.bmi           || '',
                    bloodPressure: d.bloodPressure || d.blood_pressure || '',
                    hba1c:         d.hba1c         || '',
                    lipidPanel:    d.lipidPanel    || d.lipid_panel    || '',
                });
                const existingMeds = d.medications?.filter(m => m.name) || [];
                setMeds(existingMeds.length ? existingMeds : [{ name: '', frequency: '' }]);
            })
            .catch(() => {
                setVitals({ weight: '', height: '', bmi: '', bloodPressure: '', hba1c: '', lipidPanel: '' });
                setMeds([{ name: '', frequency: '' }]);
            });
        setActivity(loadActivityDiet());
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleVitalChange = (e) => {
        const { name, value } = e.target;
        setVitals(prev => ({ ...prev, [name]: value }));
    };

    const handleActivityChange = (e) => {
        const { name, value } = e.target;
        setActivity(prev => ({ ...prev, [name]: value }));
    };

    const handleMedChange = (i, field, value) => {
        setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
    };

    const addMed = () => setMeds(prev => [...prev, { name: '', frequency: '' }]);
    const removeMed = (i) => setMeds(prev => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) return setSaveError('Session expired — please sign in again.');
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Save vitals + medications to DB
            const token = localStorage.getItem('token');
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...vitals,
                    medications: meds.filter(m => m.name.trim()),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error || 'Save failed — please try again.');
                return;
            }
            updateUser(data);

            // Save activity/diet goals to localStorage
            localStorage.setItem(LS_KEY, JSON.stringify({
                stepsGoal:          parseInt(activity.stepsGoal)          || 10000,
                caloriesBurnedGoal: parseInt(activity.caloriesBurnedGoal) || 600,
                workoutGoal:        parseInt(activity.workoutGoal)        || 60,
                caloriesIntakeGoal: parseInt(activity.caloriesIntakeGoal) || 2200,
                carbsGoal:          parseInt(activity.carbsGoal)          || 300,
                proteinGoal:        parseInt(activity.proteinGoal)        || 130,
                fatGoal:            parseInt(activity.fatGoal)            || 70,
            }));

            setSaveSuccess(true);
            setTimeout(() => navigate('/activity'), 800);
        } catch {
            setSaveError('Cannot reach the server. Make sure the backend is running.');
        } finally {
            setSaving(false);
        }
    };

    if (!vitals || !activity) return <div className="loading">Loading…</div>;

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
            <Sidebar />
            <div className="edit-profile-page profile-page-scrollable">
                <form className="edit-profile-form ehm-form" onSubmit={handleSubmit}>

                    {/* ── Page header ── */}
                    <div className="hm-page-title-row" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <h2 className="hm-page-title">
                                <FaChartLine size={18} style={{ marginRight: 8, color: '#005c55' }} />
                                Update Health Metrics
                            </h2>
                            <p className="hm-page-sub">Edit your vitals, activity goals, diet targets, and medications.</p>
                        </div>
                    </div>

                    {saveError   && <p className="form-error">{saveError}</p>}
                    {saveSuccess && <p className="form-success">Health data saved!</p>}

                    {/* ── Section: Vital Statistics ── */}
                    <div className="ehm-section-card">
                        <div className="hm-card-head">
                            <FaTint color="#c62828" size={15} />
                            <h4 className="card-title" style={{ margin: 0 }}>Vital Statistics</h4>
                        </div>
                        <div className="divider" style={{ margin: '0.75rem 0' }} />

                        <div className="grid-3">
                            <div className="field-col">
                                <label>Weight</label>
                                <input
                                    type="text"
                                    name="weight"
                                    value={vitals.weight}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. 172 lbs"
                                />
                            </div>
                            <div className="field-col">
                                <label>Height</label>
                                <input
                                    type="text"
                                    name="height"
                                    value={vitals.height}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. 5'9&quot;"
                                />
                            </div>
                            <div className="field-col">
                                <label>BMI</label>
                                <input
                                    type="text"
                                    name="bmi"
                                    value={vitals.bmi}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. 26.9"
                                />
                            </div>
                        </div>

                        <div className="grid-3" style={{ marginTop: '1rem' }}>
                            <div className="field-col">
                                <label>Blood Pressure</label>
                                <input
                                    type="text"
                                    name="bloodPressure"
                                    value={vitals.bloodPressure}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. 120/80"
                                />
                                <span className="ehm-hint">mmHg</span>
                            </div>
                            <div className="field-col">
                                <label>HbA1c</label>
                                <input
                                    type="text"
                                    name="hba1c"
                                    value={vitals.hba1c}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. 6.8"
                                />
                                <span className="ehm-hint">% · target &lt;7%</span>
                            </div>
                            <div className="field-col">
                                <label>Lipid Panel</label>
                                <input
                                    type="text"
                                    name="lipidPanel"
                                    value={vitals.lipidPanel}
                                    onChange={handleVitalChange}
                                    placeholder="e.g. Normal / Elevated LDL"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Activity Goals ── */}
                    <div className="ehm-section-card">
                        <div className="hm-card-head">
                            <FaRunning color="#1565c0" size={15} />
                            <h4 className="card-title" style={{ margin: 0 }}>Activity Goals</h4>
                        </div>
                        <div className="divider" style={{ margin: '0.75rem 0' }} />

                        <div className="grid-3">
                            <div className="field-col">
                                <label>Daily Steps Goal</label>
                                <input
                                    type="number"
                                    name="stepsGoal"
                                    value={activity.stepsGoal}
                                    onChange={handleActivityChange}
                                    min="1000"
                                    max="50000"
                                    step="500"
                                />
                                <span className="ehm-hint">steps / day</span>
                            </div>
                            <div className="field-col">
                                <label>Calories Burned Goal</label>
                                <input
                                    type="number"
                                    name="caloriesBurnedGoal"
                                    value={activity.caloriesBurnedGoal}
                                    onChange={handleActivityChange}
                                    min="100"
                                    max="3000"
                                    step="50"
                                />
                                <span className="ehm-hint">kcal / day</span>
                            </div>
                            <div className="field-col">
                                <label>Workout Time Goal</label>
                                <input
                                    type="number"
                                    name="workoutGoal"
                                    value={activity.workoutGoal}
                                    onChange={handleActivityChange}
                                    min="5"
                                    max="300"
                                    step="5"
                                />
                                <span className="ehm-hint">minutes / day</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Diet Targets ── */}
                    <div className="ehm-section-card">
                        <div className="hm-card-head">
                            <FaAppleAlt color="#2e7d32" size={15} />
                            <h4 className="card-title" style={{ margin: 0 }}>Daily Diet Targets</h4>
                        </div>
                        <div className="divider" style={{ margin: '0.75rem 0' }} />

                        <div className="grid-3">
                            <div className="field-col">
                                <label>Calorie Intake Goal</label>
                                <input
                                    type="number"
                                    name="caloriesIntakeGoal"
                                    value={activity.caloriesIntakeGoal}
                                    onChange={handleActivityChange}
                                    min="800"
                                    max="6000"
                                    step="50"
                                />
                                <span className="ehm-hint">kcal / day</span>
                            </div>
                            <div className="field-col">
                                <label>Carbohydrates Goal</label>
                                <input
                                    type="number"
                                    name="carbsGoal"
                                    value={activity.carbsGoal}
                                    onChange={handleActivityChange}
                                    min="50"
                                    max="600"
                                    step="5"
                                />
                                <span className="ehm-hint">g / day</span>
                            </div>
                            <div className="field-col">
                                <label>Protein Goal</label>
                                <input
                                    type="number"
                                    name="proteinGoal"
                                    value={activity.proteinGoal}
                                    onChange={handleActivityChange}
                                    min="20"
                                    max="400"
                                    step="5"
                                />
                                <span className="ehm-hint">g / day</span>
                            </div>
                        </div>

                        <div className="grid-3" style={{ marginTop: '1rem' }}>
                            <div className="field-col">
                                <label>Fat Goal</label>
                                <input
                                    type="number"
                                    name="fatGoal"
                                    value={activity.fatGoal}
                                    onChange={handleActivityChange}
                                    min="10"
                                    max="300"
                                    step="5"
                                />
                                <span className="ehm-hint">g / day</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Medications ── */}
                    <div className="ehm-section-card">
                        <div className="hm-card-head">
                            <FaPills color="#6a1b9a" size={15} />
                            <h4 className="card-title" style={{ margin: 0 }}>Medications</h4>
                        </div>
                        <div className="divider" style={{ margin: '0.75rem 0' }} />

                        <div className="ehm-med-list">
                            {meds.map((med, i) => (
                                <div key={i} className="ehm-med-row">
                                    <input
                                        type="text"
                                        value={med.name}
                                        placeholder="Medication name (e.g. Metformin 500mg)"
                                        onChange={(e) => handleMedChange(i, 'name', e.target.value)}
                                        className="ehm-med-name"
                                    />
                                    <select
                                        value={med.frequency}
                                        onChange={(e) => handleMedChange(i, 'frequency', e.target.value)}
                                        className="ehm-med-freq"
                                    >
                                        <option value="">Frequency</option>
                                        {FREQUENCIES.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="ehm-remove-btn"
                                        onClick={() => removeMed(i)}
                                        title="Remove"
                                        disabled={meds.length === 1}
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button type="button" className="ehm-add-med-btn" onClick={addMed}>
                            <FaPlus size={11} style={{ marginRight: 6 }} />
                            Add Medication
                        </button>
                    </div>

                    {/* ── Actions ── */}
                    <div className="buttons-row">
                        <button type="submit" className="save-button" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Health Data'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate('/activity')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
            </div>
        </div>
    );
}
