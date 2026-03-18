import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TeamStructureSelect from './TeamStructureSelect';
import '../style/ProjectsOverview.css';
import '../style/ProjectModal.css';
import { API_BASE_URL } from '../../config';

const ProjectModal = ({ isOpen, onClose, onSubmit, mode = 'add', initialData = null }) => {
    // Tab State
    const [activeTab, setActiveTab] = useState('details');

    // Dynamic Data States
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        projectName: initialData?.projectName || '',
        clientName: initialData?.clientName || '',
        accentColor: initialData?.accentColor || '#0FB7FE',
        acronym: initialData?.acronym || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || ''
    });

    // Dynamic Team Structure State (Keys will be department IDs)
    const [teamStructure, setTeamStructure] = useState({});

    // Watch for modal open/close to fetch real data
    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');

            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    const token = localStorage.getItem('access_token');
                    const headers = { Authorization: `Bearer ${token}` };

                    // 1. Fetch Departments
                    const deptRes = await axios.get(`${API_BASE_URL}/api/departments/`, { headers });
                    const fetchedDepartments = deptRes.data;
                    setDepartments(fetchedDepartments);

                    // 2. Fetch Employees
                    const empRes = await axios.get(`${API_BASE_URL}/api/employees/`, { headers });
                    // Handle pagination wrapper if it exists (based on your JSON structure)
                    const fetchedEmployees = empRes.data.results?.employees || empRes.data || [];
                    setEmployees(fetchedEmployees);

                    // 3. Initialize the team structure dictionary based on real departments
                    const initialTeamState = {};
                    fetchedDepartments.forEach(dept => {
                        initialTeamState[dept.id] = [];
                    });

                    if (mode === 'edit' && initialData) {
                        setFormData({
                            projectName: initialData.projectName || '',
                            clientName: initialData.clientName || '',
                            accentColor: initialData.accentColor || '#0FB7FE',
                            acronym: initialData.acronym || '',
                            startDate: initialData.startDate || '',
                            endDate: initialData.endDate || ''
                        });
                        setTeamStructure(initialData.teamStructure || initialTeamState);
                    } else {
                        // Clear form for 'add' mode
                        setFormData({
                            projectName: '', clientName: '', accentColor: '#0FB7FE',
                            acronym: '', startDate: '', endDate: ''
                        });
                        setTeamStructure(initialTeamState);
                    }
                } catch (error) {
                    console.error("Error fetching modal data:", error);
                } finally {
                    setIsLoadingData(false);
                }
            };

            fetchData();
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleTeamChange = (departmentId, selectedUsers) => {
        setTeamStructure(prev => ({ ...prev, [departmentId]: selectedUsers }));
    };

    // Calculate total team size for the badge
    const totalTeamSize = Object.values(teamStructure).reduce((acc, curr) => acc + curr.length, 0);

    const handleSubmit = () => {
        // Flatten the team members into an array of IDs for Django's ManyToManyField
        const assignedEmployeeIds = Object.values(teamStructure)
            .flat()
            .map(emp => emp.id);

        const newProject = {
            ...formData, 
            
            // --- PERFECT MATCH FOR DJANGO ---
            name: formData.projectName,            
            client_name: formData.clientName,     
            color_code: formData.accentColor,     
            acronym: formData.acronym,
            start_date: formData.startDate || null,       
            end_date: formData.endDate || null,
            
            // Raw structure for frontend reference if needed
            teamStructure,
            totalTeamSize,

            // IMPORTANT: Flattened array of IDs to send to Django!
            assigned_employees: assignedEmployeeIds, 
            
            id: mode === 'edit' ? initialData.id : undefined 
        };
        
        onSubmit(newProject);
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
                        disabled={isLoadingData}
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
                            {isLoadingData ? (
                                <p style={{ padding: '20px', color: '#64748B' }}>Loading team data...</p>
                            ) : departments.length > 0 ? (
                                // Dynamically render a select dropdown for every department from your database
                                departments.map(dept => (
                                    <TeamStructureSelect
                                        key={dept.id}
                                        label={dept.name}
                                        options={employees} 
                                        // Optional: To only show employees that belong to this dept comment the above line, and uncomment the below one
                                        // options={employees.filter(emp => emp.department_name === dept.name)}
                                        selected={teamStructure[dept.id] || []}
                                        onChange={(users) => handleTeamChange(dept.id, users)}
                                    />
                                ))
                            ) : (
                                <p style={{ padding: '20px', color: '#64748B' }}>No departments found.</p>
                            )}
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