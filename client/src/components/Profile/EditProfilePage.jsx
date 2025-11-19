import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import './Profile.css';
import logo from "../../../assets/medbuddie_logo.png";
import 'material-icons/iconfont/material-icons.css';


export default function EditProfilePage() {
    const { user, updateUser } = useUser();
    const [form, setForm] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                bio: user.bio || '',
                weight: user.weight || '',
                height: user.height || '',
                bmi: user.bmi || '',
                bloodPressure: user.bloodPressure || '',
                lipidPanel: user.lipidPanel || '',
                medications: user.medications?.length
                    ? user.medications
                    : [
                        { name: "", frequency: "" },
                        { name: "", frequency: "" },
                        { name: "", frequency: "" },
                    ],
            });
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
        if (!user || !user.id) {
            alert("User not loaded yet");
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    ...form,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || "Failed to update profile");
                return;
            }

            updateUser(data);      // Update context
            alert("Profile updated successfully!");
            window.location.href = "/profile";

        } catch (err) {
            console.error("Profile update error:", err);
            alert("Server error");
        }
    };

    return (
        <>
        <div className="edit-profile-page">
            <div className="medbuddie-header">
                <div className="medbuddie-logo-row">
                    <div className="logo">
                        <img src={logo} alt="MedBuddie Logo" width="40" height="40" />
                        <span>MedBuddie</span>
                    </div>
                </div>
                <button className="settings-button">
                    <span className="material-icons">settings</span>
                </button>
            </div>
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <div className="avatar-container">
                    <img
                        src="https://placehold.co/400"
                        alt="Profile"
                        className="avatar"
                    />
                    <button type="button">Change Photo</button>
                </div>

                <label>
                    <h4 className={"header_label"}>Name</h4>
                    <input
                        type="text"
                        name="name"
                        value={form?.name || ""}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    <h4 className={"header_label"}>Bio</h4>
                    <input
                        type="text"
                        name="bio"
                        value={form?.bio || ""}
                        onChange={handleChange}
                    />
                </label>

                <h4 className={"header_label"}>Personal Information</h4>
                <div className="grid-3">
                    <div>
                        <label>Weight</label>
                        <input
                            type="text"
                            name="weight"
                            value={form?.weight || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Height</label>
                        <input
                            type="text"
                            name="height"
                            value={form?.height || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>BMI</label>
                        <input
                            type="text"
                            name="bmi"
                            value={form?.bmi || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <h4 className={"header_label"}>Health Data</h4>
                <div className="grid-3">
                    <div>
                        <label>Blood Pressure</label>
                        <input
                            type="text"
                            name="bloodPressure"
                            value={form?.bloodPressure || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Lipid Panel</label>
                        <input
                            type="text"
                            name="lipidPanel"
                            value={form?.lipidPanel || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <h4 className={"header_label"}>Medications</h4>
                {form?.medications.map((med, index) => (
                    <div key={index} className="med-row">
                        <input
                            type="text"
                            value={med.name || ""}
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
        </>
    );
}
