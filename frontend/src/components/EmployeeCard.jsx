import React from 'react';
import { getImageUrl, getInitials } from '../utils/teamUpdatesUtils';
import '../style/EmployeeCard.css';

// --- SUB-COMPONENT: Single Task Item ---
const TaskItem = ({ task, isBlocker }) => (
    <div className={`update-item ${isBlocker ? 'blocker-text' : ''}`}>
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

// --- MAIN COMPONENT: Employee Card ---
const EmployeeCard = ({ emp }) => {
    const avatarUrl = getImageUrl(emp.avatar);

    return (
        <div className="employee-card">
            {/* Header */}
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

            {/* Today */}
            <div>
                <div className="card-section-title">TODAY</div>
                {emp.tasks.today.length > 0 ? (
                    emp.tasks.today.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))
                ) : (<div className="update-item" style={{ color: '#9CA3AF' }}>No tasks posted.</div>)}
            </div>

            {/* Yesterday */}
            <div>
                <div className="card-section-title">YESTERDAY</div>
                {emp.tasks.yesterday.length > 0 ? (
                    emp.tasks.yesterday.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))
                ) : (<div className="update-item" style={{ color: '#9CA3AF' }}>No tasks posted.</div>)}
            </div>

            {/* Blockers */}
            {emp.tasks.blockers.length > 0 && (
                <div>
                    <div className="card-section-title" style={{ color: '#EF4444' }}>BLOCKERS</div>
                    <div className="blocker-box">
                        {emp.tasks.blockers.map(task => (
                            <TaskItem key={task.id} task={task} isBlocker={true} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeCard;