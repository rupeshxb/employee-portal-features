import React, { useState, useEffect } from 'react';
import EmployeeOverviewFilterBar from './EmployeeOverviewFilterBar';
import '../style/EmployeeOverview.css';

// Basic Icons for the table actions
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const MoreVerticalIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>;
const EyeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;

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

    // Get Auth Token (Adjust this depending on if you use 'Token' or 'Bearer')
    const token = localStorage.getItem('token');

    // --- 1. FETCH PROJECTS (For Filter Bar Dropdown) ---
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects/', {
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

    // --- 2. FETCH EMPLOYEES (Runs on mount & whenever filters/page change) ---
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                // Build the dynamic URL query string
                const queryParams = new URLSearchParams({
                    page: page,
                    search: searchTerm,
                    status: statusFilter === 'All Status' ? 'All' : statusFilter,
                    project: selectedProject === 'All Projects' ? 'All Projects' : selectedProject,
                    // Note: 'teamFilter' isn't explicitly handled by Phase 2 backend yet, 
                    // but we can add it to the URL in case you add backend support later.
                    team: teamFilter === 'All Team' ? 'All' : teamFilter
                });

                const res = await fetch(`/api/manager/employee-overview/?${queryParams.toString()}`, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("EMPLOYEE API RESPONSE:", data);

                    // 1. Check if Django nested it inside results.employees
                    if (data.results && data.results.employees) {
                        setEmployees(data.results.employees);
                    } else {
                        // Fallback just in case
                        setEmployees(data.results || data.employees || []);
                    }

                    // 2. Set total count (Django's paginator automatically provides 'count')
                    setTotalCount(data.count || data.total_count || 0);
                } else {
                    console.error("Failed to fetch employee overview.");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        // Adding a slight debounce to search to prevent API spam while typing
        const timeoutId = setTimeout(() => {
            fetchEmployees();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [page, searchTerm, selectedProject, teamFilter, statusFilter, token]);


    // --- Action Menu Handlers ---
    const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
            {/* 1. HEADER BANNER */}
            <div className="overview-header-banner">
                <div className="banner-content">
                    <h1>Employee Overview</h1>
                    <p>Control employee access, activation status, and account credentials.</p>
                </div>
                <button className="btn-add-employee">
                    <PlusIcon /> Add Employee
                </button>
            </div>

            {/* 2. TITLE */}
            <div className="table-header-title">
                <h2>Employee <span>(Total {totalCount})</span></h2>
            </div>

            {/* 3. REUSABLE FILTER BAR */}
            <EmployeeOverviewFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedProject={selectedProject} setSelectedProject={setSelectedProject}
                teamFilter={teamFilter} setTeamFilter={setTeamFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                projectList={projectList}
            />

            {/* 4. NEW TABLE */}
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
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td></tr>
                        ) : employees.map((emp) => (
                            <tr key={emp.id}>
                                <td>
                                    <div className="overview-emp-cell">
                                        <div className="overview-avatar">
                                            {emp.avatar ? <img src={emp.avatar} alt="avatar" /> : emp.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overview-emp-details">
                                            <span className="overview-emp-name">{emp.full_name}</span>
                                            <span className="overview-emp-email">{emp.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{emp.phone_number || '-'}</td>
                                <td>{emp.designation || 'Unassigned'}</td>
                                <td>{renderProjectPills(emp.projects)}</td>
                                <td>
                                    <div className={`overview-status-badge ${emp.status ? emp.status.toLowerCase() : 'inactive'}`}>
                                        <span className="status-dot"></span> {emp.status || 'Inactive'}
                                    </div>
                                </td>
                                <td>{emp.reports_to_name}</td>
                                <td className="overview-action-cell">
                                    <button className="action-btn-icon" onClick={(e) => { e.stopPropagation(); toggleMenu(emp.id); }}>
                                        <MoreVerticalIcon />
                                    </button>

                                    {openMenuId === emp.id && (
                                        <div className="table-action-menu" onClick={(e) => e.stopPropagation()}>
                                            <button className="menu-item"><EyeIcon /> View Details</button>
                                            <button className="menu-item"><EditIcon /> Edit Details</button>
                                            <button className="menu-item text-danger"><TrashIcon /> Delete Employee</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 5. PAGINATION (Static visually, but tied to functional 'page' state) */}
            <div className="overview-pagination">
                <span className="pagination-text">Showing {employees.length} entries of {totalCount} total</span>
                <div className="pagination-controls">
                    <button className="page-btn text-btn" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                    <button className="page-btn icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>

                    <button className="page-btn active">{page}</button>
                    {/* Real math for max pages would rely on Math.ceil(totalCount / 10) based on Phase 2 pagination */}

                    <button className="page-btn icon-btn" onClick={() => setPage(p => p + 1)} disabled={employees.length < 10}>&gt;</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeOverview;