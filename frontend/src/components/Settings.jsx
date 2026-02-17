import React, { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Camera, Mail, Edit2, X, Briefcase, Eye, EyeOff, Trash2 } from 'lucide-react';
import '../style/Settings.css';
import { API_BASE_URL } from '../../config';
import { useUser } from '../context/UserContext';

const Settings = () => {
    const { user, updateUser } = useUser();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', designation: '', avatar: null });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const [scale, setScale] = useState(1.2);
    const editorRef = useRef(null);
    const token = localStorage.getItem('token');

    // --- NEW: Password Specific State ---
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });

    useEffect(() => { if (user) setProfile(prev => ({ ...prev, ...user })); }, [user]);

    const getImageUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http')) return avatarPath;
        return `${API_BASE_URL}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
    };

    const getInitials = (first, last) => ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase();

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
        setSelectedImage(null);
        setScale(1.2);
    };

    // --- NEW: Password Helper Functions ---
    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            showMessage("New passwords do not match!", "error");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/change-password/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ old_password: passwords.old, new_password: passwords.new })
            });
            if (res.ok) {
                showMessage('Password updated!', 'success');
                setIsPasswordModalOpen(false);
                setPasswords({ old: '', new: '', confirm: '' });
            } else {
                const data = await res.json();
                showMessage(data.error || 'Failed to update password.', 'error');
            }
        } catch (error) { showMessage('Network error.', 'error'); }
    };

    const handleTextSave = async () => {
        try {
            const formData = new FormData();
            formData.append('first_name', profile.first_name);
            formData.append('last_name', profile.last_name);
            const res = await fetch(`${API_BASE_URL}/api/profile/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                updateUser(data);
                showMessage('Details saved successfully!', 'success');
            }
        } catch (error) { showMessage('Network error occurred.', 'error'); }
    };

    const handleImageSave = () => {
        if (editorRef.current) {
            const canvas = editorRef.current.getImageScaledToCanvas();
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('avatar', blob, 'profile.jpg');
                    const res = await fetch(`${API_BASE_URL}/api/profile/`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Token ${token}` },
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                        closeProfileModal();
                        setProfile(data);
                        updateUser(data);
                        showMessage('Profile picture updated!', 'success');
                    }
                }
            });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setIsProfileModalOpen(true);
            e.target.value = '';
        }
    };

    return (
        <div className="settings-container">
            {message.text && <div className={`message-toast ${message.type}`}>{message.text}</div>}

            <div className="settings-header">
                <div className="header-content">
                    <h1>Settings</h1>
                    <p>Manage your personal details and account security.</p>
                </div>
                <div className="header-decor bubble-large"></div>
                <div className="header-decor bubble-small"></div>
            </div>

            <div className="settings-card">
                <div className="card-left">
                    <div className="panel-header"><h3>Employee Profile</h3></div>
                    <div className="panel-body">
                        <div className="avatar-section">
                            <div className="avatar-wrapper">
                                {getImageUrl(profile.avatar) ? (
                                    <img src={getImageUrl(profile.avatar)} alt="Profile" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">{getInitials(profile.first_name, profile.last_name)}</div>
                                )}
                                <label className="camera-btn">
                                    <Camera size={20} color="white" />
                                    <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>
                            <h2 className="user-fullname">{profile.first_name} {profile.last_name}</h2>
                        </div>
                        {/* RESTORED: Left Panel Designation & Email */}
                        <div className="info-list">
                            <div className="info-item-box">
                                <div className="icon-box"><Briefcase size={18} /></div>
                                <div className="info-content">
                                    <span className="label">Designation</span>
                                    <p className="value">{profile.designation || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="info-item-box">
                                <div className="icon-box"><Mail size={18} /></div>
                                <div className="info-content">
                                    <span className="label">Work Email</span>
                                    <p className="value">{profile.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-right">
                    <div className="panel-header"><h3>Account & Security</h3></div>
                    <div className="panel-body">
                        <div className="form-grid">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>First Name</label>
                                    <input type="text" className="text-input" value={profile.first_name || ''} onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Last Name</label>
                                    <input type="text" className="text-input" value={profile.last_name || ''} onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
                                </div>
                            </div>
                            {/* RESTORED: Right Panel Disabled Designation */}
                            <div className="input-group">
                                <label>Designation</label>
                                <input type="text" className="text-input disabled" value={profile.designation || ''} disabled />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <div className="text-input password-dots">••••••••••••••••••••</div>
                                    <button className="edit-password-btn" onClick={() => setIsPasswordModalOpen(true)}><Edit2 size={16} /> Edit</button>
                                </div>
                            </div>
                            <div className="action-row"><button className="save-btn" onClick={handleTextSave}>Save Details</button></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Change Profile Picture</h3>
                            <button className="close-btn" onClick={closeProfileModal}><X size={20} /></button>
                        </div>
                        <div className="cropper-body">
                            <div className="canvas-container">
                                {selectedImage ? (
                                    <AvatarEditor ref={editorRef} image={selectedImage} width={400} height={400} border={0} borderRadius={200} scale={scale} />
                                ) : (
                                    <div className="upload-placeholder-box">No image selected</div>
                                )}
                            </div>
                            <input type="range" min="1" max="2" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
                        </div>
                        <div className="modal-actions">
                            <button onClick={closeProfileModal} className="btn-cancel">Cancel</button>
                            <button onClick={handleImageSave} className="btn-confirm">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESTORED & IMPLEMENTED: Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content password-modal">
                        <div className="modal-header">
                            <h2>Change Account Password</h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword.old ? "text" : "password"}
                                        className="input-field"
                                        value={passwords.old}
                                        onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                                    />
                                    <button className="eye-btn" onClick={() => toggleShowPassword('old')}>
                                        {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword.new ? "text" : "password"}
                                        className="input-field"
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    />
                                    <button className="eye-btn" onClick={() => toggleShowPassword('new')}>
                                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword.confirm ? "text" : "password"}
                                        className="input-field"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                    <button className="eye-btn" onClick={() => toggleShowPassword('confirm')}>
                                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handlePasswordChange}>Save Details</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;