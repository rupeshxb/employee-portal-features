import React, { useState } from 'react';
import '../style/ProjectsOverview.css';
import { ProjectsOverviewEmptyIcon } from './Icons';
import ProjectsOverviewFilterBar from './ProjectsOverviewFilterBar';
import ProjectModal from './ProjectModal';
import ProjectCard from './ProjectCard';

const ProjectsOverview = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('hamrosalary_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProject, setSelectedProject] = useState(null); // Data for editing
  
  // Delete Confirmation States
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [teamSizeFilter, setTeamSizeFilter] = useState('All');

  // --- Handlers for Add/Edit Form ---
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setModalMode('edit');
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = (projectData) => {
    let updatedProjects;
    
    if (modalMode === 'add') {
      updatedProjects = [...projects, projectData];
      setNotification(`Project ${projectData.projectName} added successfully.`);
    } else {
      updatedProjects = projects.map(p => p.id === projectData.id ? projectData : p);
      setNotification(`Project ${projectData.projectName} updated successfully.`);
    }

    setProjects(updatedProjects);
    localStorage.setItem('hamrosalary_projects', JSON.stringify(updatedProjects));
    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Handlers for Delete ---
  const handleOpenDeleteConfirm = (project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
    
    setProjects(updatedProjects);
    localStorage.setItem('hamrosalary_projects', JSON.stringify(updatedProjects));
    setProjectToDelete(null); // Close delete modal
    
    setNotification(`Project deleted successfully.`);
    setTimeout(() => setNotification(null), 3000);
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
             <p>Are you sure you want to delete project <strong>"{projectToDelete.projectName} {projectToDelete.acronym && `(${projectToDelete.acronym})`}"</strong>? This action cannot be undone afterwards.</p>
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