import React from 'react';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { getSafeBackgroundColor } from '../utils/helpers';
import '../style/TaskList.css';

const TaskList = ({ groupedTasks, onEdit, onDelete, onAddNewTask }) => {
  // --- Empty State ---
  if (!groupedTasks || groupedTasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Calendar size={48} strokeWidth={1.5} style={{ color: '#9CA3AF' }} />
        </div>
        <h3 className="empty-title">No tasks added yet!</h3>
        <p className="empty-subtitle">All of your tasks once added will be shown here.</p>
        <button
          type="button"
          className="empty-cta-btn"
          onClick={() => onAddNewTask?.()}
        >
          Add New Task
        </button>
      </div>
    );
  }

  return (
    <div className="task-list daily-tasks-task-list">
      {groupedTasks.map((group, index) => (
        <div key={index} className="date-card">
          {/* --- HEADER --- */}
          <div className="date-header">
            <div className="date-text">
              <Calendar size={14} style={{ color: '#9CA3AF' }} />
              {new Date(group.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>

            <div className="header-divider"></div>

            <div className="date-text">
              <Clock size={14} style={{ color: '#9CA3AF' }} />
              {group.lastUpdated || '09:00 AM'}
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
          {group.blockers && group.blockers.length > 0 && (
            <div className="blocker-section">
              <div className="blocker-section-title">
                BLOCKERS
              </div>
              <div className="blocker-rows">
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Sub-component: Single Task Row ---
const TaskRow = ({ task, index, onEdit, onDelete, isBlocker }) => {
  const projectColor = task.project_details?.color_code || task.color_code;
  const projectName = task.project_details?.name || task.project_name || 'No Project';
  const taskDescription = task.task_description || task.content || "Untitled Task";
  const displayText = (() => {
    if (!isBlocker) return taskDescription;
    if (task.blocker_reason) return task.blocker_reason;
    const match = task.content?.match(/\[Reason:\s*(.*?)\]$/);
    return match ? match[1] : taskDescription;
  })();

  return (
    <div className={`task-row ${isBlocker ? 'blocker-row' : ''}`}>
      <div className="task-left">
        <span className="task-number">{index + 1}.</span>
        <div className="task-content-wrapper">
          <span className="task-text">{displayText}</span>
        </div>
      </div>

      <div className="task-actions">
        {/* Project Tag */}
        <span
          className="tag"
          style={{
            backgroundColor: getSafeBackgroundColor(projectColor),
          }}
        >
          {projectName}
        </span>

        {/* Action Icons */}
        <div className="action-group">
          <button
            className="action-btn"
            onClick={() => onEdit(task)}
            title="Edit Task"
          >
            <Edit2 size={15} />
          </button>

          <button
            className="action-btn delete"
            onClick={() => onDelete(task)}
            title="Delete Task"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskList;