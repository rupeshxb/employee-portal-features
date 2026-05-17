import React from 'react';
import '../style/TagsTable.css';
import { TrashIcon, PencilEditIcon } from './Icons';

const TagsTable = ({ tags, loading, onEdit, onDelete }) => {
    if (loading) {
        return <div className="loading-state">Loading tags...</div>;
    }

    return (
        <table className="tags-table">
            <thead>
                <tr>
                    <th>TAG NAME</th>
                    <th>DESCRIPTION</th>
                    <th>COLOR</th>
                    <th>DESIGNATIONS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {tags.length > 0 ? (
                    tags.map((tag) => (
                        <tr key={tag.id}>
                            <td className="font-medium tag-name-cell">{tag.display_name}</td>
                            <td className="description-cell">
                                <div className="description-text text-muted">{tag.description || '-'}</div>
                            </td>
                            <td>
                                <div className="color-dot" style={{ backgroundColor: tag.color }}></div>
                            </td>
                            <td>
                                <div className="designation-badges">
                                    <div className="badge-row">
                                        {tag.designations.slice(0, 2).map(d => (
                                            <span key={d.id} className="badge">{d.name}</span>
                                        ))}
                                    </div>
                                    {tag.designations.length > 2 && (
                                        <div className="badge-row">
                                            <span className="badge">{tag.designations[2].name}</span>
                                            {tag.designations.length > 3 && (
                                                <span className="badge badge-overflow">+{tag.designations.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={`status-badge ${tag.status.toLowerCase()}`}>
                                    <span className="status-dot"></span>{tag.status}
                                </div>
                            </td>
                            <td className="tags-action-cell">
                                <div className="tags-action-buttons">
                                    <button className="tags-btn-icon" onClick={() => onEdit(tag)} title="Edit Tag">
                                        <PencilEditIcon />
                                    </button>
                                    <button className="tags-btn-icon tags-btn-icon-danger" onClick={() => onDelete(tag)} title="Delete Tag">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
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
