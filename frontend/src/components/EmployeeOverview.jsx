import React, { useState, useEffect } from 'react';
import EmployeeOverviewFilterBar from './EmployeeOverviewFilterBar';
import EmployeeDetailsModal from './EmployeeDetailsModal'; // <-- NEW IMPORT
import '../style/EmployeeOverview.css';
import { PlusIcon, MoreVerticalIcon, EyeIcon, EditIcon, TrashIcon } from './Icons';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config";

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
    const navigate = useNavigate();

    // --- NEW: State for the Details Modal ---
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

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
    const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

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

    const handleDeleteEmployee = async (id) => {
        setOpenMenuId(null);
        if (!window.confirm("Are you sure you want to permanently delete this employee?")) return;

        try {
            // Pointing to the new detail endpoint we discussed
            const res = await fetch(`${API_BASE_URL}/api/manager/employees/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                fetchEmployees(); // Refresh the table
            } else {
                alert("Failed to delete employee.");
            }
        } catch (err) {
            console.error("Delete error:", err);
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
            {/* ... 1, 2, and 3 (Header, Title, FilterBar) remain exactly the same ... */}
            <div className="overview-header-banner">
                <div className="banner-content">
                    <h1>Employee Overview</h1>
                    <p>Control employee access, activation status, and account credentials.</p>
                </div>
                <button className="btn-add-employee" onClick={() => navigate('/manager/employee-overview/add-employee')}>
                    <PlusIcon /> Add Employee
                </button>
            </div>

            <div className="table-header-title">
                <h2>Employee <span>(Total {totalCount})</span></h2>
            </div>

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
                                <td>{emp.reports_to_name || '-'}</td>
                                <td className="overview-action-cell">
                                    <button className="action-btn-icon" onClick={(e) => { e.stopPropagation(); toggleMenu(emp.id); }}>
                                        <MoreVerticalIcon />
                                    </button>

                                    {openMenuId === emp.id && (
                                        <div className="table-action-menu" onClick={(e) => e.stopPropagation()}>
                                            <button className="menu-item" onClick={() => handleViewDetails(emp.id)}>
                                                <EyeIcon /> View Details
                                            </button>
                                            <button className="menu-item" onClick={() => handleEditDetails(emp.id)}>
                                                <EditIcon /> Edit Details
                                            </button>
                                            <button className="menu-item text-danger" onClick={() => handleDeleteEmployee(emp.id)}>
                                                <TrashIcon /> Delete Employee
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 5. PAGINATION */}
            <div className="overview-pagination">
                <span className="pagination-text">Showing {employees.length} entries of {totalCount} total</span>
                <div className="pagination-controls">
                    <button className="page-btn text-btn" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                    <button className="page-btn icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
                    <button className="page-btn active">{page}</button>
                    <button className="page-btn icon-btn" onClick={() => setPage(p => p + 1)} disabled={employees.length < 10}>&gt;</button>
                </div>
            </div>

            {/* 6. MODAL COMPONENT */}
            <EmployeeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                employeeId={selectedEmployeeId}
                onEditClick={handleEditDetails}
            />
        </div>
    );
};

export default EmployeeOverview;