import React from 'react';
import { getImageUrl, getInitials } from '../utils/teamUpdatesUtils';
import { TodayIcon, HistoryIcon, BlockerAlertIcon } from './Icons'; // Imported SVGs
import '../style/EmployeeCard.css';

// --- SUB-COMPONENTS ---
const TaskItem = ({ task }) => (
    <div className="update-item">
        <div style={{ minWidth: 'fit-content' }}>
            <span
                className="mini-tag"
                style={{ backgroundColor: task.project_details?.color_code || '#9CA3AF' }}
            >
                {task.project_details?.name || 'No Project'}
            </span>
        </div>
        <span>{task.content}</span>
    </div>
);

const BlockerItem = ({ task }) => (
    <div className="blocker-item">
        <div className="blocker-icon-container">
            <BlockerAlertIcon />
        </div>
        <div className="blocker-content">
            <div style={{ minWidth: 'fit-content', marginBottom: '6px' }}>
                <span
                    className="mini-tag"
                    style={{ backgroundColor: task.project_details?.color_code || '#FF493F' }}
                >
                    {task.project_details?.name || 'No Project'}
                </span>
            </div>
            <span>{task.content}</span>
        </div>
    </div>
);

const DaySection = ({ title, icon, tasks }) => {
    if (!tasks || tasks.length === 0) return null;

    return (
        <div className="day-section">
            <div className="card-section-header">
                <div className="card-section-title">{title}</div>
                <div className="section-icon">{icon}</div>
            </div>

            <div className="task-list">
                {/* Regular tasks AND blockers map seamlessly side-by-side here */}
                {tasks.map(task => (
                    task.is_blocker
                        ? <BlockerItem key={task.id} task={task} />
                        : <TaskItem key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
};

// --- HELPER TO GET LOCAL YYYY-MM-DD SAFELY ---
const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- MAIN COMPONENT: Employee Card ---
const EmployeeCard = ({ emp }) => {
    const avatarUrl = getImageUrl(emp.avatar);

    // Dynamic grouping logic: Flattens ALL tasks and properly organizes them by actual date
    const groupedTasks = React.useMemo(() => {
        if (!emp.tasks) return [];

        const todayStr = getLocalDateString(new Date());

        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yesterdayStr = getLocalDateString(yest);

        const allTasksMap = new Map();

        // 1. Flatten all arrays safely
        ['today', 'yesterday', 'previous', 'blockers'].forEach(groupKey => {
            // Make sure the group actually exists and is an array
            if (Array.isArray(emp.tasks[groupKey])) {
                emp.tasks[groupKey].forEach((task, index) => {
                    // Extract a clean YYYY-MM-DD string, stripping out any time data
                    let taskDateStr = task.date || task.created_at;
                    let cleanDate = todayStr; // default fallback

                    if (taskDateStr) {
                        cleanDate = taskDateStr.split('T')[0];
                    } else if (groupKey === 'yesterday') {
                        cleanDate = yesterdayStr;
                    }

                    const isBlocker = task.is_blocker || groupKey === 'blockers';

                    // FALLBACK ID: If backend doesn't provide a unique task.id, tasks will overwrite each other!
                    // We generate a fallback ID using the group, date, and index to guarantee every task renders.
                    const safeId = task.id ? String(task.id) : `${groupKey}-${cleanDate}-${index}`;

                    if (allTasksMap.has(safeId)) {
                        // If it exists (e.g., found in both 'today' and 'blockers'), retain the blocker status
                        if (isBlocker) allTasksMap.get(safeId).is_blocker = true;
                    } else {
                        allTasksMap.set(safeId, { ...task, is_blocker: isBlocker, _computedDate: cleanDate });
                    }
                });
            }
        });

        // 2. Group by the cleaned date string
        const groups = Array.from(allTasksMap.values()).reduce((acc, task) => {
            const d = task._computedDate;
            if (!acc[d]) acc[d] = [];
            acc[d].push(task);
            return acc;
        }, {});

        // 3. Sort dates descending and format titles without timezone bugs
        return Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(dateKey => {
                let title = '';
                let icon = <HistoryIcon />;

                if (dateKey === todayStr) {
                    title = "TODAY";
                    icon = <TodayIcon />;
                } else if (dateKey === yesterdayStr) {
                    title = "YESTERDAY";
                } else {
                    // Manually parse parts to avoid timezone shift bugs
                    const [yyyy, mm, dd] = dateKey.split('-');
                    const localDateObj = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
                    title = localDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                }

                return {
                    dateKey,
                    title,
                    icon,
                    tasks: groups[dateKey]
                };
            });
    }, [emp.tasks]);

    return (
        <div className="employee-card">
            {/* Header (Fixed) */}
            <div className="card-header">
                <div className="avatar-wrapper">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={emp.full_name}
                            className="avatar"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid #E5E7EB'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#E0E7FF',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            border: '1px solid #E5E7EB'
                        }}>
                            {getInitials(emp.full_name)}
                        </div>
                    )}
                </div>

                <div className="emp-info">
                    <h4>{emp.full_name}</h4>
                    <span>{emp.designation}</span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="card-scroll-area">
                {groupedTasks.length > 0 ? (
                    groupedTasks.map(({ dateKey, title, icon, tasks }) => (
                        <DaySection
                            key={dateKey}
                            title={title}
                            icon={icon}
                            tasks={tasks}
                        />
                    ))
                ) : (
                    <div className="day-section">
                        <div className="empty-state">No tasks posted.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeCard;