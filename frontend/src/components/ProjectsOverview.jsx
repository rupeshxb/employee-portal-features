import React, { useState, useEffect } from 'react';
import '../style/ProjectsOverview.css';
import { ProjectsOverviewEmptyIcon } from './Icons';
import ProjectsOverviewFilterBar from './ProjectsOverviewFilterBar';
import ProjectModal from './ProjectModal';
import ProjectCard from './ProjectCard';

// Define your Render backend URL (falls back to localhost for local development)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProjectsOverview = () => {
  const [projects, setProjects] = useState([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProject, setSelectedProject] = useState(null);

  // Delete Confirmation States
  const [projectToDelete, setProjectToDelete] = useState(null);

  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [teamSizeFilter, setTeamSizeFilter] = useState('All');

  // --- Fetch projects from Django on page load ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/api/projects/`, {
          headers: {
            'Authorization': `token ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          console.error("Failed to fetch projects from server");
        }
      } catch (error) {
        console.error("Network error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // --- Handlers for Add/Edit Form ---
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setModalMode('edit');
    // Translate Django's snake_case back to camelCase so ProjectModal can read it!
    setSelectedProject({
      ...project,
      projectName: project.name,
      clientName: project.client,
      accentColor: project.accent_color,
      startDate: project.start_date,
      endDate: project.end_date,
      teamStructure: project.team_structure || project.teamStructure,
    });
    setIsModalOpen(true);
  };

  // --- Save directly to Django Database ---
  const handleSaveProject = async (projectData) => {
    try {
      const isAddMode = modalMode === 'add';
      const method = isAddMode ? 'POST' : 'PUT';
      // If adding, hit /api/projects/. If editing, hit /api/projects/{id}/
      const endpoint = isAddMode
        ? `${API_URL}/api/projects/`
        : `${API_URL}/api/projects/${projectData.id}/`;

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        const savedProject = await response.json();

        if (isAddMode) {
          setProjects([...projects, savedProject]);
          // Notification uses savedProject.name now
          setNotification(`Project ${savedProject.name} added successfully.`);
        } else {
          setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
          setNotification(`Project ${savedProject.name} updated successfully.`);
        }

        setIsModalOpen(false);
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.error("Server rejected the project data");
      }
    } catch (error) {
      console.error("Network error saving project:", error);
    }
  };

  // --- Handlers for Delete ---
  const handleOpenDeleteConfirm = (project) => {
    setProjectToDelete(project);
  };

  // --- Delete from Django Database ---
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
        setNotification(`Project deleted successfully.`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.error("Server failed to delete project");
      }
    } catch (error) {
      console.error("Network error deleting project:", error);
    }
  };

  return (
    <div className="project-overview-container" style={{ position: 'relative' }}>

      {notification && (
        <div className="success-toast">
          <span>{notification}</span>
          <button className="toast-close-btn" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      <div className="page-header">
        <div className="header-decor bubble-small"></div>
        <div className="header-decor bubble-large"></div>
        <div className="projects-header-inner">
          <div className="header-text">
            <h2>Projects Overview</h2>
            <p>View and manage all ongoing projects, teams, and allocations in one place.</p>
          </div>
          <button className="add-project-btn" onClick={handleOpenAddModal}>+ Add Project</button>
        </div>
      </div>

      <ProjectsOverviewFilterBar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        dateRange={dateRange} setDateRange={setDateRange}
        teamSizeFilter={teamSizeFilter} setTeamSizeFilter={setTeamSizeFilter}
        onAddProjectClick={handleOpenAddModal}
      />

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ProjectsOverviewEmptyIcon /></div>
          <h3>No projects added yet!</h3>
          <p>Projects once added will be shown here.</p>
          <button className="add-project-btn-primary" onClick={handleOpenAddModal}>+ Add Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Main Add/Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProject}
        mode={modalMode}
        initialData={selectedProject}
      />

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="modal-overlay">
          <div className="delete-confirm-box">
            <div className="delete-header">
              <h3>Delete Project?</h3>
              <button className="close-icon" onClick={() => setProjectToDelete(null)}>✕</button>
            </div>
            {/* Modal text uses projectToDelete.name now */}
            <p>Are you sure you want to delete project <strong>"{projectToDelete.name} {projectToDelete.acronym && `(${projectToDelete.acronym})`}"</strong>? This action cannot be undone afterwards.</p>
            <div className="delete-actions">
              <button className="btn-cancel" onClick={() => setProjectToDelete(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDeleteProject}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsOverview;