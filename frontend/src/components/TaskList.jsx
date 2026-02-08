import React from 'react';
import { Calendar, Clock, Edit2, Trash2, AlertCircle, ClipboardList } from 'lucide-react';
import { getSafeBackgroundColor } from '../utils/helpers';

const TaskList = ({ groupedTasks, onEdit, onDelete }) => {
  // --- Empty State ---
  if (!groupedTasks || groupedTasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
            <ClipboardList size={48} strokeWidth={1.5} color="#9CA3AF"/>
        </div>
        <h3 style={{color: '#4B5563', marginTop: '10px'}}>No tasks added yet!</h3>
        <p style={{color: '#9CA3AF', fontSize: '0.9rem'}}>Start by adding your daily updates.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {groupedTasks.map((group, index) => (
        <div key={index} className="date-card">
          {/* --- HEADER --- */}
          <div className="date-header">
            <div className="date-text">
              <Calendar size={16} style={{ marginRight: '6px' }} />
              {new Date(group.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
              })}
            </div>
            <div className="date-text" style={{ marginLeft: 'auto', color: '#6B7280' }}>
              <Clock size={14} style={{ marginRight: '4px' }} />
              {group.lastUpdated || 'Just now'}
            </div>
          </div>

          {/* --- STANDARD TASKS --- */}
          <div className="task-group">
            {group.tasks.map((task, idx) => (
                <TaskRow 
                    key={task.id} 
                    task={task} 
                    index={idx} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                />
            ))}
          </div>

          {/* --- BLOCKERS SECTION --- */}
          {group.blockers.length > 0 && (
            <div className="blocker-section">
              <div className="blocker-section-title">
                  <AlertCircle size={12} style={{marginRight: '4px'}} />
                  BLOCKERS
              </div>
              {group.blockers.map((task, idx) => (
                <TaskRow 
                    key={task.id} 
                    task={task} 
                    index={idx} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    isBlocker={true} 
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Sub-component: Single Task Row ---
const TaskRow = ({ task, index, onEdit, onDelete, isBlocker }) => (
  <div className={`task-row ${isBlocker ? 'blocker-row' : ''}`}>
    <div className="task-left">
      <span className="task-number">{index + 1}.</span>
      
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <span className="task-text">{task.task_description || task.content}</span>
        {/* If it's a blocker, show the reason if available */}
        {isBlocker && task.blocker_reason && (
            <span style={{fontSize: '0.75rem', color: '#DC2626', marginTop: '2px'}}>
                Reason: {task.blocker_reason}
            </span>
        )}
      </div>
    </div>
    
    <div className="task-actions">
      
      {/* Project Tag */}
      <span 
        className="tag" 
        style={{
          backgroundColor: getSafeBackgroundColor(task.project_details?.color_code || task.color_code),
          color: '#FFFFFF', 
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {task.project_details?.name || task.project_name || 'No Project'}
      </span>

      {/* EDIT BUTTON */}
      <button 
        className="action-btn" 
        onClick={() => onEdit(task)} 
        title="Edit Task"
      >
        <Edit2 size={16} />
      </button>

      {/* DELETE BUTTON */}
      <button 
        className="action-btn delete" 
        onClick={() => onDelete(task)} 
        title="Delete Task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

export default TaskList;