import React from 'react';
import { getImageUrl, getInitials } from '../utils/teamUpdatesUtils';
import { CalendarIcon, HistoryIcon, BlockerAlertIcon, NotSubmittedWarningIcon } from './Icons';
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

const stripReason = (content) => {
    if (!content) return '';
    const idx = content.indexOf('[Reason:');
    return idx !== -1 ? content.substring(0, idx).trim() : content;
};

const BlockerItem = ({ task }) => (
    <div className="blocker-item">
        <div className="blocker-content">
            <span
                className="mini-tag"
                style={{ backgroundColor: task.project_details?.color_code || '#FF493F' }}
            >
                {task.project_details?.name || 'No Project'}
            </span>
            <span>{stripReason(task.content)}</span>
        </div>
    </div>
);

const DaySection = ({ title, icon, tasks }) => {
    if (!tasks || tasks.length === 0) return null;

    if (title === 'BLOCKERS') {
        return (
            <div className="ec-blocker-section">
                <div className="card-section-header">
                    <div className="card-section-title ec-blocker-title">{title}</div>
                    <div className="section-icon">{icon}</div>
                </div>
                <div className="task-list">
                    {tasks.map(task => (
                        <BlockerItem key={task.id} task={task} />
                    ))}
                </div>
            </div>
        );
    }

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

const labelForDate = (dateStr) => {
    if (!dateStr) return null;
    const todayStr = getLocalDateString(new Date());
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = getLocalDateString(yest);
    if (dateStr === todayStr) return 'TODAY';
    if (dateStr === yesterdayStr) return 'YESTERDAY';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
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
const EmployeeCard = ({ emp, variant = 'employee', filterType = '', targetDate = '', prevDate = '' }) => {
    const avatarUrl = getImageUrl(emp.avatar);

    const groupedTasks = React.useMemo(() => {
        if (!emp || !emp.tasks) return [];

        const groups = [];

        if (emp.tasks.today && emp.tasks.today.length > 0) {
            groups.push({
                dateKey: 'today',
                title: labelForDate(targetDate) || 'TODAY',
                icon: <CalendarIcon />,
                tasks: emp.tasks.today
            });
        }

        if (emp.tasks.yesterday && emp.tasks.yesterday.length > 0) {
            groups.push({
                dateKey: 'yesterday',
                title: labelForDate(prevDate) || 'YESTERDAY',
                icon: <HistoryIcon />,
                tasks: emp.tasks.yesterday
            });
        }

        if (emp.tasks.previous && emp.tasks.previous.length > 0 && variant !== 'manager') {
            groups.push({
                dateKey: 'previous',
                title: 'PREVIOUS',
                icon: <HistoryIcon />,
                tasks: emp.tasks.previous
            });
        }

        if (emp.tasks.blockers && emp.tasks.blockers.length > 0) {
            groups.push({
                dateKey: 'blockers',
                title: 'BLOCKERS',
                icon: <BlockerAlertIcon />,
                tasks: emp.tasks.blockers
            });
        }

        return groups;
    }, [emp.tasks, targetDate, prevDate, variant]);

    return (
        <div className="employee-card">
            {/* Header (Fixed) */}
            <div className="card-header">
                <div className="avatar-wrapper">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={emp.full_name}
                            className="ec-avatar"
                        />
                    ) : (
                        <div className="ec-avatar-initials">
                            {getInitials(emp.full_name)}
                        </div>
                    )}
                </div>

                <div className="emp-info">
                    <h4>{emp.full_name}</h4>
                    <span>{emp.designation_name || ''}</span>
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
                ) : filterType !== '' ? (
                    <div className="ec-not-submitted">
                        <NotSubmittedWarningIcon />
                        <div className="ec-not-submitted-text">
                            <span className="ec-not-submitted-label">Not Submitted</span>
                            <span className="ec-not-submitted-desc">
                                {filterType === 'today' && 'No task update submitted as of today.'}
                                {filterType === 'yesterday' && 'No task update submitted yesterday.'}
                                {filterType === 'custom' && `No task update submitted on ${labelForDate(targetDate)}.`}
                            </span>
                        </div>
                    </div>
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