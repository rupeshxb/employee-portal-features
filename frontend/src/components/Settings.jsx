import React, { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Camera, User, Mail, Edit2, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import '../style/Settings.css';
import { API_BASE_URL } from '../../config';

const Settings = () => {
    // --- General State ---
    const [message, setMessage] = useState({ text: '', type: '' });
    const [profile, setProfile] = useState({
        first_name: '', last_name: '', email: '', designation: '', avatar: null
    });

    // --- Modal Visibility State ---
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- Password Form State ---
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    // --- Password Visibility Toggles ---
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // --- Image Upload State ---
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

    // --- Handlers ---

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
                showMessage('Details saved successfully!', 'success');
            } else {
                showMessage('Failed to save details.', 'error');
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
                            showMessage('Profile picture updated!', 'success');
                        }
                    });
                }
            });
        }
    };

    const handlePasswordChange = async () => {
        // 1. Validation
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            showMessage('Please fill in all password fields.', 'error');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            showMessage('New passwords do not match.', 'error');
            return;
        }

        // 2. API Call
        try {
            const response = await fetch(`${API_BASE_URL}/api/change-password/`, {
                method: 'POST', // or PUT depending on your backend
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    old_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password changed successfully!', 'success');
                setIsPasswordModalOpen(false);
                // Reset form
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                // Handle backend errors (e.g. "Wrong current password")
                const errorMsg = data.detail || data.message || 'Failed to change password.';
                showMessage(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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

            {/* Toast Message */}
            {message.text && (
                <div className={`alert-toast ${message.type}`} style={{
                    position: 'fixed', top: '20px', right: '20px',
                    padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
                    backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', fontWeight: '500', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {message.text}
                </div>
            )}

            {/* Main Grid Card */}
            <div className="settings-card">
                {/* --- LEFT PANEL --- */}
                <div className="card-left">
                    <div className="panel-header">
                        <h3>Employee Profile</h3>
                    </div>
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
                                <label className="camera-btn">
                                    <Camera size={20} color="white" />
                                    <input type="file" hidden onChange={handleFileChange} />
                                </label>
                            </div>
                            <h2 className="user-fullname">{profile.first_name} {profile.last_name}</h2>
                        </div>

                        <div className="info-list">
                            <div className="info-item-box">
                                <div className="icon-box"><Briefcase size={18} /></div>
                                <div className="info-content">
                                    <span className="label">Designation</span>
                                    <p className="value">{profile.designation || 'Full Stack Developer'}</p>
                                </div>
                            </div>
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
                    <div className="panel-header">
                        <h3>Account & Security</h3>
                    </div>
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

            {/* --- MODALS --- */}

            {/* Profile Picture Modal */}
            {isProfileModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Update Profile Picture</h3>
                            <button className="close-btn" onClick={() => setIsProfileModalOpen(false)}><X size={20} /></button>
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

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Change Account Password</h3>
                            <button className="close-btn" onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
                        </div>

                        <div className="modal-body-form">
                            {/* Current Password */}
                            <div className="modal-input-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showCurrentPass ? "text" : "password"}
                                        placeholder="Enter current password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    />
                                    <button className="toggle-visibility" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="modal-input-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showNewPass ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    />
                                    <button className="toggle-visibility" onClick={() => setShowNewPass(!showNewPass)}>
                                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm New Password */}
                            <div className="modal-input-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPass ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    />
                                    <button className="toggle-visibility" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="btn-cancel">Cancel</button>
                            <button onClick={handlePasswordChange} className="btn-confirm">Save Details</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;