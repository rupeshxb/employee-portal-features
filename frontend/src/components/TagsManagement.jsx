import React, { useState, useEffect } from 'react';
import '../style/TagsManagement.css';
import { fetchTags, fetchDesignations, createTag, updateTag, deleteTag } from '../utils/tagsApi';

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
                    <button className="add-project-btn" onClick={() => handleOpenModal()}>
                        + Add Tag
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="tags-subheader">
                <h3>Tags <span className="text-muted">(Total {tags.length})</span></h3>
            </div>

            <div className="tags-top-bar">
                <div className="search-container">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text" placeholder="Search tags by name"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <TagStatusDropdown statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            </div>

            <div className="tags-table-container">
                <TagsTable 
                    tags={currentTags} 
                    loading={loading} 
                    onEdit={handleOpenModal} 
                    onDelete={(tag) => { setSelectedTag(tag); setIsDeleteModalOpen(true); }} 
                    onAddTag={() => handleOpenModal()}
                />

                {!loading && tags.length > 0 && currentTags.length > 0 && (
                    <div className="pagination-footer">
                        <span className="showing-text">
                            Showing <strong>{(currentPage - 1) * entriesPerPage + 1}</strong> to <strong>{Math.min(currentPage * entriesPerPage, totalEntries)}</strong> of <strong>{totalEntries}</strong> entries
                        </span>
                        <div className="pagination-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>&lt;</button>
                            <button className="page-num active">{currentPage}</button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>&gt;</button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
                        </div>
                    </div>
                )}
            </div>

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