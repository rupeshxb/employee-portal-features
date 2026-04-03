import React from 'react';
import '../style/TagsTable.css';

const TagsTable = ({ tags, totalTagsCount, loading, onEdit, onDelete, onAddTag }) => {
    if (loading) {
        return <div className="loading-state">Loading tags...</div>;
    }

    // Global empty state: Absolutely no tags exist in the system yet
    if (totalTagsCount === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                </div>
                <h3>No tags added yet!</h3>
                <p>All of the added tags will be shown here.</p>
                <button className="btn-primary mt-3" onClick={onAddTag}>+ Add Tag</button>
            </div>
        );
    }

    // Otherwise, render the table (even if filtered tags are empty)
    return (
        <table className="tags-table">
            <thead>
                <tr>
                    <th>TAG NAME</th>
                    <th>DESCRIPTION</th>
                    <th>COLOR</th>
                    <th>DESIGNATIONS</th>
                    <th>STATUS</th>
                    <th className="text-center">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {tags.length > 0 ? (
                    tags.map((tag) => (
                        <tr key={tag.id}>
                            <td className="font-medium tag-name-cell">{tag.display_name}</td>
                            <td className="text-muted">{tag.description || '-'}</td>
                            <td>
                                <div className="color-dot" style={{ backgroundColor: tag.color }}></div>
                            </td>
                            <td>
                                <div className="designation-badges">
                                    {tag.designations.slice(0, 2).map(desig => (
                                        <span key={desig.id} className="badge">{desig.name}</span>
                                    ))}
                                    {tag.designations.length > 2 && (
                                        <span className="badge badge-overflow">+{tag.designations.length - 2}</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={`status-badge ${tag.status.toLowerCase()}`}>
                                    <span className="status-dot"></span>{tag.status}
                                </div>
                            </td>
                            <td className="action-cells">
                                <button className="btn-icon" onClick={() => onEdit(tag)} title="Edit Tag">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button className="btn-icon" onClick={() => onDelete(tag)} title="Delete Tag">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    /* Filtered empty state */
                    <tr>
                        <td colSpan="6" className="text-center empty-cell" style={{ padding: '32px' }}>
                            No tags match your search or filter.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default TagsTable;