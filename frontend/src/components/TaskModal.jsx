import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const TaskModal = ({ show, onClose, onSubmit, isEditing, initialData, projects }) => {
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date());
  const [isBlocker, setIsBlocker] = useState(false);
  const [blockerReason, setBlockerReason] = useState("");

  // Load data when modal opens for editing
  useEffect(() => {
    if (show && isEditing && initialData) {
      let cleanContent = initialData.content;
      if (initialData.is_blocker && initialData.content.includes("[Reason:")) {
          cleanContent = initialData.content.split("[Reason:")[0].trim();
          const reasonMatch = initialData.content.match(/\[Reason: (.*?)\]/);
          if (reasonMatch) setBlockerReason(reasonMatch[1]);
      } else {
          setBlockerReason("");
      }
      setContent(cleanContent);
      setProjectId(initialData.project_details?.id || "");
      setIsBlocker(initialData.is_blocker);
      setDate(initialData.date ? new Date(initialData.date) : new Date());
    } else if (show && !isEditing) {
      // Reset form for new task
      setContent("");
      setProjectId("");
      setDate(new Date());
      setIsBlocker(false);
      setBlockerReason("");
    }
  }, [show, isEditing, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content || !projectId) {
        alert("Please fill in description and project.");
        return;
    }
    // Pass data back to Parent
    onSubmit({
      content: isBlocker && blockerReason ? `${content} [Reason: ${blockerReason}]` : content,
      project_id: projectId,
      is_blocker: isBlocker,
      date: date.toISOString().split('T')[0]
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Edit Task" : "Add New Task"}</h2>
            <p>Log what you worked/planning to work on for today.</p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Description</label>
            <textarea className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="What you worked on today?" />
          </div>
          <div className="form-group">
            <label>Select Project</label>
            <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="" disabled>Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Select Date</label>
            <DatePicker selected={date} onChange={(d) => setDate(d)} className="date-picker-input" dateFormat="MMMM d, yyyy" />
          </div>
          <div style={{marginTop: '10px'}}>
            <label className="checkbox-group">
              <input type="checkbox" className="custom-checkbox" checked={isBlocker} onChange={(e) => setIsBlocker(e.target.checked)} />
              <span>I faced a Blocker</span>
            </label>
            {isBlocker && (<input type="text" className="blocker-input" placeholder="What is the blocker?" value={blockerReason} onChange={(e) => setBlockerReason(e.target.value)}/>)}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-reset" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{isEditing ? "Update Task" : "Add Task"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;