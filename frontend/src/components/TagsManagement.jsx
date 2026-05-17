import React, { useState, useEffect } from 'react';
import '../style/TagsManagement.css';
import { fetchTags, fetchDesignations, createTag, updateTag, deleteTag } from '../utils/tagsApi';
import { TagAddPlusIcon, TagsEmptyIcon, DropdownSearchIcon } from './Icons';

// Subcomponents
import TagStatusDropdown from './TagStatusDropdown';
import TagAddEditModal from './TagAddEditModal';
import TagDeleteModal from './TagDeleteModal';
import TagsTable from './TagsTable';

const TagsManagement = () => {
    // Data State
    const [tags, setTags] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 8;

    // Modal States
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [tagsRes, desigRes] = await Promise.all([fetchTags(), fetchDesignations()]);
            setTags(tagsRes.results || tagsRes || []);
            setDesignations(desigRes.results || desigRes || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError('Failed to load tags. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filtering Logic
    const filteredTags = tags.filter(tag => {
        const matchesSearch = tag.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'All Status' || tag.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalEntries = filteredTags.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
    const currentTags = filteredTags.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
        if (currentPage >= totalPages - 2) return [1, 2, 3, '…', totalPages - 2, totalPages - 1, totalPages];
        return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
    };

    // Handlers
    const handleOpenModal = (tag = null) => {
        setSelectedTag(tag);
        setIsAddEditModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (selectedTag) {
                await updateTag(selectedTag.id, formData);
            } else {
                await createTag(formData);
            }
            setIsAddEditModalOpen(false);
            loadInitialData();
        } catch (err) {
            console.error("Failed to save tag:", err);
            alert("An error occurred while saving the tag.");
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteTag(selectedTag.id);
            setIsDeleteModalOpen(false);
            setSelectedTag(null);
            loadInitialData();
        } catch (err) {
            console.error("Failed to delete tag:", err);
            alert("Failed to delete tag.");
        }
    };

    return (
        <div className="tags-management-page">
            <div className="page-header">
                <div className="header-decor hero-circle-1"></div>
                <div className="header-decor hero-circle-2"></div>
                <div className="header-decor hero-circle-3"></div>
                <div className="projects-header-inner">
                    <div className="header-text">
                        <h2>Tags Management</h2>
                        <p>Create and manage employee groups, designations using tags.</p>
                    </div>
                    <button className="tags-add-btn tags-add-btn-dark" onClick={() => handleOpenModal()}>
                        <TagAddPlusIcon /> Add Tag
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="tags-subheader">
                <h3>Tags <span className="text-muted">(Total {tags.length})</span></h3>
            </div>

            <div className="tags-top-bar">
                <div className="search-container">
                    <span className="tags-search-icon"><DropdownSearchIcon /></span>
                    <input
                        type="text" placeholder="Search tags by name"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <TagStatusDropdown statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            </div>

            {!loading && tags.length === 0 ? (
                <div className="tags-empty-section">
                    <TagsEmptyIcon />
                    <div className="tags-empty-text">
                        <h3>No tags added yet!</h3>
                        <p>All of the added tags will be shown here.</p>
                    </div>
                    <button className="tags-add-btn" onClick={() => handleOpenModal()}>
                        <TagAddPlusIcon /> Add Tag
                    </button>
                </div>
            ) : (
            <div className="tags-table-container">
                <TagsTable
                    tags={currentTags}
                    loading={loading}
                    onEdit={handleOpenModal}
                    onDelete={(tag) => { setSelectedTag(tag); setIsDeleteModalOpen(true); }}
                    onAddTag={() => handleOpenModal()}
                />

                {!loading && tags.length > 0 && (
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

            <TagAddEditModal 
                isOpen={isAddEditModalOpen} 
                onClose={() => setIsAddEditModalOpen(false)} 
                onSubmit={handleFormSubmit} 
                tag={selectedTag} 
                designations={designations} 
            />

            <TagDeleteModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={confirmDelete} 
                tag={selectedTag} 
            />
        </div>
    );
};

export default TagsManagement;