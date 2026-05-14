import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../style/EmployeeDetailsModal.css';
import { API_BASE_URL } from "../../config";
import { ModalCloseIcon } from './Icons';

const HEADER_TILES = [
    { left: -30, top: 179, opacity: 0.02 },
    { left: 34, top: 61, opacity: 0.02 },
    { left: 124, top: 152, opacity: 0.02 },
    { left: 215, top: 241, opacity: 0.02 },
    { left: -55, top: -29, opacity: 0.01 },
    { left: 197, top: 43, opacity: 0.02 },
    { left: 287, top: 134, opacity: 0.02 },
    { left: 376, top: 224, opacity: 0.02 },
    { left: 108, top: -47, opacity: 0.02 },
    { left: 18, top: -137, opacity: 0.02 },
    { left: 339, top: 0, opacity: 0.02 },
    { left: 429, top: 91, opacity: 0.01 },
    { left: 518, top: 181, opacity: 0.02 },
    { left: 398, top: -122, opacity: 0.02 },
    { left: 488, top: -31, opacity: 0.01 },
    { left: 577, top: 59, opacity: 0.02 },
    { left: 250, top: -90, opacity: 0.01 },
    { left: 160, top: -180, opacity: 0.02 },
    { left: -120, top: 87.96, opacity: 0.02 },
];

const ProfileCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 9.75a2.025 2.025 0 1 0 0-4.05 2.025 2.025 0 0 0 0 4.05Z" stroke="#2563EA" strokeWidth="1.5"/>
        <path d="M4.95 14.7c0-1.81 1.81-3.27 4.05-3.27s4.05 1.46 4.05 3.27" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 16.5A7.5 7.5 0 1 0 9 1.5a7.5 7.5 0 0 0 0 15Z" stroke="#2563EA" strokeWidth="1.5"/>
    </svg>
);

const CallIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M16.485 13.747c0 .27-.06.547-.187.817-.128.27-.293.525-.51.765-.367.405-.772.697-1.23.885-.45.187-.937.285-1.462.285-.766 0-1.583-.18-2.445-.547a13.18 13.18 0 0 1-2.55-1.485 21.6 21.6 0 0 1-2.43-2.1A21.4 21.4 0 0 1 3.59 9.945a13.36 13.36 0 0 1-1.47-2.535c-.36-.862-.54-1.687-.54-2.475 0-.517.09-1.012.27-1.47.18-.465.467-.892.87-1.275.487-.48 1.02-.717 1.582-.717.214 0 .427.045.622.135.203.09.382.225.523.42l1.815 2.557c.142.196.244.376.315.548.07.165.108.33.108.48 0 .188-.054.375-.164.555-.103.18-.255.367-.45.555l-.6.622a.421.421 0 0 0-.128.315c0 .06.008.113.023.173.022.06.045.105.06.15.143.262.39.604.743 1.02.36.412.742.832 1.155 1.245.428.413.84.795 1.26 1.155.413.353.758.593 1.028.735.045.015.097.038.157.06a.6.6 0 0 0 .172.023.435.435 0 0 0 .323-.135l.6-.593c.202-.202.397-.36.585-.457.187-.113.37-.165.555-.165.142 0 .293.03.457.097.165.068.337.165.525.293l2.595 1.84c.195.135.33.293.413.48.075.187.12.375.12.585Z" stroke="#2563EA" strokeWidth="1.5" strokeMiterlimit="10"/>
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 16.5h6c3.015 0 3.555-1.207 3.712-2.677l.563-6c.202-1.83-.323-3.323-3.525-3.323H5.25C2.048 4.5 1.523 5.993 1.725 7.823l.562 6C2.445 15.293 2.985 16.5 6 16.5Z" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 4.5v-.6C6 2.572 6 1.5 8.4 1.5h1.2c2.4 0 2.4 1.072 2.4 2.4v.6" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5 9.75v.75c0 .008 0 .008 0 .015 0 .817 0 .983-.45 1.245-.187.105-.45.18-.825.21-.052.008-.105.008-.158.008-.06 0-.12 0-.172-.008-.39-.03-.66-.105-.847-.21-.45-.27-.45-.428-.45-1.245v-.765c0-.413.337-.75.75-.75h1.5c.412 0 .75.337.75.75Z" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.238 8.25A11.494 11.494 0 0 1 10.5 10.515" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1.96 8.498A11.488 11.488 0 0 0 7.5 10.5" stroke="#2563EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const EditPencilIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M12.75 2.25023C12.947 2.05324 13.1808 1.89699 13.4382 1.79038C13.6956 1.68378 13.9714 1.62891 14.25 1.62891C14.5286 1.62891 14.8044 1.68378 15.0618 1.79038C15.3192 1.89699 15.553 2.05324 15.75 2.25023C15.947 2.44721 16.1032 2.68106 16.2098 2.93843C16.3165 3.1958 16.3713 3.47165 16.3713 3.75023C16.3713 4.0288 16.3165 4.30465 16.2098 4.56202C16.1032 4.81939 15.947 5.05324 15.75 5.25023L5.625 15.3752L1.5 16.5002L2.625 12.3752L12.75 2.25023Z" stroke="#17181A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const getInitials = (first, last) => ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || 'U';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

const EmployeeDetailsModal = ({ isOpen, onClose, employeeId, onEditClick }) => {
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        if (isOpen && employeeId) {
            setAvatarError(false);
            fetchEmployeeDetails();
        }
    }, [isOpen, employeeId]);

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/manager/employees/${employeeId}/`, {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployeeData(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const emp = employeeData || {};
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    const designation = emp.designation_name || 'Unassigned';
    const email = emp.email || emp.user?.email || '';
    const statusKey = (emp.status || 'inactive').toLowerCase().replace(/\s+/g, '_');

    return createPortal(
        <div className="emp-modal-overlay" onClick={onClose}>
            <div className="emp-modal-container" onClick={(e) => e.stopPropagation()}>

                {loading ? (
                    <div className="emp-modal-loading">
                        <div className="custom-spinner"></div>
                    </div>
                ) : (
                    <>
                        <div className="emp-modal-header">
                            <div className="header-tiles" aria-hidden="true">
                                {HEADER_TILES.map((t, i) => (
                                    <div
                                        key={i}
                                        className="header-tile"
                                        style={{ left: `${t.left}px`, top: `${t.top}px`, background: `rgba(255,255,255,${t.opacity})` }}
                                    />
                                ))}
                            </div>

                            <button className="emp-modal-close" onClick={onClose} aria-label="Close">
                                <ModalCloseIcon size={32} color="#FFFFFF" strokeWidth={1.5} />
                            </button>

                            <div className="emp-modal-profile">
                                <div className="emp-avatar-large">
                                    {emp.avatar && !avatarError ? (
                                        <img
                                            src={emp.avatar}
                                            alt={fullName}
                                            onError={() => setAvatarError(true)}
                                        />
                                    ) : (
                                        <span>{getInitials(emp.first_name, emp.last_name)}</span>
                                    )}
                                </div>
                                <div className="emp-modal-name-block">
                                    <h2>{fullName || 'Employee'}</h2>
                                    <div className="emp-modal-meta">
                                        <span className="desig">{designation}</span>
                                        <span className="dot"></span>
                                        {email && <a className="email" href={`mailto:${email}`}>{email}</a>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="emp-modal-body">

                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <ProfileCircleIcon />
                                        <h3>Personal Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)} aria-label="Edit">
                                        <EditPencilIcon />
                                    </button>
                                </div>
                                <div className="card-grid three-col">
                                    <div className="grid-item"><span>First Name</span><p>{emp.first_name || '-'}</p></div>
                                    <div className="grid-item"><span>Last Name</span><p>{emp.last_name || '-'}</p></div>
                                    <div className="grid-item"><span>Employee ID</span><p>{emp.employee_id || '-'}</p></div>
                                    <div className="grid-item"><span>Username</span><p>{emp.user?.username || emp.username || '-'}</p></div>
                                    <div className="grid-item"><span>Joined Date</span><p>{formatDate(emp.date_joined)}</p></div>
                                    <div className="grid-item"><span>PAN Number</span><p>{emp.pan_number || '-'}</p></div>
                                </div>
                            </div>

                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <CallIcon />
                                        <h3>Contact Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)} aria-label="Edit">
                                        <EditPencilIcon />
                                    </button>
                                </div>
                                <div className="card-grid two-col">
                                    <div className="grid-item"><span>Official Email</span><p>{emp.email || '-'}</p></div>
                                    <div className="grid-item"><span>Personal Email</span><p>{emp.personal_email || '-'}</p></div>
                                    <div className="grid-item"><span>Phone Number</span><p>{emp.phone_number || '-'}</p></div>
                                    <div className="grid-item"><span>Emergency Contact Number</span><p>{emp.emergency_contact || '-'}</p></div>
                                </div>
                            </div>

                            <div className="emp-details-card">
                                <div className="card-header">
                                    <div className="card-title-group">
                                        <BriefcaseIcon />
                                        <h3>Employment Details</h3>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => onEditClick(emp.id)} aria-label="Edit">
                                        <EditPencilIcon />
                                    </button>
                                </div>
                                <div className="card-grid three-col">
                                    <div className="grid-item"><span>Employment Type</span><p>{emp.employment_type || '-'}</p></div>
                                    <div className="grid-item">
                                        <span>Status</span>
                                        <div className={`emp-status-pill ${statusKey}`}>
                                            <span className="dot-outer"><span className="dot-inner"></span></span>
                                            {emp.status || 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="grid-item"><span>Department</span><p>{emp.department?.name || emp.department_name || emp.department || '-'}</p></div>
                                    <div className="grid-item"><span>Designation</span><p>{emp.designation_name || '-'}</p></div>
                                    <div className="grid-item"><span>Reporting Manager</span><p>{emp.reports_to_name || '-'}</p></div>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default EmployeeDetailsModal;
