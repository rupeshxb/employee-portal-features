import React, { useState, useEffect, useRef } from 'react';
import TeamStructureSelect from './TeamStructureSelect';
import CustomScrollbar from './CustomScrollbar';
import CustomDatePicker from './CustomDatePicker';
import '../style/ProjectsOverview.css';
import '../style/ProjectModal.css';
import { CalendarInputIcon } from './Icons';

import axiosInstance from '../utils/axiosInstance';

const ProjectModal = ({ isOpen, onClose, onSubmit, mode = 'add', initialData = null }) => {
    // Tab State
    const [activeTab, setActiveTab] = useState('details');

    // Dynamic Data States
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Form & Error State
    const [formData, setFormData] = useState({
        projectName: '',
        clientName: '',
        accentColor: '#0FB7FE',
        acronym: '',
        startDate: '',
        endDate: ''
    });
    const [errors, setErrors] = useState({}); // Tracks which fields are missing

    const [teamStructure, setTeamStructure] = useState({});

    // Which custom date picker is open: 'start' | 'end' | null
    const [openPicker, setOpenPicker] = useState(null);
    const startWrapperRef = useRef(null);
    const endWrapperRef = useRef(null);
    const modalContentRef = useRef(null);

    const buildInitialFormData = () => {
        if (mode === 'edit' && initialData) {
            const safeStartDate = (initialData.start_date || initialData.startDate || '').split('T')[0];
            const safeEndDate = (initialData.end_date || initialData.endDate || '').split('T')[0];
            return {
                projectName: initialData.name || initialData.projectName || '',
                clientName: initialData.client_name || initialData.clientName || '',
                accentColor: initialData.color_code || initialData.accentColor || '#0FB7FE',
                acronym: initialData.acronym || '',
                startDate: safeStartDate,
                endDate: safeEndDate,
            };
        }
        return {
            projectName: '', clientName: '', accentColor: '#0FB7FE',
            acronym: '', startDate: '', endDate: '',
        };
    };

    const buildInitialTeamStructure = (depts) => {
        const base = {};
        depts.forEach(dept => { base[dept.id] = []; });
        if (mode === 'edit' && initialData) {
            const existing = initialData.assigned_employees_grouped || initialData.teamStructure || {};
            return { ...base, ...existing };
        }
        return base;
    };

    const handleReset = () => {
        setFormData(buildInitialFormData());
        setTeamStructure(buildInitialTeamStructure(departments));
        setErrors({});
    };

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            setErrors({}); // Clear any old errors on open

            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    const deptRes = await axiosInstance.get('/api/departments/');
                    const fetchedDepartments = deptRes.data;
                    setDepartments(fetchedDepartments);

                    const empRes = await axiosInstance.get('/api/employees/');
                    const fetchedEmployees = empRes.data.results?.employees || empRes.data || [];
                    setEmployees(fetchedEmployees);

                    const initialTeamState = {};
                    fetchedDepartments.forEach(dept => {
                        initialTeamState[dept.id] = [];
                    });

                    if (mode === 'edit' && initialData) {
                        const safeStartDate = (initialData.start_date || initialData.startDate || '').split('T')[0];
                        const safeEndDate = (initialData.end_date || initialData.endDate || '').split('T')[0];

                        setFormData({
                            projectName: initialData.name || initialData.projectName || '',
                            clientName: initialData.client_name || initialData.clientName || '',
                            accentColor: initialData.color_code || initialData.accentColor || '#0FB7FE',
                            acronym: initialData.acronym || '',
                            startDate: safeStartDate,
                            endDate: safeEndDate
                        });

                        const existingTeam = initialData.assigned_employees_grouped || initialData.teamStructure || {};
                        const loadedTeam = { ...initialTeamState, ...existingTeam };
                        setTeamStructure(loadedTeam);

                    } else {
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

    const isColorTooLight = (hex) => {
        if (!hex) return false;
        const cleaned = hex.replace('#', '');
        if (cleaned.length !== 6 && cleaned.length !== 3) return false;
        let r, g, b;
        if (cleaned.length === 3) {
            r = parseInt(cleaned[0] + cleaned[0], 16);
            g = parseInt(cleaned[1] + cleaned[1], 16);
            b = parseInt(cleaned[2] + cleaned[2], 16);
        } else {
            r = parseInt(cleaned.substring(0, 2), 16);
            g = parseInt(cleaned.substring(2, 4), 16);
            b = parseInt(cleaned.substring(4, 6), 16);
        }
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
        // Perceived brightness — white text becomes invisible on very light backgrounds
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 220;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // If user starts typing, remove the error for that specific field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Real-time check: white / near-white pill colors hide the white text
        if (name === 'accentColor' && isColorTooLight(value)) {
            setErrors(prev => ({ ...prev, accentColor: 'White or near-white colors are not allowed.' }));
        }
    };

    const handleTeamChange = (departmentId, selectedUsers) => {
        setTeamStructure(prev => ({ ...prev, [departmentId]: selectedUsers }));
    };

    const handleDatePick = (field, isoDate) => {
        setFormData(prev => ({ ...prev, [field]: isoDate }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(`${iso}T00:00:00`);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };


    const totalTeamSize = Object.values(teamStructure).reduce((acc, curr) =>
        acc + (Array.isArray(curr) ? curr.length : 0), 0);

    const handleSubmit = () => {
        // --- 1. VALIDATION CHECK ---
        const newErrors = {};
        if (!formData.projectName.trim()) newErrors.projectName = "Project name is required.";
        if (!formData.clientName.trim()) newErrors.clientName = "Client name is required.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";
        if (!formData.endDate) newErrors.endDate = "End date is required.";

        if (isColorTooLight(formData.accentColor)) {
            newErrors.accentColor = "White or near-white colors are not allowed.";
        }

        // Optional logic: Check if end date is before start date
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = "End date cannot be before start date.";
        }

        // --- 2. HANDLE VALIDATION FAILURE ---
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setActiveTab('details'); // Force switch to details tab to show the errors!
            return; // STOP execution here, do not submit!
        }

        // --- 3. PROCEED WITH SUBMISSION ---
        const assignedEmployeeIds = Object.values(teamStructure)
            .flat()
            .map(emp => typeof emp === 'object' ? emp.id : emp);

        const newProject = {
            ...formData,
            name: formData.projectName,
            client_name: formData.clientName,
            color_code: formData.accentColor,
            acronym: formData.acronym,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            teamStructure,
            totalTeamSize,
            assigned_employees: assignedEmployeeIds,
            id: mode === 'edit' ? initialData.id : undefined
        };

        onSubmit(newProject);
    };

    return (
        <div className="modal-overlay">
            <div ref={modalContentRef} className="custom-modal-content">

                {/* Header */}
                <div className="modal-header">
                    <div className="header-titles">
                        <h2>{mode === 'add' ? 'Add New Project' : 'Edit Project'}</h2>
                        <p>{mode === 'add'
                            ? 'Add new project by defining its basic details, start date.'
                            : 'Edit & update project details, timelines and team structure.'}</p>
                    </div>
                    <button type="button" className="close-modal-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Project Details
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                        disabled={isLoadingData}
                    >
                        Team Structure <span className="team-badge">{totalTeamSize}</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="pmd-modal-body">
                    <CustomScrollbar>
                        <div className="pmd-modal-body-inner">
                    {activeTab === 'details' ? (
                        <div className="project-form-grid">
                            <div className="form-group full-width">
                                <label>Project Name</label>
                                <input 
                                    type="text" 
                                    name="projectName" 
                                    placeholder="Enter project name" 
                                    value={formData.projectName} 
                                    onChange={handleInputChange} 
                                    className={errors.projectName ? 'input-error' : ''}
                                />
                                {errors.projectName && <span className="error-text">{errors.projectName}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label>Client/Company Name</label>
                                <input 
                                    type="text" 
                                    name="clientName" 
                                    placeholder="Enter client/company name" 
                                    value={formData.clientName} 
                                    onChange={handleInputChange} 
                                    className={errors.clientName ? 'input-error' : ''}
                                />
                                {errors.clientName && <span className="error-text">{errors.clientName}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label>Accent Color</label>
                                <div className={`color-input-container ${errors.accentColor ? 'input-error' : ''}`}>
                                    <div className="color-box" style={{ backgroundColor: formData.accentColor }}>
                                        <input type="color" name="accentColor" value={formData.accentColor} onChange={handleInputChange} />
                                    </div>
                                    <input type="text" name="accentColor" value={formData.accentColor.toUpperCase()} onChange={handleInputChange} />
                                </div>
                                {errors.accentColor && <span className="error-text">{errors.accentColor}</span>}
                            </div>

                            <div className="form-group full-width">
                                <label>Project Acronym <span className="optional-text">(optional)</span></label>
                                <input type="text" name="acronym" placeholder="e.g., MUS" value={formData.acronym} onChange={handleInputChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>Start Date</label>
                                    <div
                                        ref={startWrapperRef}
                                        className={`pmd-date-wrapper ${errors.startDate ? 'input-error' : ''}`}
                                        onClick={() => setOpenPicker(openPicker === 'start' ? null : 'start')}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setOpenPicker(openPicker === 'start' ? null : 'start');
                                            }
                                        }}
                                    >
                                        <span className={`pmd-date-text ${!formData.startDate ? 'pmd-empty' : ''}`}>
                                            {formData.startDate ? formatDate(formData.startDate) : 'Project Start Date'}
                                        </span>
                                        <CalendarInputIcon className="pmd-calendar-icon" />
                                        <CustomDatePicker
                                            isOpen={openPicker === 'start'}
                                            onClose={() => setOpenPicker(null)}
                                            value={formData.startDate}
                                            onChange={(iso) => handleDatePick('startDate', iso)}
                                            ignoreRef={startWrapperRef}
                                            portal
                                            boundaryRef={modalContentRef}
                                        />
                                    </div>
                                    {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                                </div>

                                <div className="form-group half-width">
                                    <label>End Date</label>
                                    <div
                                        ref={endWrapperRef}
                                        className={`pmd-date-wrapper ${errors.endDate ? 'input-error' : ''}`}
                                        onClick={() => setOpenPicker(openPicker === 'end' ? null : 'end')}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setOpenPicker(openPicker === 'end' ? null : 'end');
                                            }
                                        }}
                                    >
                                        <span className={`pmd-date-text ${!formData.endDate ? 'pmd-empty' : ''}`}>
                                            {formData.endDate ? formatDate(formData.endDate) : 'Project End Date'}
                                        </span>
                                        <CalendarInputIcon className="pmd-calendar-icon" />
                                        <CustomDatePicker
                                            isOpen={openPicker === 'end'}
                                            onClose={() => setOpenPicker(null)}
                                            value={formData.endDate}
                                            onChange={(iso) => handleDatePick('endDate', iso)}
                                            ignoreRef={endWrapperRef}
                                            portal
                                            boundaryRef={modalContentRef}
                                        />
                                    </div>
                                    {errors.endDate && <span className="error-text">{errors.endDate}</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="team-structure-wrapper">
                            {isLoadingData ? (
                                <p style={{ padding: '20px', color: '#64748B' }}>Loading team data...</p>
                            ) : departments.length > 0 ? (
                                departments.map(dept => (
                                    <TeamStructureSelect
                                        key={dept.id}
                                        label={dept.name}
                                        options={employees}
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
                    </CustomScrollbar>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button type="button" className="btn-reset" onClick={handleReset}>Reset</button>
                    <button type="button" className="btn-submit" onClick={handleSubmit}>{mode === 'add' ? 'Add Project' : 'Save Details'}</button>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;