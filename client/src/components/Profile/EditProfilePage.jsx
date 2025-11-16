import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import './Profile.css';

export default function EditProfilePage() {
    const { user, updateUser } = useUser();
    const initialMedication = { name: '', frequency: '' };

    const [form, setForm] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        weight: user?.weight || '',
        height: user?.height || '',
        bmi: user?.bmi || '',
        bloodPressure: user?.bloodPressure || '',
        lipidPanel: user?.lipidPanel || '',
        medications: user?.medications?.length
            ? user.medications
            : [
                { ...initialMedication },
                { ...initialMedication },
                { ...initialMedication },
            ],
    });

    // Fetch only if context is empty
    useEffect(() => {
        if (!user) {
            fetch('/api/profile')
                .then((res) => res.json())
                .then((data) => {
                    setForm({
                        name: data.name || '',
                        bio: data.bio || '',
                        weight: data.weight || '',
                        height: data.height || '',
                        bmi: data.bmi || '',
                        bloodPressure: data.bloodPressure || '',
                        lipidPanel: data.lipidPanel || '',
                        medications:
                            data.medications?.length
                                ? data.medications
                                : [
                                    { ...initialMedication },
                                    { ...initialMedication },
                                    { ...initialMedication },
                                ],
                    });
                    updateUser(data); // ✅ Store fetched data globally
                })
                .catch(console.error);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleMedicationChange = (index, field, value) => {
        const updated = form.medications.map((med, i) =>
            i === index ? { ...med, [field]: value } : med
        );
        setForm((prev) => ({ ...prev, medications: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updatedProfile = await res.json();
                updateUser(updatedProfile); // ✅ sync with context
                window.location.href = '/profile';
            } else {
                alert('Failed to save changes');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="edit-profile-page">
            <h2>Edit Profile</h2>
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <div className="avatar-container">
                    <img
                        src="https://via.placeholder.com/120"
                        alt="Profile"
                        className="avatar"
                    />
                    <button type="button">Change Photo</button>
                </div>

                <label>
                    Name
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Bio
                    <input
                        type="text"
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                    />
                </label>

                <h4>Personal Information</h4>
                <div className="grid-3">
                    <div>
                        <label>Weight</label>
                        <input
                            type="text"
                            name="weight"
                            value={form.weight}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Height</label>
                        <input
                            type="text"
                            name="height"
                            value={form.height}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>BMI</label>
                        <input
                            type="text"
                            name="bmi"
                            value={form.bmi}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <h4>Health Data</h4>
                <div className="grid-3">
                    <div>
                        <label>Blood Pressure</label>
                        <input
                            type="text"
                            name="bloodPressure"
                            value={form.bloodPressure}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Lipid Panel</label>
                        <input
                            type="text"
                            name="lipidPanel"
                            value={form.lipidPanel}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <h4>Medications</h4>
                {form.medications.map((med, index) => (
                    <div key={index} className="med-row">
                        <input
                            type="text"
                            value={med.name}
                            placeholder="Medication name"
                            onChange={(e) =>
                                handleMedicationChange(index, 'name', e.target.value)
                            }
                        />
                        <select
                            value={med.frequency}
                            onChange={(e) =>
                                handleMedicationChange(index, 'frequency', e.target.value)
                            }
                        >
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Weekly">Weekly</option>
                        </select>
                    </div>
                ))}

                <div className="buttons-row">
                    <button type="submit" className="save-button">
                        Save Changes
                    </button>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => (window.location.href = '/profile')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
