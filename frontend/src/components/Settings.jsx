import React, { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { 
  Camera, User, Mail, Briefcase, Edit2, 
  Eye, EyeOff, Trash2, X 
} from 'lucide-react';
import '../App.css'; 
import { API_BASE_URL } from '../../config';

const Settings = () => {
    // --- STATE ---
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // Profile Data State
    const [profile, setProfile] = useState({
        first_name: '', last_name: '', email: '', designation: '', avatar: null
    });

    // Password Logic State
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
    
    // Modal & UI State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    // Image Editor State
    const [selectedImage, setSelectedImage] = useState(null);
    const [scale, setScale] = useState(1.2);
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);

    const token = localStorage.getItem('token');

    // --- 1. FETCH PROFILE ---
    useEffect(() => {
        fetchProfile();
    }, [token]);

    const fetchProfile = () => {
        const headers = token ? { 'Authorization': `Token ${token}` } : {};
        fetch(`${API_BASE_URL}/api/profile/`, { headers })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error("Error fetching profile:", err));
    };

    // --- HELPER: Get Image URL ---
    const getImageUrl = (avatarPath) => {
        if (!avatarPath) return null; 
        if (avatarPath.startsWith('http')) return avatarPath;
        if (avatarPath.startsWith('/media')) return `${API_BASE_URL}${avatarPath}`;
        return `${API_BASE_URL}/media/${avatarPath}`;
    };

    // --- HELPER: Get Initials (NEW ADDITION) ---
    const getInitials = (first, last) => {
        const f = first ? first.charAt(0) : '';
        const l = last ? last.charAt(0) : '';
        return (f + l).toUpperCase();
    };

    // --- 2. HANDLE TEXT DETAILS SAVE ---
    const handleTextSave = () => {
        const formData = new FormData();
        formData.append('first_name', profile.first_name);
        formData.append('last_name', profile.last_name);
        formData.append('email', profile.email);

        fetch(`${API_BASE_URL}/api/profile/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Token ${token}` },
            body: formData
        })
        .then(async res => {
            if(res.ok) {
                setMessage({ text: 'Profile details updated!', type: 'success' });
                // Update local storage to reflect name change in Header immediately
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ 
                    ...currentUser, 
                    first_name: profile.first_name 
                }));
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                setMessage({ text: 'Error updating details.', type: 'error' });
            }
        })
        .catch(() => setMessage({ text: 'Network error.', type: 'error' }));
    };

    // --- 3. HANDLE IMAGE SAVE (Inside Modal) ---
    const handleImageSave = () => {
        if (editorRef.current) {
            const canvas = editorRef.current.getImageScaledToCanvas();
            canvas.toBlob(blob => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('avatar', blob, 'profile-pic.jpg');

                    fetch(`${API_BASE_URL}/api/profile/`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Token ${token}` },
                        body: formData
                    })
                    .then(res => {
                        if(res.ok) {
                            setMessage({ text: 'Profile picture updated!', type: 'success' });
                            setIsProfileModalOpen(false); // Close Modal
                            fetchProfile(); // Refresh image
                        } else {
                            setMessage({ text: 'Error uploading image.', type: 'error' });
                        }
                    });
                }
            });
        }
    };

    // --- 4. HANDLE PASSWORD CHANGE (Inside Modal) ---
    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ text: "New passwords do not match!", type: 'error' });
            return;
        }

        fetch(`${API_BASE_URL}/api/change-password/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                old_password: passwords.old, 
                new_password: passwords.new 
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                setMessage({ text: "Password changed successfully!", type: 'success' });
                setPasswords({ old: '', new: '', confirm: '' });
                setIsPasswordModalOpen(false); // Close Modal
            } else {
                setMessage({ text: data.error || "Error changing password", type: 'error' });
            }
        });
    };

    // --- UI HELPERS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setIsProfileModalOpen(true); // Open Modal immediately
        }
    };

    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="settings-page">
            {/* 1. Header Banner */}
            <div className="settings-header-banner">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your personal details, salary preferences, and notification settings.</p>
                </div>
                <div className="header-decoration"></div> 
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`alert-banner ${message.type}`} style={{marginBottom: '1rem'}}>
                    {message.text}
                </div>
            )}

            <div className="settings-content-grid">
                
                {/* 2. Left Column: Employee Profile */}
                <div className="settings-card profile-summary-card">
                    <h3>Employee Profile</h3>
                    
                    <div className="profile-pic-wrapper">
                        <div className="profile-pic-container">
                            
                            {/* --- UPDATED LOGIC FOR AVATAR / INITIALS --- */}
                            {getImageUrl(profile.avatar) ? (
                                <img src={getImageUrl(profile.avatar)} alt="Profile" className="main-avatar" />
                            ) : (
                                // Check if we have names to generate initials
                                <div className={`avatar-placeholder ${profile.first_name || profile.last_name ? 'initials-mode' : ''}`}>
                                    {profile.first_name || profile.last_name ? (
                                        getInitials(profile.first_name, profile.last_name)
                                    ) : (
                                        <User size={64} color="#CBD5E1" />
                                    )}
                                </div>
                            )}
                            
                            {/* Hidden Input + Camera Button */}
                            <input 
                                type="file" 
                                id="avatar-upload" 
                                hidden 
                                accept="image/*" 
                                onChange={handleFileChange}
                                ref={fileInputRef} 
                            />
                            <label htmlFor="avatar-upload" className="camera-btn">
                                <Camera size={18} color="white" />
                            </label>
                        </div>
                        <h2 className="profile-name">{profile.first_name} {profile.last_name}</h2>
                    </div>

                    <div className="profile-details-list">
                        <div className="detail-item">
                            <div className="icon-box"><Briefcase size={18} /></div>
                            <div>
                                <span className="label">Designation</span>
                                <p className="value">{profile.designation || 'Employee'}</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="icon-box"><Mail size={18} /></div>
                            <div>
                                <span className="label">Work Email</span>
                                <p className="value">{profile.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Right Column: Account & Security */}
                <div className="settings-card account-details-card">
                    <h3>Account & Security</h3>
                    
                    <div className="details-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input 
                                    type="text" 
                                    value={profile.first_name} 
                                    onChange={e => setProfile({...profile, first_name: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text" 
                                    value={profile.last_name} 
                                    onChange={e => setProfile({...profile, last_name: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Designation</label>
                            <input 
                                type="text" 
                                value={profile.designation || ''} 
                                disabled 
                                className="input-field disabled"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-display-field">
                                <span>*****************************</span>
                                <button 
                                    type="button" 
                                    className="edit-link-btn"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button className="btn-save" onClick={handleTextSave}>Save Details</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}

            {/* A. Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content password-modal">
                        <div className="modal-header">
                            <h2>Change Account Password</h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            {/* Old Password */}
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        type={showPassword.old ? "text" : "password"}
                                        placeholder="Enter current password"
                                        className="input-field"
                                        value={passwords.old}
                                        onChange={e => setPasswords({...passwords, old: e.target.value})}
                                    />
                                    <button className="eye-btn" onClick={() => toggleShowPassword('old')}>
                                        {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            {/* New Password */}
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        type={showPassword.new ? "text" : "password"}
                                        placeholder="Enter new password"
                                        className="input-field"
                                        value={passwords.new}
                                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    />
                                    <button className="eye-btn" onClick={() => toggleShowPassword('new')}>
                                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            {/* Confirm Password */}
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        type={showPassword.confirm ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        className="input-field"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
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

            {/* B. Change Profile Picture Modal (With Zoom/Crop) */}
            {isProfileModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content profile-modal">
                        <div className="modal-header">
                            <h2>Change Profile Picture</h2>
                            <button onClick={() => setIsProfileModalOpen(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body centered-body">
                            <div className="image-cropper-preview">
                                <AvatarEditor
                                    ref={editorRef}
                                    image={selectedImage}
                                    width={250}
                                    height={250}
                                    border={0}
                                    borderRadius={125}
                                    scale={scale}
                                    rotate={0}
                                />
                                <button className="delete-photo-btn" onClick={() => setSelectedImage(null)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="slider-container">
                                <label>Zoom</label>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="2" 
                                    step="0.01" 
                                    value={scale} 
                                    onChange={(e) => setScale(parseFloat(e.target.value))} 
                                    className="zoom-slider"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsProfileModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleImageSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;