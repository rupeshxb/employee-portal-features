import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../style/AddEmployee.css'; // Reusing the exact same styles
import { API_BASE_URL } from "../../config";

const EditEmployee = () => {
    const { id } = useParams(); // Get the employee ID from the URL
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Form state (matches the backend fields)
    const [formData, setFormData] = useState({
        employee_id: '',
        username: '',
        password: '', // Left blank unless they want to change it
        first_name: '',
        last_name: '',
        date_joined: '',
        pan_number: '',
        email: '', // Maps to User.email
        personal_email: '',
        phone_number: '',
        emergency_contact: '',
        employment_type: 'Full-Time',
        status: 'Active',
        department: '', 
        designation: '',
        reporting_manager: '' 
    });

    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState('');

    // Fetch Dropdowns AND Existing Employee Data
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Fetch Managers
                const mgrRes = await fetch(`${API_BASE_URL}/api/manager/managers-list/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (mgrRes.ok) {
                    const mgrData = await mgrRes.json();
                    setManagers(mgrData.results || mgrData);
                }

                // 2. Fetch Departments
                const deptRes = await fetch(`${API_BASE_URL}/api/departments/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (deptRes.ok) {
                    const deptData = await deptRes.json();
                    setDepartments(deptData.results || deptData);
                }

                // 3. Fetch Existing Employee Data
                const empRes = await fetch(`${API_BASE_URL}/api/manager/employees/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (empRes.ok) {
                    const empData = await empRes.json();
                    
                    // Format date from "Nov 12, 2023" to "YYYY-MM-DD" for the HTML input
                    let formattedDate = '';
                    if (empData.date_joined && empData.date_joined !== '-') {
                        const dateObj = new Date(empData.date_joined);
                        formattedDate = dateObj.toISOString().split('T')[0];
                    }

                    setFormData({
                        employee_id: empData.employee_id || '',
                        username: empData.username || '',
                        password: '', // Do not populate password for security
                        first_name: empData.first_name || '',
                        last_name: empData.last_name || '',
                        date_joined: formattedDate,
                        pan_number: empData.pan_number || '',
                        email: empData.email || '',
                        personal_email: empData.personal_email || '',
                        phone_number: empData.phone_number || '',
                        emergency_contact: empData.emergency_contact || '',
                        employment_type: empData.employment_type || 'Full-Time',
                        status: empData.status || 'Active',
                        department: empData.department || '', // Sets the ID for the dropdown
                        designation: empData.designation || '',
                        reporting_manager: empData.reports_to || '' // Sets the ID for the dropdown
                    });
                } else {
                    setError("Could not fetch employee data.");
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Network error loading data.");
            } finally {
                setFetchingData(false);
            }
        };

        fetchAllData();
    }, [id, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Prepare payload. If password is blank, don't send it to avoid overwriting with empty string
        const payload = { ...formData };
        if (!payload.password) {
            delete payload.password;
        }

        try {
            // Notice this is a PATCH or PUT request to the specific ID
            const res = await fetch(`${API_BASE_URL}/api/manager/employees/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                navigate('/manager/employee-overview'); // Go back to table
            } else {
                const errData = await res.json();
                let errorMsg = 'Failed to update employee.';
                if (errData.detail) errorMsg = errData.detail;
                else if (typeof errData === 'object') {
                    errorMsg = Object.entries(errData).map(([key, val]) => `${key}: ${val}`).join(' | ');
                }
                setError(errorMsg);
            }
        } catch (err) {
            setError('Network error occurred while updating.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="add-employee-page">Loading employee details...</div>;

    return (
        <div className="add-employee-page">
            <div className="page-header-row">
                <button className="back-btn" onClick={() => navigate('/manager/employee-overview')}>
                    &larr; Back to Overview
                </button>
                <h2>Edit Employee</h2>
                <p>Update the details for {formData.first_name} {formData.last_name}.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="add-employee-form">

                {/* 1. Account / Login Details */}
                <div className="form-section">
                    <h3>Account / Login Details</h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Employee ID *</label>
                            <input type="text" name="employee_id" required value={formData.employee_id} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Username (Immutable)</label>
                            <input type="text" name="username" value={formData.username} disabled style={{backgroundColor: '#f0f0f0'}} />
                        </div>
                        <div className="input-group password-group">
                            <label>New Password (Optional)</label>
                            <div className="password-input-wrapper">
                                <input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
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
                            <input type="date" name="date_joined" required value={formData.date_joined} onChange={handleChange} />
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
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
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
                            <label>Emergency Contact</label>
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
                                    <input type="radio" name="status" value="Active" checked={formData.status === 'Active'} onChange={handleChange} /> Active
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'} onChange={handleChange} /> Inactive
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
                            <input type="text" name="designation" required value={formData.designation} onChange={handleChange} />
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
                    <button type="button" className="btn-cancel" onClick={() => navigate('/manager/employee-overview')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEmployee;