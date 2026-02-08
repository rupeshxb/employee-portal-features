import React from 'react';
import { getSafeBackgroundColor } from '../utils/helpers';

const TaskList = ({ groupedTasks, onEdit, onDelete }) => {
  if (!groupedTasks || groupedTasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No tasks added yet!</h3>
      </div>
    );
  }

  return (
    <div className="task-list">
      {groupedTasks.map((group, index) => (
        <div key={index} className="date-card">
          {/* HEADER */}
          <div className="date-header">
            <div className="date-text">
              📅 {new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="date-text" style={{ marginLeft: 'auto' }}>
              🕒 {group.lastUpdated}
            </div>
          </div>

          {/* TASKS */}
          {group.tasks.map((task, idx) => (
            <TaskRow key={task.id} task={task} index={idx} onEdit={onEdit} onDelete={onDelete} />
          ))}

          {/* BLOCKERS */}
          {group.blockers.length > 0 && (
            <>
              <div className="blocker-section-title">BLOCKERS</div>
              {group.blockers.map((task, idx) => (
                <TaskRow key={task.id} task={task} index={idx} onEdit={onEdit} onDelete={onDelete} isBlocker={true} />
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// Sub-component for a single row to keep things clean
const TaskRow = ({ task, index, onEdit, onDelete, isBlocker }) => (
  <div className={`task-row ${isBlocker ? 'blocker-row' : ''}`}>
    <div className="task-left">
      <span className="task-number">{index + 1}.</span>
      <span className="task-text">{task.content}</span>
    </div>
    
    <div className="task-actions">
      
      {/* Project Tag (Dynamic Background, Always White Text) */}
      <span 
        className="tag" 
        style={{
          backgroundColor: getSafeBackgroundColor(task.project_details?.color_code),
          color: '#FFFFFF', 
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}
      >
        {task.project_details?.name || 'No Project'}
      </span>

      {/* EDIT BUTTON (Simplistic Grey Pencil) */}
      <button 
        className="action-btn" 
        onClick={() => onEdit(task)} 
        title="Edit Task"
        style={{ color: '#9CA3AF' }} // Ensure grey color
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      {/* DELETE BUTTON (Simplistic Grey Trashcan) */}
      <button 
        className="action-btn delete" 
        onClick={() => onDelete(task)} 
        title="Delete Task"
        style={{ color: '#9CA3AF' }} // Ensure grey color
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
);

export default TaskList;