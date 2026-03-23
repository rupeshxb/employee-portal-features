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
    setSelectedProject({
      ...project,
      projectName: project.name,
      clientName: project.client_name,     // FIXED
      accentColor: project.color_code,     // FIXED
      startDate: project.start_date,
      endDate: project.end_date,
      acronym: project.acronym,
      teamStructure: project.team_structure || project.teamStructure,
    });
    setIsModalOpen(true);
  };

  // --- Save directly to Django Database ---
  // --- Save directly to Django Database ---
  const handleSaveProject = async (projectData) => {
    try {
      const isAddMode = modalMode === 'add';
      const method = isAddMode ? 'POST' : 'PUT';
      const endpoint = isAddMode
        ? `${API_URL}/api/projects/`
        : `${API_URL}/api/projects/${projectData.id}/`;

      // 1. Clean the payload: Only send what Django actually expects
      const djangoPayload = {
          name: projectData.name,
          client_name: projectData.client_name,
          color_code: projectData.color_code,
          acronym: projectData.acronym,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          assigned_employees: projectData.assigned_employees // Array of IDs [1, 2, 5]
      };

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${localStorage.getItem('token')}` // Matching your existing auth format
        },
        body: JSON.stringify(djangoPayload) // Send the cleaned payload
      });

      if (response.ok) {
        const savedProject = await response.json();

        if (isAddMode) {
          setProjects([...projects, savedProject]);
          setNotification(`Project ${savedProject.name} added successfully.`);
        } else {
          setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
          setNotification(`Project ${savedProject.name} updated successfully.`);
        }

        setIsModalOpen(false);
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        console.error("Server rejected the project data:", errorData);
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

  // --- FILTERING LOGIC ---
  const filteredProjects = projects.filter((project) => {
    // 1. Search Term Filter (checks project name or acronym)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      project.name?.toLowerCase().includes(searchLower) || 
      project.acronym?.toLowerCase().includes(searchLower) ||
      project.client_name?.toLowerCase().includes(searchLower);

    // 2. Team Size Filter
    let matchesTeamSize = true;
    const teamSize = project.assigned_employees ? project.assigned_employees.length : 0;
    
    if (teamSizeFilter === 'Small (1-5)') {
      matchesTeamSize = teamSize >= 1 && teamSize <= 5;
    } else if (teamSizeFilter === 'Medium (6-10)') {
      matchesTeamSize = teamSize >= 6 && teamSize <= 10;
    } else if (teamSizeFilter === 'Large (10+)') {
      matchesTeamSize = teamSize > 10;
    }

    // 3. Date Range Filter (Checks if the project overlaps with the selected range)
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const filterStart = new Date(dateRange.start);
      const filterEnd = new Date(dateRange.end);
      const projStart = new Date(project.start_date);
      const projEnd = new Date(project.end_date);

      // Check for valid dates, then see if the project overlaps with the filter range
      if (!isNaN(projStart) && !isNaN(projEnd)) {
        matchesDate = projStart <= filterEnd && projEnd >= filterStart;
      }
    }

    return matchesSearch && matchesTeamSize && matchesDate;
  });

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

      {/* Show empty state if NO projects exist at all, OR if filters hide them all */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ProjectsOverviewEmptyIcon /></div>
          <h3>No projects added yet!</h3>
          <p>Projects once added will be shown here.</p>
          <button className="add-project-btn-primary" onClick={handleOpenAddModal}>+ Add Project</button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <h3>No matching projects</h3>
          <p>Try adjusting your search or filters.</p>
          <button className="add-project-btn-primary" onClick={() => {
             setSearchTerm(''); 
             setTeamSizeFilter('All'); 
             setDateRange({start: '', end: ''});
          }}>Clear Filters</button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((proj) => (
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