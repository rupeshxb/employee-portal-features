import React, { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Camera, User, Mail, Edit2, X, Briefcase } from 'lucide-react';
import '../style/Settings.css';
import { API_BASE_URL } from '../../config';

const Settings = () => {
    const [message, setMessage] = useState({ text: '', type: '' });
    const [profile, setProfile] = useState({
        first_name: '', last_name: '', email: '', designation: '', avatar: null
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [scale, setScale] = useState(1.2);
    const editorRef = useRef(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, [token]);

    const fetchProfile = () => {
        const headers = token ? { 'Authorization': `Token ${token}` } : {};
        fetch(`${API_BASE_URL}/api/profile/`, { headers })
            .then(res => res.json())
            .then(data => setProfile(data))
            .catch(err => console.error(err));
    };

    const getImageUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http')) return avatarPath;
        return `${API_BASE_URL}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
    };

    const getInitials = (first, last) => {
        return ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase();
    };

    const handleTextSave = () => {
        const formData = new FormData();
        formData.append('first_name', profile.first_name);
        formData.append('last_name', profile.last_name);
        fetch(`${API_BASE_URL}/api/profile/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Token ${token}` },
            body: formData
        }).then(res => {
            if (res.ok) {
                setMessage({ text: 'Details saved successfully!', type: 'success' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        });
    };

    const handleImageSave = () => {
        if (editorRef.current) {
            const canvas = editorRef.current.getImageScaledToCanvas();
            canvas.toBlob(blob => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('avatar', blob, 'profile.jpg');
                    fetch(`${API_BASE_URL}/api/profile/`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Token ${token}` },
                        body: formData
                    }).then(res => {
                        if (res.ok) {
                            setIsProfileModalOpen(false);
                            fetchProfile();
                        }
                    });
                }
            });
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            setIsProfileModalOpen(true);
        }
    };

    return (
        <div className="settings-container">
            {/* Header Section */}
            <div className="settings-header">
                <div className="header-content">
                    <h1>Settings</h1>
                    <p>Manage your personal details, salary preferences, and notification settings.</p>
                </div>
                <div className="header-decor bubble-large"></div>
                <div className="header-decor bubble-small"></div>
                <div className="header-decor bubble-mini"></div>
            </div>

            {message.text && <div className={`alert-toast ${message.type}`}>{message.text}</div>}

            {/* Main Grid Card */}
            <div className="settings-card">

                {/* --- LEFT PANEL --- */}
                <div className="card-left">
                    {/* Header Part */}
                    <div className="panel-header">
                        <h3>Employee Profile</h3>
                    </div>
                    {/* Content Part */}
                    <div className="panel-body">
                        <div className="avatar-section">
                            <div className="avatar-wrapper">
                                {getImageUrl(profile.avatar) ? (
                                    <img src={getImageUrl(profile.avatar)} alt="Profile" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {getInitials(profile.first_name, profile.last_name)}
                                    </div>
                                )}
                                {/* Camera Button: Positioned Top Right via CSS */}
                                <label className="camera-btn">
                                    <Camera size={20} color="white" />
                                    <input type="file" hidden onChange={handleFileChange} />
                                </label>
                            </div>
                            <h2 className="user-fullname">{profile.first_name} {profile.last_name}</h2>
                        </div>

                        <div className="info-list">
                            {/* Boxed Info Item 1 */}
                            <div className="info-item-box">
                                <div className="icon-box"><Briefcase size={18} /></div>
                                <div className="info-content">
                                    <span className="label">Designation</span>
                                    <p className="value">{profile.designation || 'Full Stack Developer'}</p>
                                </div>
                            </div>
                            {/* Boxed Info Item 2 */}
                            <div className="info-item-box">
                                <div className="icon-box"><Mail size={18} /></div>
                                <div className="info-content">
                                    <span className="label">Work Email</span>
                                    <p className="value" title={profile.email}>{profile.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL --- */}
                <div className="card-right">
                    {/* Header Part */}
                    <div className="panel-header">
                        <h3>Account & Security</h3>
                    </div>
                    {/* Content Part */}
                    <div className="panel-body">
                        <div className="form-grid">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>First Name</label>
                                    <input type="text" className="text-input" value={profile.first_name || ''}
                                        onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Last Name</label>
                                    <input type="text" className="text-input" value={profile.last_name || ''}
                                        onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Designation</label>
                                <input type="text" className="text-input disabled" value={profile.designation || ''} disabled />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <div className="text-input password-dots">••••••••••••••••••••</div>
                                    <button className="edit-password-btn" onClick={() => setIsPasswordModalOpen(true)}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                </div>
                            </div>

                            <div className="action-row">
                                <button className="save-btn" onClick={handleTextSave}>Save Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS (No Changes needed here, keeping logic same) --- */}
            {isProfileModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Update Profile Picture</h3>
                            <button onClick={() => setIsProfileModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="cropper-body">
                            <AvatarEditor
                                ref={editorRef}
                                image={selectedImage}
                                width={200}
                                height={200}
                                border={20}
                                borderRadius={100}
                                scale={scale}
                            />
                            <input type="range" min="1" max="2" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setIsProfileModalOpen(false)} className="btn-cancel">Cancel</button>
                            <button onClick={handleImageSave} className="btn-confirm">Save</button>
                        </div>
                    </div>
                </div>
            )}
            {isPasswordModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Change Password</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body-form">
                            <input type="password" placeholder="Current Password" className="text-input" />
                            <input type="password" placeholder="New Password" className="text-input" />
                            <input type="password" placeholder="Confirm Password" className="text-input" />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="btn-cancel">Cancel</button>
                            <button className="btn-confirm">Update Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;