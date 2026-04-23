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
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
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
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <span>Loading team updates...</span>
                    </div>
                ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                        <EmployeeCard key={emp.id} emp={emp} variant="manager" />
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-illustration">
                            <svg width="120" height="164" viewBox="0 0 120 164" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="36.1214" y="0.526776" width="83.4759" height="116.765" rx="3.5" transform="rotate(3.12725 36.1214 0.526776)" fill="url(#paint0_linear_2085_6790)" stroke="#C0C5C6"/>
                                <path d="M97.124 3.35889L107.936 15.4211L118.749 27.4833L95.8743 26.2335L97.124 3.35889Z" fill="#C0C5C6"/>
                                <path d="M118.75 27.4832L107.938 15.421L97.1251 3.35879L120 4.60854L118.75 27.4832Z" fill="#F5F6FA"/>
                                <path d="M51.9351 52.5116C51.4101 52.4823 50.8882 52.6094 50.4354 52.8769C49.9827 53.1443 49.6194 53.54 49.3916 54.014C49.1639 54.4879 49.0818 55.0188 49.1559 55.5394C49.2299 56.06 49.4567 56.5469 49.8076 56.9385C50.1584 57.3302 50.6176 57.609 51.127 57.7396C51.6363 57.8702 52.173 57.8467 52.669 57.6722C53.165 57.4977 53.5982 57.18 53.9136 56.7593C54.229 56.3385 54.4125 55.8337 54.4409 55.3086C54.4789 54.6056 54.2364 53.9162 53.7666 53.3918C53.2968 52.8674 52.6381 52.5508 51.9351 52.5116Z" fill="#6A6B6E"/>
                                <path d="M98.0461 55.0309C97.5209 55.0007 96.9986 55.127 96.5453 55.3939C96.092 55.6607 95.728 56.0561 95.4996 56.5299C95.2711 57.0037 95.1884 57.5347 95.2619 58.0556C95.3354 58.5764 95.5618 59.0638 95.9125 59.4559C96.2631 59.848 96.7223 60.1272 97.2317 60.2582C97.7412 60.3892 98.2781 60.366 98.7744 60.1917C99.2707 60.0173 99.7041 59.6996 100.02 59.2788C100.335 58.858 100.519 58.3529 100.547 57.8277C100.585 57.1254 100.343 56.4368 99.8745 55.9125C99.4057 55.3883 98.7482 55.0713 98.0461 55.0309Z" fill="#6A6B6E"/>
                                <path d="M86.504 76.7096C82.7895 75.3545 78.6738 74.2007 74.4465 73.3293C70.2192 72.4579 65.9828 71.8901 62.0351 71.6657C59.0346 71.6401 59.5427 70.037 66.0119 70.9207C68.8506 71.2234 71.7611 71.654 74.6787 72.2028C77.5756 72.8525 80.419 73.6081 83.146 74.4527C89.4373 76.1993 89.2506 77.8686 86.504 76.7096Z" fill="#6A6B6E"/>
                                <foreignObject x="-0.165039" y="81.0942" width="63.6377" height="63.6377"><div xmlns="http://www.w3.org/1999/xhtml" style={{backdropFilter:'blur(1.5px)',clipPath:'url(#bgblur_0_2085_6790_clip_path)',height:'100%',width:'100%'}}></div></foreignObject>
                                <circle data-figma-bg-blur-radius="3" cx="31.6538" cy="112.913" r="28.8188" fill="#FAFAFA" fillOpacity="0.02"/>
                                <path d="M50.4132 130.86C52.0812 129.177 54.8058 129.192 56.4552 130.893L79.3173 154.47C80.9212 156.124 80.9067 158.757 79.2848 160.393C77.6168 162.076 74.8922 162.061 73.2428 160.36L50.3807 136.783C48.7768 135.129 48.7913 132.496 50.4132 130.86Z" fill="#7C7D82"/>
                                <mask id="mask0_2085_6790" style={{maskType:'alpha'}} maskUnits="userSpaceOnUse" x="49" y="129" width="32" height="33">
                                    <path d="M50.4132 130.86C52.0812 129.177 54.8058 129.192 56.4552 130.893L79.3173 154.47C80.9212 156.124 80.9067 158.757 79.2848 160.393C77.6168 162.076 74.8922 162.061 73.2428 160.36L50.3807 136.783C48.7768 135.129 48.7913 132.496 50.4132 130.86Z" fill="#207D60"/>
                                </mask>
                                <g mask="url(#mask0_2085_6790)">
                                    <rect x="46.7891" y="134.309" width="9.61078" height="10.1717" transform="rotate(-45 46.7891 134.309)" fill="#5A5D6F"/>
                                </g>
                                <path d="M19.9466 127.499C20.8112 128.178 20.9347 129.413 20.2554 130.278C19.576 131.143 18.3408 131.266 17.4762 130.587C17.1056 130.278 16.7968 130.031 16.488 129.722C16.1175 129.413 15.8087 129.105 15.5616 128.858C11.1149 124.411 8.8916 118.606 8.8916 112.8C8.8916 106.995 11.1149 101.189 15.5616 96.7426C15.6852 96.6191 15.9322 96.3721 16.3028 96.0633C17.1056 95.3221 18.3408 95.3839 19.0819 96.1868C19.823 96.9897 19.7613 98.2248 18.9584 98.966C18.8349 99.0277 18.6496 99.2748 18.4026 99.5218C14.7588 103.166 12.906 107.983 12.906 112.738C12.906 117.556 14.7588 122.311 18.4026 125.955C18.6496 126.202 18.9584 126.449 19.2055 126.696C19.5143 126.943 19.7613 127.19 20.0083 127.375L19.9466 127.499Z" fill="#F5F6FA"/>
                                <path d="M9.26394 90.5051C15.4399 84.3292 23.5304 81.2412 31.6209 81.2412C39.7114 81.2412 47.8019 84.3292 53.9779 90.5051C60.1538 96.6811 63.2418 104.772 63.2418 112.862C63.2418 120.953 60.1538 129.043 53.9779 135.219C47.8019 141.395 39.7114 144.483 31.6209 144.483C23.5304 144.483 15.4399 141.395 9.26394 135.219C3.08798 129.043 0 120.953 0 112.862C0 104.772 3.08798 96.6811 9.26394 90.5051ZM31.6209 85.1938C24.5186 85.1938 17.478 87.9112 12.0431 93.2843C6.67003 98.6574 3.95261 105.76 3.95261 112.862C3.95261 119.964 6.67003 127.005 12.0431 132.44C17.4162 137.813 24.5186 140.53 31.6209 140.53C38.7233 140.53 45.7639 137.813 51.1987 132.44C56.5718 127.067 59.2892 119.964 59.2892 112.862C59.2892 105.76 56.5718 98.7192 51.1987 93.2843C45.8256 87.9112 38.7233 85.1938 31.6209 85.1938Z" fill="#7C7D82"/>
                                <defs>
                                    <clipPath id="bgblur_0_2085_6790_clip_path" transform="translate(0.165039 -81.0942)">
                                        <circle cx="31.6538" cy="112.913" r="28.8188"/>
                                    </clipPath>
                                    <linearGradient id="paint0_linear_2085_6790" x1="69.4541" y1="51.1455" x2="132.949" y2="139.467" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#F5F6FA"/>
                                        <stop offset="0.75882" stopColor="#B8B8B8"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="empty-state-text">
                            <span className="empty-state-title">No results found!</span>
                            <span className="empty-state-subtitle">Try again with a different keywords.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerDailyTaskUpdates;