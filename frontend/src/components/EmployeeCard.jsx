import React from 'react';
import { getImageUrl, getInitials } from '../utils/teamUpdatesUtils';
import { TodayIcon, HistoryIcon, BlockerAlertIcon } from './Icons';
import '../style/EmployeeCard.css';

// --- NEW INLINE ICONS FOR MANAGER STATUS BAR ---
const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const MeetingIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="14" height="10" rx="2" ry="2"></rect><polygon points="16 12 22 8 22 16 16 12"></polygon></svg>
);
const AlertIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);


// --- SUB-COMPONENTS ---
const TaskItem = ({ task }) => (
    <div className="update-item">
        <span
            className="mini-tag"
            style={{ backgroundColor: task.project_details?.color_code || '#9CA3AF' }}
        >
            {task.project_details?.name || 'No Project'}
        </span>
        <span>{task.content}</span>
    </div>
);

const BlockerItem = ({ task }) => (
    <div className="blocker-item">
        <div className="blocker-icon-container">
            <BlockerAlertIcon />
        </div>
        <div className="blocker-content">
            <span
                className="mini-tag"
                style={{ backgroundColor: task.project_details?.color_code || '#FF493F' }}
            >
                {task.project_details?.name || 'No Project'}
            </span>
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

// --- UPDATED HELPER IN EmployeeCard.jsx ---
const formatTimeLocal = (timeValue) => {
    // 1. If it's empty, null, or the literal string "Not Submitted", return null
    if (!timeValue || timeValue === "Not Submitted") return null;

    // 2. Try to parse it
    const date = new Date(timeValue);

    // 3. Check if JavaScript successfully parsed it (isNaN checks for Invalid Date)
    if (isNaN(date.getTime())) {
        console.error("Failed to parse date string:", timeValue);
        return null;
    }

    // 4. Return the beautifully formatted local time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- MAIN COMPONENT: Employee Card ---
// Added "variant" prop. Defaults to 'employee', can be set to 'manager'.
const EmployeeCard = ({ emp, variant = 'employee' }) => {
    console.log(`Checking tasks for ${emp.full_name}:`, emp);
    const avatarUrl = getImageUrl(emp.avatar);

    const groupedTasks = React.useMemo(() => {
        // Safe fallback if tasks don't exist yet
        if (!emp || !emp.tasks) return [];

        const groups = [];

        // 1. Today's Tasks
        if (emp.tasks.today && emp.tasks.today.length > 0) {
            groups.push({
                dateKey: 'today',
                title: 'TODAY',
                icon: <TodayIcon />,
                tasks: emp.tasks.today
            });
        }

        // 2. Yesterday's Tasks
        if (emp.tasks.yesterday && emp.tasks.yesterday.length > 0) {
            groups.push({
                dateKey: 'yesterday',
                title: 'YESTERDAY',
                icon: <HistoryIcon />,
                tasks: emp.tasks.yesterday
            });
        }

        // 3. Previous Tasks (Crucial for the Employee Portal!)
        if (emp.tasks.previous && emp.tasks.previous.length > 0) {
            groups.push({
                dateKey: 'previous',
                title: 'PREVIOUS',
                icon: <HistoryIcon />,
                tasks: emp.tasks.previous
            });
        }

        // 4. Blockers
        if (emp.tasks.blockers && emp.tasks.blockers.length > 0) {
            groups.push({
                dateKey: 'blockers',
                title: 'BLOCKERS',
                icon: <HistoryIcon />, // Use a warning icon here if you have one!
                tasks: emp.tasks.blockers
            });
        }

        return groups;
    }, [emp.tasks]);

    console.log(`Checking time for ${emp.full_name}:`, emp.submittedTime);

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

            {/* --- MANAGER STATUS BAR (Conditionally Rendered) --- */}
            {variant === 'manager' && (() => {
                // Calculate it once per render
                const safeTime = formatTimeLocal(emp.submittedTime);

                return (
                    <div className="card-status-bar">
                        <div className={`status-pill ${!safeTime ? 'disabled' : ''}`}>
                            <ClockIcon />
                            {safeTime ? `Submitted ${safeTime}` : 'Not Submitted'}
                        </div>

                        <div className={`status-pill ${!emp.meetings ? 'disabled' : ''}`}>
                            <MeetingIcon /> {emp.meetings ? `${emp.meetings} meetings` : 'No meetings'}
                        </div>

                        {emp.blockers > 0 && (
                            <div className="status-pill alert">
                                <AlertIcon /> {emp.blockers} blockers
                            </div>
                        )}
                    </div>
                );
            })()}

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