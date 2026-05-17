import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EmployeeOverviewFilterBar from './EmployeeOverviewFilterBar';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import '../style/EmployeeOverview.css';
import { TagAddPlusIcon, MoreVerticalIcon, EyeIcon, EditIcon, TrashIcon, ToastSuccessIcon } from './Icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from "../../config";
import "../style/Header.css"

const EmployeeAvatar = ({ avatar, fullName }) => {
    const [error, setError] = useState(false);
    const initials = fullName
        ? fullName.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
        : '?';
    if (!avatar || error) return initials;
    return <img src={avatar} alt={fullName} onError={() => setError(true)} />;
};

const EmployeeOverview = () => {
    // --- State for the reusable Filter Bar ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [teamFilter, setTeamFilter] = useState('All Team');
    const [statusFilter, setStatusFilter] = useState('All Status');

    // --- State for Table & Pagination ---
    const [employees, setEmployees] = useState([]);
    const [projectList, setProjectList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const navigate = useNavigate();
    const location = useLocation();

    // --- Toast notification ---
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (location.state?.toastMessage) {
            setToast(location.state.toastMessage);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    // --- NEW: State for the Details Modal ---
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    // --- State for Delete Confirmation Modal ---
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const token = localStorage.getItem('token');

    // --- 1. FETCH PROJECTS ---
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/projects/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjectList(data);
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            }
        };
        fetchProjects();
    }, [token]);

    // --- 2. FETCH EMPLOYEES ---
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page,
                search: searchTerm,
                status: statusFilter === 'All Status' ? 'All' : statusFilter,
                project: selectedProject === 'All Projects' ? 'All Projects' : selectedProject,
                team: teamFilter === 'All Team' ? 'All' : teamFilter
            });

            const res = await fetch(`${API_BASE_URL}/api/manager/employee-overview/?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.employees) {
                    setEmployees(data.results.employees);
                } else {
                    setEmployees(data.results || data.employees || []);
                }
                setTotalCount(data.count || data.total_count || 0);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm, selectedProject, teamFilter, statusFilter, token]);


    // --- Action Menu UI Handlers ---
    const toggleMenu = (e, id) => {
        if (openMenuId === id) { setOpenMenuId(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const menuHeight = 136; // 3 items × ~44px + 8px padding
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow > menuHeight + 8 ? rect.bottom + 4 : rect.top - menuHeight - 4;
        setMenuPos({ top, right: window.innerWidth - rect.right });
        setOpenMenuId(id);
    };

    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // --- NEW: Action Logic Handlers ---
    const handleViewDetails = (id) => {
        setSelectedEmployeeId(id);
        setIsDetailsModalOpen(true);
        setOpenMenuId(null); // Close the dropdown menu
    };

    const handleEditDetails = (id) => {
        // Navigates to your edit form. Adjust route as necessary!
        console.log("edit clicked for id:", id);
        navigate(`/manager/employee-overview/edit/${id}`);
        setOpenMenuId(null);
        setIsDetailsModalOpen(false); // Ensure modal is closed if triggered from inside the modal
    };

    const handleDeleteEmployee = (emp) => {
        setOpenMenuId(null);
        setDeleteError('');
        setEmployeeToDelete(emp);
    };

    const confirmDeleteEmployee = async () => {
        if (!employeeToDelete) return;
        setDeleteError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/manager/employees/${employeeToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                setEmployeeToDelete(null);
                setToast('Employee deleted successfully!');
                fetchEmployees();
            } else {
                let msg = `Failed to delete employee (status ${res.status}).`;
                try {
                    const body = await res.json();
                    if (body.detail) msg = body.detail;
                    else if (typeof body === 'object') msg = Object.values(body).flat().join(' ');
                } catch { /* response had no JSON body */ }
                console.error('Delete failed:', res.status, msg);
                setDeleteError(msg);
            }
        } catch (err) {
            console.error('Delete network error:', err);
            setDeleteError('Network error. Please try again.');
        }
    };

    // --- Render Helpers ---
    const renderProjectPills = (projects) => {
        if (!projects || projects.length === 0) return <span>-</span>;
        const visibleProjects = projects.slice(0, 2);
        const extraCount = projects.length - 2;

        return (
            <div className="table-project-pills">
                {visibleProjects.map((p, idx) => (
                    <span key={idx} className="table-pill" style={{ backgroundColor: p.color_code || p.color }}>{p.name}</span>
                ))}
                {extraCount > 0 && <span className="table-pill extra-pill">+{extraCount}</span>}
            </div>
        );
    };

    return (
        <div className="employee-overview-page">

            {/* 1. STANDARD REUSABLE HEADER */}
            <div className="page-header">

                {/* TOAST NOTIFICATION */}
                {toast && (
                    <div className="emp-success-toast">
                        <div className="emp-success-toast-content">
                            <span className="emp-success-toast-icon"><ToastSuccessIcon /></span>
                            <span className="emp-success-toast-text">{toast}</span>
                            <button className="emp-success-toast-close" onClick={() => setToast(null)} aria-label="Close">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className="emp-success-toast-progress"></div>
                    </div>
                )}
                {/* Decoration Layer */}
                <div className="hero-decor" aria-hidden="true">
                    <div className="hero-circle hero-circle-1" />
                    <div className="hero-circle hero-circle-2" />
                    <div className="hero-circle hero-circle-3" />
                </div>

                {/* Content Layer (Text left, Button right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div className="header-text">
                        <h2>Employee Overview</h2>
                        <p>Control employee access, activation status, and account credentials.</p>
                    </div>

                    <button className="btn-add-employee" onClick={() => navigate('/manager/employee-overview/add-employee')}>
                        <TagAddPlusIcon /> Add Employee
                    </button>
                </div>
            </div>

            {/* 2. TITLE */}
            <div className="table-header-title">
                <h2>Employee <span>(Total {totalCount})</span></h2>
            </div>

            {/* 3. FILTER BAR */}
            <EmployeeOverviewFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedProject={selectedProject} setSelectedProject={setSelectedProject}
                teamFilter={teamFilter} setTeamFilter={setTeamFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                projectList={projectList}
            />

            {/* 4. TABLE */}
            <div className="overview-table-container">
                <table className="overview-table">
                    <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>PHONE NUMBER</th>
                            <th>DESIGNATION</th>
                            <th>PROJECTS</th>
                            <th>STATUS</th>
                            <th>REPORT TO</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                    <div className="custom-spinner"></div>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td></tr>
                        ) : employees.map((emp) => (
                            <tr key={emp.id}>
                                <td>
                                    <div className="overview-emp-cell">
                                        <div className="overview-avatar employee-individual-avatar">
                                            <EmployeeAvatar avatar={emp.avatar} fullName={emp.full_name} />
                                        </div>
                                        <div className="overview-emp-details">
                                            <span className="overview-emp-name">{emp.full_name}</span>
                                            <span className="overview-emp-email">{emp.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{emp.phone_number || '-'}</td>
                                <td>{emp.designation_name || 'Unassigned'}</td>
                                <td>{renderProjectPills(emp.projects)}</td>
                                <td>
                                    <div className={`overview-status-badge ${emp.status ? emp.status.toLowerCase() : 'inactive'}`}>
                                        <span className="status-dot"></span> {emp.status || 'Inactive'}
                                    </div>
                                </td>
                                <td>{emp.reports_to_name || '-'}</td>
                                <td className="overview-action-cell">
                                    <button className="action-btn-icon" onClick={(e) => { e.stopPropagation(); toggleMenu(e, emp.id); }}>
                                        <MoreVerticalIcon />
                                    </button>

                                    {openMenuId === emp.id && createPortal(
                                        <div
                                            className="table-action-menu"
                                            style={{ position: 'fixed', top: `${menuPos.top}px`, right: `${menuPos.right}px` }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button className="menu-item" onClick={() => handleViewDetails(emp.id)}>
                                                <EyeIcon /> View Details
                                            </button>
                                            <button className="menu-item" onClick={() => handleEditDetails(emp.id)}>
                                                <EditIcon /> Edit Details
                                            </button>
                                            <button className="menu-item text-danger" onClick={() => handleDeleteEmployee(emp)}>
                                                <TrashIcon /> Delete Employee
                                            </button>
                                        </div>,
                                        document.body
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 5. PAGINATION */}
            {(() => {
                const PAGE_SIZE = 10;
                const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
                const showStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
                const showEnd = Math.min(page * PAGE_SIZE, totalCount);

                const genPages = () => {
                    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
                    if (page <= 3) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
                    if (page >= totalPages - 2) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
                    return [1, '…', page - 1, page, page + 1, '…', totalPages];
                };

                return (
                    <div className="overview-pagination">
                        <span className="pagination-text">
                            {totalCount === 0 ? 'No entries found' : `Showing ${showStart} to ${showEnd} of ${totalCount} entries`}
                        </span>
                        <div className="pagination-controls">
                            <button className="page-btn pg-first-last" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                            <button className="page-btn pg-prev-next" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>

                            {genPages().map((p, i) =>
                                p === '…' ? (
                                    <span key={`dots-${i}`} className="pg-dots">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`page-btn pg-number${p === page ? ' active' : ''}${p === page + 1 ? ' next-to-active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >{p}</button>
                                )
                            )}

                            <button className="page-btn pg-prev-next" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <button className="page-btn pg-first-last pg-last" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
                        </div>
                    </div>
                );
            })()}

            {/* 6. MODAL COMPONENT */}
            <EmployeeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                employeeId={selectedEmployeeId}
                onEditClick={handleEditDetails}
            />

            {/* 7. DELETE CONFIRMATION MODAL */}
            {employeeToDelete && (
                <div className="modal-overlay" onClick={() => setEmployeeToDelete(null)}>
                    <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()}>
                        <button className="close-icon" onClick={() => setEmployeeToDelete(null)} aria-label="Close">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.5 5.5L5.5 16.5M5.5 5.5L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <div className="delete-header">
                            <h3>Delete Employee?</h3>
                        </div>
                        <p>
                            Are you sure you want to delete employee <strong>"{employeeToDelete.full_name}"</strong>? This will permanently remove their account and all associated records. This action cannot be undone afterwards.
                        </p>
                        {deleteError && <p style={{ color: '#FF493F', fontSize: '13px', margin: 0 }}>{deleteError}</p>}
                        <div className="delete-actions">
                            <button className="btn-cancel" onClick={() => setEmployeeToDelete(null)}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={confirmDeleteEmployee}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeOverview;