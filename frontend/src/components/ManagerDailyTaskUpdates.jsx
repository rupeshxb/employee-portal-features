import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../utils/teamUpdatesUtils';
import ManagerFilterBar from './ManagerFilterBar';
import EmployeeCard from './EmployeeCard';
import { NoResultsIllustration } from './Icons';

import '../style/ManagerDailyTaskUpdates.css';
import '../style/Header.css';

const ManagerDailyTaskUpdates = () => {
    // --- STATE ---
    const [employees, setEmployees] = useState([]);
    const [dateMeta, setDateMeta] = useState({ target_date: '', prev_date: '' });
    const [totalDepartmentCount, setTotalDepartmentCount] = useState(0);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projectList, setProjectList] = useState([]);

    // Tag Nav State — populated dynamically from Tags Management
    const [tags, setTags] = useState([]);
    const [activeTagId, setActiveTagId] = useState(() => sessionStorage.getItem('activeTaskTagId') || 'all');

    // Custom scrollbar state
    const navRef = useRef(null);
    const [scrollInfo, setScrollInfo] = useState({ left: 0, scrollWidth: 0, clientWidth: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, scrollLeft: 0, trackW: 0, thumbW: 0, scrollRange: 0 });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [dateFilter, setDateFilter] = useState('Today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeFilter, setTimeFilter] = useState('Before 10 AM');

    // --- 1. FETCH PROJECTS + TAGS (Runs Once) ---
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

        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tags/`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('Failed to fetch tags');
                const data = await response.json();
                const list = data.results || data;
                const sorted = [...list].sort((a, b) => a.id - b.id);
                setTags(sorted);
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };

        fetchProjects();
        fetchTags();
    }, []);

    // --- 2. FETCH EMPLOYEES & TASKS (Runs on Filter Change) ---
    useEffect(() => {
        const fetchFilteredTasks = async () => {
            setLoading(true);
            try {
                // Build the query string dynamically based on active filters
                const params = new URLSearchParams();

                if (activeTagId !== 'all') params.append('tag', activeTagId);
                if (searchTerm) params.append('search', searchTerm);
                if (selectedProject !== 'All Projects') params.append('project', selectedProject);

                // Handle Dates — use LOCAL date so it matches how DailyTask.date is stored
                const toLocalDateStr = (d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };
                let filterType = '';
                if (dateFilter === 'Today') {
                    params.append('date', toLocalDateStr(new Date()));
                    filterType = 'today';
                } else if (dateFilter === 'Yesterday') {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    params.append('date', toLocalDateStr(yest));
                    filterType = 'yesterday';
                } else if (dateFilter === 'Custom Date' && customDate) {
                    params.append('date', customDate);
                    filterType = 'custom';
                }
                if (filterType) params.append('filter_type', filterType);

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
                setEmployees(data.employees || data);
                setDateMeta(data.meta || { target_date: '', prev_date: '' });
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

    }, [activeTagId, searchTerm, selectedProject, dateFilter, customDate, timeFilter]);

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

        // Time Filter — always applied, compared against 10:00 (local time)
        result = result.filter(emp => {
            if (timeFilter === 'Not Submitted') {
                return !emp.submittedTime || emp.submittedTime === 'Not Submitted';
            }

            if (!emp.submittedTime || emp.submittedTime === 'Not Submitted') return false;

            const submittedAt = new Date(emp.submittedTime);
            if (isNaN(submittedAt.getTime())) return false;

            const minutesOfDay = submittedAt.getHours() * 60 + submittedAt.getMinutes();
            const tenAM = 10 * 60;

            if (timeFilter === 'Before 10 AM') return minutesOfDay < tenAM;
            if (timeFilter === 'After 10 AM') return minutesOfDay >= tenAM;

            return true;
        });

        setFilteredEmployees(result);
    }, [employees, searchTerm, selectedProject, timeFilter]);

    // --- CUSTOM SCROLLBAR LOGIC ---
    const updateScrollInfo = () => {
        const el = navRef.current;
        if (el) setScrollInfo({ left: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
    };

    useEffect(() => { updateScrollInfo(); }, [tags]);

    useEffect(() => {
        window.addEventListener('resize', updateScrollInfo);
        return () => window.removeEventListener('resize', updateScrollInfo);
    }, []);

    const isScrollable = tags.length + 1 > 8;
    const showScrollbar = isScrollable && scrollInfo.scrollWidth > scrollInfo.clientWidth;

    const TRACK_MARGIN = 0;
    const THUMB_H = 5;
    const trackW = Math.max(0, scrollInfo.clientWidth - TRACK_MARGIN * 2);
    const thumbW = 100;
    const scrollProgress = scrollInfo.scrollWidth > scrollInfo.clientWidth
        ? scrollInfo.left / (scrollInfo.scrollWidth - scrollInfo.clientWidth)
        : 0;
    const thumbX = TRACK_MARGIN + scrollProgress * (trackW - thumbW);

    const handleThumbMouseDown = (e) => {
        e.preventDefault();
        const el = navRef.current;
        if (!el) return;
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX,
            scrollLeft: el.scrollLeft,
            trackW,
            thumbW,
            scrollRange: scrollInfo.scrollWidth - scrollInfo.clientWidth,
        };
        const onMove = (e) => {
            if (!isDragging.current) return;
            const { x, scrollLeft, trackW, thumbW, scrollRange } = dragStart.current;
            const dx = e.clientX - x;
            const trackRange = trackW - thumbW;
            if (trackRange <= 0) return;
            navRef.current.scrollLeft = Math.max(0, Math.min(scrollRange, scrollLeft + (dx / trackRange) * scrollRange));
        };
        const onUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const handleTrackClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left - TRACK_MARGIN;
        if (clickX < 0 || clickX > trackW) return;
        const ratio = clickX / trackW;
        if (navRef.current) navRef.current.scrollLeft = ratio * (scrollInfo.scrollWidth - scrollInfo.clientWidth);
    };

    // Handle Tab Click
    const handleTagChange = (tagId) => {
        const id = String(tagId);
        setActiveTagId(id);
        sessionStorage.setItem('activeTaskTagId', id);
    };

    const activeTag = tags.find(t => String(t.id) === String(activeTagId));
    const displayTitle = activeTagId === 'all' ? 'All Employees' : (activeTag?.display_name || 'All Employees');

    return (
        <div className="daily-tasks-container">
            <div className="page-header">
                <h2>Daily Task Updates</h2>
                <p>View daily work updates submitted by team members across projects and teams.</p>
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
            </div>

            <div className="department-nav-wrapper">
                <div
                    className={`department-nav${isScrollable ? ' department-nav--scrollable' : ''}`}
                    ref={navRef}
                    onScroll={updateScrollInfo}
                >
                    <button
                        key="all"
                        className={`dept-tab ${activeTagId === 'all' ? 'active' : ''}`}
                        onClick={() => handleTagChange('all')}
                    >
                        All
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag.id}
                            className={`dept-tab ${String(activeTagId) === String(tag.id) ? 'active' : ''}`}
                            onClick={() => handleTagChange(tag.id)}
                        >
                            {tag.display_name}
                        </button>
                    ))}
                </div>

                {showScrollbar && (
                    <svg
                        className="dept-nav-scrollbar"
                        width="100%"
                        height={THUMB_H + 8}
                        onClick={handleTrackClick}
                        style={{ display: 'block', cursor: 'default' }}
                    >
                        <rect
                            x={TRACK_MARGIN}
                            y={4}
                            width={trackW}
                            height={THUMB_H}
                            rx={THUMB_H / 2}
                            fill="#e2e8f0"
                        />
                        <rect
                            x={thumbX}
                            y={4}
                            width={thumbW}
                            height={THUMB_H}
                            rx={THUMB_H / 2}
                            fill="#94a3b8"
                            style={{ cursor: 'grab' }}
                            onMouseDown={handleThumbMouseDown}
                            onClick={e => e.stopPropagation()}
                        />
                    </svg>
                )}
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

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <span>Loading team updates...</span>
                </div>
            ) : filteredEmployees.length > 0 ? (
                <div className="manager-daily-update-employee-card employee-cards-grid">
                    {filteredEmployees.map(emp => (
                        <EmployeeCard
                            key={emp.id}
                            emp={emp}
                            variant="manager"
                            filterType={dateMeta.filter_type || ''}
                            targetDate={dateMeta.target_date}
                            prevDate={dateMeta.prev_date}
                        />
                    ))}
                </div>
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
    );
};

export default ManagerDailyTaskUpdates;