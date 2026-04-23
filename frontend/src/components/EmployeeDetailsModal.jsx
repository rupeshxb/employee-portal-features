import React, { useState, useEffect } from 'react';
import '../style/EmployeeDetailsModal.css';
import { API_BASE_URL } from "../../config";
import { EditIcon } from './Icons';

const EmployeeDetailsModal = ({ isOpen, onClose, employeeId, onEditClick }) => {
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && employeeId) {
            fetchEmployeeDetails();
        }
    }, [isOpen, employeeId]);

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        try {
            // This expects the endpoint we created in step 1 of the Django backend setup
            const response = await fetch(`${API_BASE_URL}/api/manager/employees/${employeeId}/`, {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployeeData(data);
            } else {
                console.error("Failed to fetch employee details");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Optional safe-getters to prevent React from breaking if fields are undefined
    const emp = employeeData || {};

    return (
        <div className="emp-modal-overlay" onClick={onClose}>
            <div className="emp-modal-container" onClick={(e) => e.stopPropagation()}>
                
                {loading ? (
                    <div className="emp-modal-loading">
                        <div className="spinner"></div>
                        <p>Loading employee data...</p>
                    </div>
                ) : (
                    <>
                        {/* HERO HEADER */}
                        <div className="emp-modal-header">
                            <button className="emp-modal-close" onClick={onClose}>✕</button>
                            <div className="emp-modal-profile">
                                <div className="emp-avatar-large">
                                    {emp.avatar ? (
                                        <img src={emp.avatar} alt={`${emp.first_name} avatar`} />
                                    ) : (
                                        <span>{(emp.first_name || 'U')[0]}</span>
                                    )}
                                </div>
                                <h2>{emp.first_name} {emp.last_name}</h2>
                                <p>{emp.designation_name || 'Unassigned'} • {emp.email || emp.user?.email}</p>
                            </div>
                        </div>

                        {/* SCROLLABLE BODY */}
                        <div className="emp-modal-body">
                            
                            {/* Personal Details */}
                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <div className="icon-wrapper">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <h3>Personal Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)}><EditIcon /></button>
                                </div>
                                <div className="card-grid">
                                    <div className="grid-item"><span>First Name</span><p>{emp.first_name || '-'}</p></div>
                                    <div className="grid-item"><span>Last Name</span><p>{emp.last_name || '-'}</p></div>
                                    <div className="grid-item"><span>Employee ID</span><p>{emp.employee_id || '-'}</p></div>
                                    <div className="grid-item"><span>Username</span><p>{emp.user?.username || '-'}</p></div>
                                    <div className="grid-item"><span>Joined Date</span><p>{emp.date_joined || '-'}</p></div>
                                    <div className="grid-item"><span>PAN Number</span><p>{emp.pan_number || '-'}</p></div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <div className="icon-wrapper">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        </div>
                                        <h3>Contact Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)}><EditIcon /></button>
                                </div>
                                <div className="card-grid">
                                    <div className="grid-item"><span>Official Email</span><p>{emp.email || '-'}</p></div>
                                    <div className="grid-item"><span>Personal Email</span><p>{emp.personal_email || '-'}</p></div>
                                    <div className="grid-item"><span>Phone Number</span><p>{emp.phone_number || '-'}</p></div>
                                    <div className="grid-item"><span>Emergency Contact</span><p>{emp.emergency_contact || '-'}</p></div>
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <div className="icon-wrapper">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                        </div>
                                        <h3>Employment Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)}><EditIcon /></button>
                                </div>
                                <div className="card-grid">
                                    <div className="grid-item"><span>Employment Type</span><p>{emp.employment_type || '-'}</p></div>
                                    <div className="grid-item">
                                        <span>Status</span>
                                        <div className={`status-pill ${emp.status ? emp.status.toLowerCase() : 'inactive'}`}>
                                            ● {emp.status || 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="grid-item"><span>Department</span><p>{emp.department?.name || emp.department || '-'}</p></div>
                                    <div className="grid-item"><span>Designation</span><p>{emp.designation_name || '-'}</p></div>
                                    <div className="grid-item"><span>Reporting Manager</span><p>{emp.reports_to_name || '-'}</p></div>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;