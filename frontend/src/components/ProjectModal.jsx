import React, { useState, useEffect } from 'react';
import TeamStructureSelect from './TeamStructureSelect';
import '../style/ProjectsOverview.css';
import '../style/ProjectModal.css';

// 1. Mock Data defined OUTSIDE the component
const TEAM_MEMBERS = [
    { id: 1, name: 'Sachin K.', avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'Priyanka R.', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, name: 'Jasmine P.', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: 4, name: 'Diwakar J.', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 5, name: 'Aisha K.', avatar: 'https://i.pravatar.cc/150?img=20' },
    { id: 6, name: 'Marco T.', avatar: 'https://i.pravatar.cc/150?img=33' },
    { id: 7, name: 'Selina P.', avatar: 'https://i.pravatar.cc/150?img=41' },
    { id: 8, name: 'Haruto Y.', avatar: 'https://i.pravatar.cc/150?img=52' },
];

const ProjectModal = ({ isOpen, onClose, onSubmit, mode = 'add', initialData = null }) => {
    // Tab State
    const [activeTab, setActiveTab] = useState('details');

    // Form State
    const [formData, setFormData] = useState({
        projectName: initialData?.projectName || '',
        clientName: initialData?.clientName || '',
        accentColor: initialData?.accentColor || '#0FB7FE',
        acronym: initialData?.acronym || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || ''
    });

    // Team Structure State
    const [teamStructure, setTeamStructure] = useState({
        frontend: [],
        backend: [],
        uiux: [],
        qa: [],
        pm: [],
        ba: []
    });

    // Watch for modal open/close and mode changes to populate data correctly
    useEffect(() => {
        if (isOpen) {
            setActiveTab('details'); // Reset to first tab
            if (mode === 'edit' && initialData) {
                setFormData({
                    projectName: initialData.projectName || '',
                    clientName: initialData.clientName || '',
                    accentColor: initialData.accentColor || '#0FB7FE',
                    acronym: initialData.acronym || '',
                    startDate: initialData.startDate || '',
                    endDate: initialData.endDate || ''
                });
                setTeamStructure(initialData.teamStructure || {
                    frontend: [], backend: [], uiux: [], qa: [], pm: [], ba: []
                });
            } else {
                // Clear form for 'add' mode
                setFormData({
                    projectName: '', clientName: '', accentColor: '#0FB7FE',
                    acronym: '', startDate: '', endDate: ''
                });
                setTeamStructure({ frontend: [], backend: [], uiux: [], qa: [], pm: [], ba: [] });
            }
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleTeamChange = (category, selectedUsers) => {
        setTeamStructure(prev => ({ ...prev, [category]: selectedUsers }));
    };

    // Calculate total team size for the badge
    const totalTeamSize = Object.values(teamStructure).reduce((acc, curr) => acc + curr.length, 0);

    const handleSubmit = () => {
        // Translate React's camelCase state into Django's expected snake_case model fields
        const newProject = {
            // Keep original frontend data just in case your React app needs it locally
            ...formData, 
            
            // --- THE TRANSLATION FOR DJANGO ---
            name: formData.projectName,           // Fixes: "This field is required."
            client: formData.clientName,          // Guessing Django calls it 'client'
            start_date: formData.startDate,       // Django usually wants snake_case dates
            end_date: formData.endDate,           // Django usually wants snake_case dates
            accent_color: formData.accentColor,   // Django usually wants snake_case
            
            teamStructure,
            totalTeamSize,
            // If adding a new project, don't send a fake Date.now() ID to Django. 
            // Let the database auto-generate the real ID.
            id: mode === 'edit' ? initialData.id : undefined 
        };

        // Send it back to the main page (which makes the fetch/axios call)
        onSubmit(newProject);

        // Reset the form for the next time it opens
        setFormData({
            projectName: '', clientName: '', accentColor: '#0FB7FE',
            acronym: '', startDate: '', endDate: ''
        });
        setTeamStructure({ frontend: [], backend: [], uiux: [], qa: [], pm: [], ba: [] });
    };

    return (
        <div className="modal-overlay">
            <div className="custom-modal-content">

                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>{mode === 'add' ? 'Add New Project' : 'Edit Project'}</h2>
                        <p>{mode === 'add'
                            ? 'Add new project by defining its basic details, start date.'
                            : 'Edit & update project details, timelines and team structure.'}</p>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Project Details
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        Team Structure {totalTeamSize > 0 && <span className="team-badge">{totalTeamSize}</span>}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="modal-body">
                    {activeTab === 'details' ? (
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Project Name</label>
                                <input type="text" name="projectName" placeholder="Enter project name" value={formData.projectName} onChange={handleInputChange} />
                            </div>

                            <div className="form-group full-width">
                                <label>Client/Company Name</label>
                                <input type="text" name="clientName" placeholder="Enter client/company name" value={formData.clientName} onChange={handleInputChange} />
                            </div>

                            <div className="form-group full-width">
                                <label>Accent Color</label>
                                <div className="color-picker-wrapper">
                                    <div className="color-preview" style={{ backgroundColor: formData.accentColor }}>
                                        <input type="color" name="accentColor" value={formData.accentColor} onChange={handleInputChange} />
                                    </div>
                                    <input type="text" name="accentColor" value={formData.accentColor.toUpperCase()} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Project Acronym (optional)</label>
                                <input type="text" name="acronym" placeholder="e.g., MUS" value={formData.acronym} onChange={handleInputChange} />
                            </div>

                            <div className="form-group half-width">
                                <label>Start Date</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                            </div>

                            <div className="form-group half-width">
                                <label>End Date</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="team-structure-wrapper">
                            <TeamStructureSelect
                                label="Front-end Developers"
                                options={TEAM_MEMBERS}
                                selected={teamStructure.frontend}
                                onChange={(users) => handleTeamChange('frontend', users)}
                            />
                            <TeamStructureSelect
                                label="Back-end Developers"
                                options={TEAM_MEMBERS}
                                selected={teamStructure.backend}
                                onChange={(users) => handleTeamChange('backend', users)}
                            />
                            <TeamStructureSelect
                                label="UI/UX"
                                options={TEAM_MEMBERS}
                                selected={teamStructure.uiux}
                                onChange={(users) => handleTeamChange('uiux', users)}
                            />
                            <TeamStructureSelect
                                label="QA"
                                options={TEAM_MEMBERS}
                                selected={teamStructure.qa}
                                onChange={(users) => handleTeamChange('qa', users)}
                            />
                            <TeamStructureSelect
                                label="Project Manager"
                                options={TEAM_MEMBERS}
                                selected={teamStructure.pm}
                                onChange={(users) => handleTeamChange('pm', users)}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-reset" onClick={onClose}>Cancel</button>
                    <button className="btn-submit" onClick={handleSubmit}>{mode === 'add' ? 'Add Project' : 'Save Details'}</button>
                </div>

            </div>
        </div>
    );
};

export default ProjectModal;