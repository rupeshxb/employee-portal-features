import React, { useState, useEffect } from 'react';
import '../style/ProjectsOverview.css';
import { ProjectsOverviewEmptyIcon, NoResultsIllustration, ToastSuccessIcon } from './Icons';
import ProjectsOverviewFilterBar from './ProjectsOverviewFilterBar';
import ProjectModal from './ProjectModal';
import ProjectCard from './ProjectCard';

// Define your Render backend URL (falls back to localhost for local development)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProjectsOverview = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true); // Ensure loading is true when we start
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
      } finally {
        setIsLoading(false); // <-- NEW: Stop loading no matter what happens
      }
    };
    fetchProjects();

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/departments/`, {
          headers: { 'Authorization': `token ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          setDepartments(await response.json());
        }
      } catch (error) {
        console.error("Network error fetching departments:", error);
      }
    };
    fetchDepartments();
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
      teamStructure: project.assigned_employees_grouped || {},
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
          setNotification(
            <>Project <strong>{savedProject.name}</strong> added successfully.</>
          );
        } else {
          setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
          setNotification(
            <>Project <strong>{savedProject.name}</strong> edited successfully.</>
          );
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
        const deletedName = projectToDelete.name;
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
        setNotification(
          <>Project <strong>{deletedName}</strong> deleted successfully.</>
        );
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
          <div className="success-toast-content">
            <span className="success-toast-icon"><ToastSuccessIcon /></span>
            <span className="success-toast-text">{notification}</span>
            <button className="success-toast-close" onClick={() => setNotification(null)} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="success-toast-progress"></div>
        </div>
      )}

      {/* Header renders immediately */}
      <div className="page-header">
        <div className="header-decor hero-circle-1"></div>
        <div className="header-decor hero-circle-2"></div>
        <div className="header-decor hero-circle-3"></div>
        <div className="projects-header-inner">
          <div className="header-text">
            <h2>Projects Overview</h2>
            <p>View and manage all ongoing projects, teams, and allocations in one place.</p>
          </div>
          <button className="add-project-btn" onClick={handleOpenAddModal}>+ Add Project</button>
        </div>
      </div>

      {/* Filters render immediately */}
      <ProjectsOverviewFilterBar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        dateRange={dateRange} setDateRange={setDateRange}
        teamSizeFilter={teamSizeFilter} setTeamSizeFilter={setTeamSizeFilter}
        onAddProjectClick={handleOpenAddModal}
      />

      {/* --- LOADING & PROJECTS DISPLAY AREA --- */}
      {isLoading ? (
        <div className="po-loading">
          <div className="custom-spinner"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="no-results">
          <ProjectsOverviewEmptyIcon />
          <div className="no-results-text">
            <h3>No projects added yet!</h3>
            <p>Projects once added will be shown here.</p>
          </div>
          <button className="add-project-btn-primary" onClick={handleOpenAddModal}>+ Add Project</button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="no-results">
          <NoResultsIllustration />
          <div className="no-results-text">
            <h3>No results found!</h3>
            <p>Try again with a different keyword.</p>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              departments={departments}
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
            <button className="close-icon" onClick={() => setProjectToDelete(null)} aria-label="Close">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 5.5L5.5 16.5M5.5 5.5L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="delete-header">
              <h3>Delete Project?</h3>
            </div>
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