import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../utils/teamUpdatesUtils';
import ManagerFilterBar from './ManagerFilterBar';
import EmployeeCard from './EmployeeCard';

import '../style/ManagerDailyTaskUpdates.css';
import '../style/Header.css';

const ManagerDailyTaskUpdates = () => {
    // --- STATE ---
    const [employees, setEmployees] = useState([]);
    const [totalDepartmentCount, setTotalDepartmentCount] = useState(0); // NEW: Tracks absolute total
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projectList, setProjectList] = useState([]);

    // Department Nav State
    const [departments] = useState(['All', 'Developers', 'Wordpress', 'UI/UX', 'QA', 'Marketing', 'Sales', 'Analyst']);
    const [activeDepartment, setActiveDepartment] = useState(() => sessionStorage.getItem('activeTaskDepartment') || 'All');

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [dateFilter, setDateFilter] = useState('Date');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeFilter, setTimeFilter] = useState('Time');

    // --- 1. FETCH PROJECTS (Runs Once) ---
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/projects/`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('Failed to fetch projects');
                const data = await response.json();

                const fallbackColors = ['#c026d3', '#22c55e', '#ec4899', '#ef4444', '#0ea5e9', '#f97316'];
                const formattedProjects = data.map((proj, index) => ({
                    id: proj.id,
                    name: proj.name,
                    color: proj.color_code || fallbackColors[index % fallbackColors.length]
                }));
                setProjectList(formattedProjects);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        fetchProjects();
    }, []);

    // --- 2. FETCH EMPLOYEES & TASKS (Runs on Filter Change) ---
    useEffect(() => {
        const fetchFilteredTasks = async () => {
            setLoading(true);
            try {
                // Build the query string dynamically based on active filters
                const params = new URLSearchParams();

                if (activeDepartment !== 'All') params.append('department', activeDepartment);
                if (searchTerm) params.append('search', searchTerm);
                if (selectedProject !== 'All Projects') params.append('project', selectedProject);
                if (timeFilter !== 'Time') params.append('time', timeFilter);

                // Handle Dates
                if (dateFilter === 'Today') {
                    params.append('date', new Date().toISOString().split('T')[0]);
                } else if (dateFilter === 'Yesterday') {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    params.append('date', yest.toISOString().split('T')[0]);
                } else if (dateFilter === 'Custom Date' && customDate) {
                    params.append('date', customDate);
                }

                // Call your Django backend
                const response = await fetch(`${API_BASE_URL}/api/manager/team-updates/?${params.toString()}`, {
                    headers: getAuthHeaders()
                });

                if (!response.ok) throw new Error('Failed to fetch team updates');

                const data = await response.json();

                // EXPECTED BACKEND PAYLOAD:
                // {
                //    total_in_department: 25, 
                //    employees: [ ... array of employee objects with tasks ... ]
                // }
                setEmployees(data.employees || data); // Fallback to 'data' if backend isn't wrapped
                setTotalDepartmentCount(data.total_in_department ?? data.length ?? 0);

            } catch (error) {
                console.error("Error fetching tasks:", error);
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };

        // Add a small debounce for the search term so we don't spam the API on every keystroke
        const delayDebounceFn = setTimeout(() => {
            fetchFilteredTasks();
        }, 300);

        return () => clearTimeout(delayDebounceFn);

    }, [activeDepartment, searchTerm, selectedProject, dateFilter, customDate, timeFilter]);

    // --- 3. APPLY CLIENT-SIDE FILTERS (NEW LOGIC) ---
    useEffect(() => {
        let result = [...employees];

        // Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(emp => emp.full_name?.toLowerCase().includes(lowerSearch));
        }

        // Project Filter (Checks if employee has ANY task in the selected project)
        if (selectedProject && selectedProject !== 'All Projects') {
            result = result.filter(emp => {
                const allTasks = [
                    ...(emp.tasks?.today || []),
                    ...(emp.tasks?.yesterday || []),
                    ...(emp.tasks?.previous || []),
                    ...(emp.tasks?.blockers || [])
                ];
                return allTasks.some(task => task.project_details?.name === selectedProject);
            });
        }

        // Time Filter (E.g. Before 10 AM)
        if (timeFilter !== 'Time') {
            result = result.filter(emp => {
                if (!emp.submittedTime) return false;

                if (timeFilter === 'Before 10 AM') {
                    const isAM = emp.submittedTime.includes('AM');
                    const hour = parseInt(emp.submittedTime.split(':')[0], 10);
                    // 12 AM (0) up to 9 AM is valid. 10 AM or PM is invalid.
                    return isAM && (hour < 10 || hour === 12);
                }
                // Add more time options here if needed later
                return true;
            });
        }

        setFilteredEmployees(result);
    }, [employees, searchTerm, selectedProject, timeFilter]);

    // Handle Tab Click
    const handleDepartmentChange = (dept) => {
        setActiveDepartment(dept);
        sessionStorage.setItem('activeTaskDepartment', dept);
    };

    const displayTitle = activeDepartment === 'All' ? 'All Employees' : activeDepartment;

    return (
        <div className="daily-tasks-container">
            <div className="page-header">
                <h2>Daily Task Updates</h2>
                <p>View daily work updates submitted by team members across projects and teams.</p>
                <div className="header-decor bubble-small"></div>
                <div className="header-decor bubble-large"></div>
            </div>

            <div className="department-nav">
                {departments.map((dept) => (
                    <button
                        key={dept}
                        className={`dept-tab ${activeDepartment === dept ? 'active' : ''}`}
                        onClick={() => handleDepartmentChange(dept)}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            <div className="department-header">
                <h3>{displayTitle}</h3>
                <span className="employee-count">
                    (Showing {filteredEmployees.length ?? 0} of {totalDepartmentCount ?? 0} total)
                </span>
            </div>

            <ManagerFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedProject={selectedProject} setSelectedProject={setSelectedProject}
                dateFilter={dateFilter} setDateFilter={setDateFilter}
                customDate={customDate} setCustomDate={setCustomDate}
                timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                projectList={projectList}
            />

            <div className="manager-daily-update-employee-card employee-cards-grid">
                {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                        <EmployeeCard key={emp.id} emp={emp} variant="manager" />
                    ))
                ) : (
                    <p style={{ color: '#64748b', marginTop: '20px' }}>
                        {loading ? 'Loading tasks...' : 'No employees found for this filter.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManagerDailyTaskUpdates;