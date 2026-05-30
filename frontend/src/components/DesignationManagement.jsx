import React, { useState, useEffect } from 'react';
import '../style/DesignationManagement.css';
import { fetchDesignations, createDesignation, updateDesignation, deleteDesignation } from '../utils/designationApi';
import { TrashIcon, PencilEditIcon, TagAddPlusIcon, DropdownSearchIcon, TagsEmptyIcon } from './Icons';
import TagStatusDropdown from './TagStatusDropdown';
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
        if (currentPage <= 3) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
        if (currentPage >= totalPages - 2) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
        return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
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
                        <p>Define employee designations and organize them under tags.</p>
                    </div>
                    <button className="add-project-btn" onClick={() => handleOpenModal()}>
                        <TagAddPlusIcon /> Add Designation
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Sub-header */}
            <div className="desig-subheader">
                <h3>Designations <span className="text-muted">(Total {designations.length})</span></h3>
            </div>

            <div className="tags-top-bar">
                <div className="search-container">
                    <span className="tags-search-icon"><DropdownSearchIcon /></span>
                    <input
                        type="text"
                        placeholder="Search designations by name"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="search-input"
                    />
                </div>
                <TagStatusDropdown statusFilter={statusFilter} setStatusFilter={(s) => { setStatusFilter(s); setCurrentPage(1); }} />
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state">Loading designations...</div>
            ) : designations.length === 0 ? (
                <div className="tags-empty-section">
                    <TagsEmptyIcon />
                    <div className="tags-empty-text">
                        <h3>No designations added yet!</h3>
                        <p>All of the designations will be shown here.</p>
                    </div>
                    <button className="tags-add-btn" onClick={() => handleOpenModal()}>
                        <TagAddPlusIcon /> Add Designation
                    </button>
                </div>
            ) : (
            <div className="desig-table-container">
                        <table className="desig-table">
                            <thead>
                                <tr>
                                    <th>DESIGNATION NAME</th>
                                    <th>DESCRIPTION</th>
                                    <th className="text-center">NO. OF EMPLOYEES</th>
                                    <th>STATUS</th>
                                    <th className="text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((desig) => (
                                        <tr key={desig.id}>
                                            <td className="desig-name-cell">{desig.name}</td>
                                            <td>{desig.description || '—'}</td>
                                            <td className="text-center">{desig.employee_count ?? 0}</td>
                                            <td>
                                                <span className={`desig-status-badge ${(desig.status || 'Active').toLowerCase()}`}>
                                                    <span className="desig-status-dot"></span>
                                                    {desig.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="action-cells">
                                                <button className="btn-icon" onClick={() => handleOpenModal(desig)} title="Edit">
                                                    <PencilEditIcon />
                                                </button>
                                                <button className="btn-icon btn-icon-danger" onClick={() => { setSelectedDesignation(desig); setIsDeleteModalOpen(true); }} title="Delete">
                                                    <TrashIcon />
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
                                <span className="pagination-text">
                                    {totalEntries === 0 ? 'No entries found' : `Showing ${(currentPage - 1) * entriesPerPage + 1} to ${Math.min(currentPage * entriesPerPage, totalEntries)} of ${totalEntries} entries`}
                                </span>
                                <div className="pagination-controls">
                                    <button className="page-btn pg-first-last" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
                                    <button className="page-btn pg-prev-next" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                    {getPageNumbers().map((p, i) =>
                                        p === '…'
                                            ? <span key={`dots-${i}`} className="pg-dots">…</span>
                                            : <button key={p} className={`page-btn pg-number${p === currentPage ? ' active' : ''}${p === currentPage + 1 ? ' next-to-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                                    )}
                                    <button className="page-btn pg-prev-next" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                    <button className="page-btn pg-first-last" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
                                </div>
                            </div>
                        )}
            </div>
            )}

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
