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


    const [dateFilter, setDateFilter] = useState('Date');
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

    // --- 3. NEW EVENT LISTENER LOGIC ---
    useEffect(() => {
        // When AddTask.jsx dispatches 'taskAdded', this function fires
        const handleRefresh = () => {
            fetchUpdates();
        };

        window.addEventListener('taskAdded', handleRefresh);

        // Cleanup the listener when the component unmounts
        return () => {
            window.removeEventListener('taskAdded', handleRefresh);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedProject, selectedRole, dateFilter, customDate]);


    const fetchUpdates = () => {
        setLoading(true);

        let queryDate = ''; // Blank means fetch ALL
        if (dateFilter === 'Today') {
            queryDate = new Date().toISOString().split('T')[0];
        } else if (dateFilter === 'Yesterday') {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            queryDate = d.toISOString().split('T')[0];
        } else if (dateFilter === 'Custom') {
            queryDate = customDate;
        }

        // Cleanly construct URL parameters
        const params = new URLSearchParams();
        
        // ONLY add the date parameter if we actually have a date to filter by
        if (queryDate) {
            params.append('date', queryDate);
        }
        
        // Always add the other filters (assuming your backend handles "All Projects" properly)
        params.append('search', searchTerm);
        params.append('project', selectedProject);
        params.append('role', selectedRole);

        fetch(`${API_BASE_URL}/api/employee/team-updates/?${params.toString()}`, {
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
                // Quick debug step: Check your console to ensure the backend is sending 'previous' tasks
                console.log("Fetched Data:", data); 

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
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
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
                <div className="employee-cards-grid">
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