import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/AddEmployee.css';
import { API_BASE_URL } from "../../config";

const AddEmployee = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // --- Form State (Updated to snake_case for Django) ---
    const [formData, setFormData] = useState({
        // Account Details
        employee_id: '',
        username: '',
        password: '',
        // Personal Details
        first_name: '',
        last_name: '',
        joined_date: '',
        pan_number: '',
        // Contact Details
        official_email: '',
        personal_email: '',
        phone_number: '',
        emergency_contact: '',
        // Employment Details
        employment_type: 'Full-Time',
        status: 'Active',
        department: '', // Will store the department ID
        designation: '',
        reporting_manager: '' // Will store the manager ID
    });

    // --- Dropdown States ---
    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Fetch Managers & Departments on Mount ---
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // Fetch Managers
                const mgrRes = await fetch(`${API_BASE_URL}/api/manager/managers-list/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (mgrRes.ok) {
                    const mgrData = await mgrRes.json();
                    setManagers(mgrData.results || mgrData);
                }

                // Fetch Departments
                const deptRes = await fetch(`${API_BASE_URL}/api/departments/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (deptRes.ok) {
                    const deptData = await deptRes.json();
                    console.log("Departments from Django:", deptData)
                    setDepartments(deptData.results || deptData);
                }
            } catch (err) {
                console.error("Failed to fetch dropdown data:", err);
            }
        };
        fetchDropdownData();
    }, [token]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let tempPassword = "";
        for (let i = 0; i < 12; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: tempPassword }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/manager/employee-overview/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                // SUCCESS: Updated to the correct manager route
                navigate('/manager/employee-overview');
            } else {
                const errData = await res.json();

                // Better error formatting in case Django returns field-specific errors
                let errorMsg = 'Failed to add employee. Please check the inputs.';
                if (errData.detail) {
                    errorMsg = errData.detail;
                } else if (typeof errData === 'object') {
                    errorMsg = Object.entries(errData)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(' | ');
                }

                setError(errorMsg);
            }
        } catch (err) {
            setError('Network error occurred while adding employee.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-employee-page">
            <div className="page-header page-header-row">
                {/* BACK BUTTON: Updated to the correct manager route */}
                <button className="back-btn" onClick={() => navigate('/manager/employee-overview')}>
                    &larr; Back to Overview
                </button>
                <h2>Add New Employee</h2>
                <p>Fill in the details below to add a new employee to the system.</p>
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="add-employee-form">

                {/* 1. Account / Login Details */}
                <div className="form-section">
                    <h3>Account / Login Details</h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Employee ID *</label>
                            <input type="text" name="employee_id" required value={formData.employee_id} onChange={handleChange} placeholder="e.g. EMP-001" />
                        </div>
                        <div className="input-group">
                            <label>Username *</label>
                            <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="e.g. johndoe" />
                        </div>
                        <div className="input-group password-group">
                            <label>Password *</label>
                            <div className="password-input-wrapper">
                                <input type="text" name="password" required value={formData.password} onChange={handleChange} placeholder="Generated password" />
                                <button type="button" onClick={generatePassword} className="btn-generate">Generate</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Personal Details */}
                <div className="form-section">
                    <h3>Personal Details</h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>First Name *</label>
                            <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Last Name *</label>
                            <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Joined Date *</label>
                            <input type="date" name="joined_date" required value={formData.joined_date} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>PAN Number</label>
                            <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* 3. Contact Details */}
                <div className="form-section">
                    <h3>Contact Details</h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Official Email *</label>
                            <input type="email" name="official_email" required value={formData.official_email} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Personal Email</label>
                            <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Phone Number *</label>
                            <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Emergency Contact Number</label>
                            <input type="tel" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* 4. Employment Details */}
                <div className="form-section">
                    <h3>Employment Details</h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Employment Type *</label>
                            <select name="employment_type" required value={formData.employment_type} onChange={handleChange}>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Status *</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input type="radio" name="status" value="Active" checked={formData.status === 'Active'} onChange={handleChange} />
                                    Active
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'} onChange={handleChange} />
                                    Inactive
                                </label>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Department *</label>
                            <select name="department" required value={formData.department} onChange={handleChange}>
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Designation *</label>
                            <input type="text" name="designation" required value={formData.designation} onChange={handleChange} placeholder="e.g. Senior Developer" />
                        </div>

                        <div className="input-group">
                            <label>Reporting Manager *</label>
                            <select name="reporting_manager" required value={formData.reporting_manager} onChange={handleChange}>
                                <option value="">Select Manager</option>
                                {managers.map((mgr) => (
                                    <option key={mgr.id} value={mgr.id}>{mgr.full_name || mgr.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    {/* CANCEL BUTTON: Updated to the correct manager route */}
                    <button type="button" className="btn-cancel" onClick={() => navigate('/manager/employee-overview')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployee;