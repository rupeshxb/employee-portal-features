import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, ChevronDown, X, Check, Search } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";
import '../style/TaskModal.css';

const TaskModal = ({ show, onClose, onSubmit, isEditing, initialData, projects }) => {
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date());
  const [isBlocker, setIsBlocker] = useState(false);
  const [blockerReason, setBlockerReason] = useState("");

  // Custom Dropdown & Search State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (show && isEditing && initialData) {
      let cleanContent = initialData.content || "";
      let reason = "";

      if (initialData.is_blocker && initialData.content && initialData.content.includes("[Reason:")) {
        cleanContent = initialData.content.split("[Reason:")[0].trim();
        const reasonMatch = initialData.content.match(/\[Reason: (.*?)\]/);
        if (reasonMatch) reason = reasonMatch[1];
      }

      setBlockerReason(reason);
      setContent(cleanContent);
      setProjectId(initialData.project_details?.id || initialData.project || "");
      setIsBlocker(initialData.is_blocker || false);
      setDate(initialData.date ? new Date(initialData.date) : new Date());
    } else if (show && !isEditing) {
      // Reset for Add Mode
      setContent("");
      setProjectId("");
      setDate(new Date());
      setIsBlocker(false);
      setBlockerReason("");
      setIsDropdownOpen(false);
      setSearchTerm("");
    }
  }, [show, isEditing, initialData]);

  if (!show) return null;

  const selectedProject = projects.find(p => p.id === projectId);
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content task-add-modal">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>{isEditing ? "Edit Task" : "Add New Task"}</h2>
          <p>
            {isEditing
              ? "Update task details or time spent. Changes will reflect in your daily log."
              : "Log what you worked/planning to work on for today."
            }
          </p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          let formattedDate = "";
          if (date) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            formattedDate = `${yyyy}-${mm}-${dd}`;
          }

          onSubmit({
            content: isBlocker && blockerReason ? `${content} [Reason: ${blockerReason}]` : content,
            project_id: projectId,
            is_blocker: isBlocker,
            date: formattedDate
          });
        }} className="modal-form">

          {/* --- START OF NEW SCROLLABLE WRAPPER --- */}
          <div className="modal-scrollable-content">
            <div className="form-group">
              <label>Task Description</label>
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What you worked on today?"
              />
            </div>

            <div className="form-group">
              <label>Select Project</label>
              <div className="custom-select-wrapper" ref={dropdownRef}>

                <div
                  className={`custom-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    if (!isDropdownOpen) setSearchTerm("");
                  }}
                >
                  {selectedProject ? (
                    <span
                      className="project-pill-display"
                      style={{
                        backgroundColor: selectedProject.color_code || '#3366ff',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {selectedProject.name}
                    </span>
                  ) : (
                    <span className="placeholder-text" style={{ color: '#9CA3AF' }}>Select project</span>
                  )}

                  <ChevronDown
                    className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`}
                    size={16}
                  />
                </div>

                {isDropdownOpen && (
                  <div className="custom-options-list">
                    <div className="dropdown-search-container">
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        placeholder="Search project"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>

                    <div className="options-scroll-area">
                      {filteredProjects.map(p => {
                        const isSelected = p.id === projectId;

                        return (
                          <div
                            key={p.id}
                            className={`custom-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setProjectId(p.id);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: p.color_code || '#3366ff',
                                color: '#FFFFFF',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8125rem',
                                fontWeight: '600'
                              }}
                            >
                              {p.name}
                            </span>

                            {isSelected && <Check size={16} style={{ color: '#2563EA' }} />}
                          </div>
                        );
                      })}

                      {filteredProjects.length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                          No projects found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Select Date</label>
              <div className="input-icon-wrapper">
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  className="date-picker-input"
                  dateFormat="MMM d, yyyy"
                />
                <Calendar className="input-icon-right" size={18} />
              </div>
            </div>

            <div className="blocker-section">
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={isBlocker}
                  onChange={(e) => setIsBlocker(e.target.checked)}
                />
                <span>I faced a Blocker</span>
              </label>

              {isBlocker && (
                <div className="form-group blocker-fade">
                  {/* 1. Grey Text Label */}
                  <label className="label-grey">Describe Blocker</label>

                  {/* 2. No Placeholder */}
                  <input
                    type="text"
                    className="blocker-input"
                    placeholder="Any dependency, delay, unclear requirement?"
                    value={blockerReason}
                    onChange={(e) => setBlockerReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-reset" onClick={() => {
              setContent("");
              setIsBlocker(false);
              setBlockerReason("");
              setProjectId("");
              setDate(new Date());
            }}>Reset</button>
            <button type="submit" className="btn-submit">{isEditing ? "Update Task" : "Add Task"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;