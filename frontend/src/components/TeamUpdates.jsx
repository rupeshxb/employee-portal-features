import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../utils/teamUpdatesUtils';

// Import CSS
import '../style/TeamUpdates.css';
import '../style/Header.css'; // Reusable header styles

// Import Components
import TeamUpdatesFilterBar from './TeamUpdatesFilterBar';
import EmployeeCard from './EmployeeCard';
import { NoResultsIllustration } from './Icons';

const TeamUpdates = () => {
    // --- STATE ---
    const [employees, setEmployees] = useState([]);
    const [dateMeta, setDateMeta] = useState({ target_date: '', prev_date: '' });
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [selectedRole, setSelectedRole] = useState('Developers');


    const [dateFilter, setDateFilter] = useState('Today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

    // Dropdown Data States
    const [projectList, setProjectList] = useState([]);
    const [roleList, setRoleList] = useState(['All Roles']);

    // --- 1. FETCH FILTER OPTIONS (Projects & Roles) ---
    useEffect(() => {
        const headers = getAuthHeaders();

        // A. Fetch Projects
        fetch(`${API_BASE_URL}/api/projects/`, { headers })
            .then(res => res.json())
            .then(data => setProjectList(data))
            .catch(err => console.error("Error fetching projects:", err));

        // B. Fetch Designations directly
        fetch(`${API_BASE_URL}/api/designations/`, { headers })
            .then(res => res.json())
            .then(data => {
                const results = data.results || data;
                const names = results.map(d => d.name).filter(Boolean);
                setRoleList(['All Roles', ...names]);
            })
            .catch(err => console.error("Error fetching designations:", err));

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

        const toLocalDateStr = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        let queryDate = '';
        let filterType = '';
        if (dateFilter === 'Today') {
            queryDate = toLocalDateStr(new Date());
            filterType = 'today';
        } else if (dateFilter === 'Yesterday') {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            queryDate = toLocalDateStr(d);
            filterType = 'yesterday';
        } else if (dateFilter === 'Custom') {
            queryDate = customDate;
            filterType = 'custom';
        }

        const params = new URLSearchParams();
        if (queryDate) params.append('date', queryDate);
        if (filterType) params.append('filter_type', filterType);
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
                if (data && data.employees) {
                    setEmployees(data.employees);
                    setDateMeta(data.meta || { target_date: '', prev_date: '' });
                } else {
                    setEmployees([]);
                    setDateMeta({ target_date: '', prev_date: '' });
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
                            <EmployeeCard
                                key={emp.id}
                                emp={emp}
                                filterType={dateMeta.filter_type || ''}
                                targetDate={dateMeta.target_date}
                                prevDate={dateMeta.prev_date}
                            />
                        ))
                    ) : (
                        <div className="no-results">
                            <NoResultsIllustration />
                            <div className="no-results-text">
                                <h3>No results found!</h3>
                                <p>Try again with a different keywords.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamUpdates;