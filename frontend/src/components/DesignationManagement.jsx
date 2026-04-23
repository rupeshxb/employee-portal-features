import React, { useState, useEffect } from 'react';
import '../style/DesignationManagement.css';
import { fetchDesignations, createDesignation, updateDesignation, deleteDesignation } from '../utils/designationApi';
import DesignationAddEditModal from './DesignationAddEditModal';
import DesignationDeleteModal from './DesignationDeleteModal';

const DesignationManagement = () => {
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 8;

    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDesignation, setSelectedDesignation] = useState(null);

    useEffect(() => {
        loadDesignations();
    }, []);

    const loadDesignations = async () => {
        try {
            setLoading(true);
            const data = await fetchDesignations();
            setDesignations(data.results || data || []);
        } catch (err) {
            setError('Failed to load designations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filtered = designations.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
    const currentItems = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages - 1, totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, 2, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, 2, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1, totalPages);
        }
        return pages;
    };

    const handleOpenModal = (designation = null) => {
        setSelectedDesignation(designation);
        setIsAddEditModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (selectedDesignation) {
                await updateDesignation(selectedDesignation.id, formData);
            } else {
                await createDesignation(formData);
            }
            setIsAddEditModalOpen(false);
            loadDesignations();
        } catch (err) {
            alert('An error occurred while saving the designation.');
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteDesignation(selectedDesignation.id);
            setIsDeleteModalOpen(false);
            setSelectedDesignation(null);
            loadDesignations();
        } catch (err) {
            alert('Failed to delete designation.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="designation-management-page">
            {/* Page Header Banner */}
            <div className="page-header">
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
                <div className="projects-header-inner">
                    <div className="header-text">
                        <h2>Designations Management</h2>
                        <p>Create and manage employee designations for your organisation.</p>
                    </div>
                    <button className="add-project-btn" onClick={() => handleOpenModal()}>
                        + Add Designation
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Sub-header */}
            <div className="desig-subheader">
                <h3>Designations <span className="text-muted">(Total {designations.length})</span></h3>
            </div>

            {/* Search bar */}
            <div className="desig-top-bar">
                <div className="search-container">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search designations by name"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="search-input"
                    />
                </div>
                <select
                    className="desig-status-filter"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                    <option value="All Status">⊙ All Status</option>
                    <option value="Active">● Active</option>
                    <option value="Inactive">● Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="desig-table-container">
                {loading ? (
                    <div className="loading-state">Loading designations...</div>
                ) : designations.length === 0 ? (
                    <div className="desig-empty-state">
                        <div className="empty-icon">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        </div>
                        <h3>No designations added yet!</h3>
                        <p>All designations will be shown here once added.</p>
                        <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Designation</button>
                    </div>
                ) : (
                    <>
                        <table className="desig-table">
                            <thead>
                                <tr>
                                    <th>DESIGNATION NAME</th>
                                    <th>DESCRIPTION</th>
                                    <th>NO. OF EMPLOYEES</th>
                                    <th>STATUS</th>
                                    <th className="text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((desig) => (
                                        <tr key={desig.id}>
                                            <td className="desig-name-cell">{desig.name}</td>
                                            <td className="text-muted">{desig.description || '—'}</td>
                                            <td className="text-muted">{desig.employee_count ?? 0}</td>
                                            <td>
                                                <span className={`desig-status-badge ${(desig.status || 'Active').toLowerCase()}`}>
                                                    <span className="desig-status-dot"></span>
                                                    {desig.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="action-cells">
                                                <button className="btn-icon" onClick={() => handleOpenModal(desig)} title="Edit">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button className="btn-icon btn-icon-danger" onClick={() => { setSelectedDesignation(desig); setIsDeleteModalOpen(true); }} title="Delete">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center empty-cell" style={{ padding: '32px' }}>
                                            No designations match your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {currentItems.length > 0 && (
                            <div className="pagination-footer">
                                <span className="showing-text">
                                    Showing <strong>{(currentPage - 1) * entriesPerPage + 1}</strong> to <strong>{Math.min(currentPage * entriesPerPage, totalEntries)}</strong> of <strong>{totalEntries}</strong> entries
                                </span>
                                <div className="pagination-controls">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
                                    {getPageNumbers().map((p, i) =>
                                        p === '...'
                                            ? <span key={`dots-${i}`} className="page-dots">...</span>
                                            : <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => setCurrentPage(p)}>{p}</button>
                                    )}
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DesignationAddEditModal
                isOpen={isAddEditModalOpen}
                onClose={() => setIsAddEditModalOpen(false)}
                onSubmit={handleFormSubmit}
                designation={selectedDesignation}
            />

            <DesignationDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                designation={selectedDesignation}
            />
        </div>
    );
};

export default DesignationManagement;
