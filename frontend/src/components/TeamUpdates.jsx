import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../utils/teamUpdatesUtils';

// Import CSS
import '../style/TeamUpdates.css';
import '../style/Header.css'; // Reusable header styles

// Import Components
import TeamUpdatesFilterBar from './TeamUpdatesFilterBar';
import EmployeeCard from './EmployeeCard';

const TeamUpdates = () => {
    // --- STATE ---
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [dateFilter, setDateFilter] = useState('Today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

    // Dropdown Data States
    const [projectList, setProjectList] = useState([]);
    const [roleList, setRoleList] = useState([
        'All Roles', 'Frontend Developer', 'Backend Developer',
        'Full Stack Developer', 'UI/UX Designer', 'QA Engineer',
        'DevOps Engineer', 'Project Manager', 'HR', 'Intern'
    ]);

    // --- 1. FETCH FILTER OPTIONS (Projects & Roles) ---
    useEffect(() => {
        const headers = getAuthHeaders();

        // A. Fetch Projects
        fetch(`${API_BASE_URL}/api/projects/`, { headers })
            .then(res => res.json())
            .then(data => setProjectList(data))
            .catch(err => console.error("Error fetching projects:", err));

        // B. Fetch Employees to get Designations dynamically
        fetch(`${API_BASE_URL}/api/employees/`, { headers })
            .then(res => res.json())
            .then(data => {
                const uniqueDesignations = [...new Set(data.map(emp => emp.designation).filter(Boolean))];
                setRoleList(['All Roles', ...uniqueDesignations]);
            })
            .catch(err => console.error("Error fetching roles:", err));

    }, []);

    // --- 2. FETCH TEAM UPDATES (Main Logic) ---
    useEffect(() => {
        fetchUpdates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedProject, selectedRole, dateFilter, customDate]);

    const fetchUpdates = () => {
        setLoading(true);
        let queryDate = new Date().toISOString().split('T')[0];

        if (dateFilter === 'Yesterday') {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            queryDate = d.toISOString().split('T')[0];
        } else if (dateFilter === 'Custom') {
            queryDate = customDate;
        }

        const params = new URLSearchParams({
            date: queryDate,
            search: searchTerm,
            project: selectedProject,
            role: selectedRole
        });

        fetch(`${API_BASE_URL}/api/team-updates/?${params.toString()}`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (res.status === 401) {
                    console.error("Unauthorized: Please login again");
                    return [];
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setEmployees(data);
                } else {
                    setEmployees([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching updates:", err);
                setLoading(false);
            });
    };

    return (
        <div className="team-updates-container">
            {/* HEADER (Using Reusable Header.css classes) */}
            <div className="page-header">
                <h2>Team Updates</h2>
                <p>See daily work updates from teammates working on the same project.</p>
                <div className="header-decor bubble-small"></div>
                <div className="header-decor bubble-large"></div>
            </div>

            {/* FILTER BAR Component */}
            <TeamUpdatesFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedProject={selectedProject} setSelectedProject={setSelectedProject}
                selectedRole={selectedRole} setSelectedRole={setSelectedRole}
                dateFilter={dateFilter} setDateFilter={setDateFilter}
                customDate={customDate} setCustomDate={setCustomDate}
                projectList={projectList} roleList={roleList}
            />

            {/* --- GRID CONTENT --- */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading updates...</div>
            ) : (
                <div className="updates-grid">
                    {employees.length > 0 ? (
                        employees.map(emp => (
                            <EmployeeCard key={emp.id} emp={emp} />
                        ))
                    ) : (
                        <div className="no-results">
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                            <h3>No results found!</h3>
                            <p>Try again with a different keyword or filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamUpdates;