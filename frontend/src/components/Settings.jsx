import React, { useState, useEffect } from 'react';
import { Camera, Mail, Edit2, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import '../style/Settings.css';
import { API_BASE_URL } from '../../config';
import { useUser } from '../context/UserContext';
import { validatePasswordForm, getPasswordStrength, validateCurrentPassword } from '../../src/utils/validation';
import ProfilePictureModal from '../components/ProfilePictureModal';

const Settings = () => {
    const { user, updateUser } = useUser();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', designation: '', avatar: null });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const token = localStorage.getItem('token');

    // Password State
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
    const [passwordError, setPasswordError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    };

    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    /**
     * Instant Validation for Current Password
     */
    const handleCurrentPasswordBlur = () => {
        const error = validateCurrentPassword(passwords.old);
        if (error) setPasswordError(error);
    };

    const handlePasswordChange = async () => {
        const validation = validatePasswordForm(passwords);

        if (!validation.isValid) {
            setPasswordError(validation.error);
            return;
        }

        setPasswordError("");
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/change-password/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ old_password: passwords.old, new_password: passwords.new })
            });

            const data = await res.json();

            if (res.ok) {
                showMessage('Password updated!', 'success');
                setIsPasswordModalOpen(false);
                setPasswords({ old: '', new: '', confirm: '' });
            } else {
                setPasswordError(data.error || 'Failed to update password.');
            }
        } catch (error) {
            setPasswordError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Keep existing Profile functions
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

    // Updated to accept blob from ProfilePictureModal
    const handleImageSave = async (blob) => {
        if (blob) {
            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append('avatar', blob, 'profile.jpg');
            try {
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

                    // Remove the old plain text message
                    showMessage('Profile picture updated!', 'success');
                }
            } catch (error) {
                // It's okay to keep the old showMessage for errors, or you can build an error toast later!
                showMessage('Failed to upload image.', 'error');
            }
            finally {
                setIsUploadingImage(false); // <-- Turn OFF the loading spinner
            }
        }
    };

    const handleFileChange = (e) => {
        console.log("File input triggered!");

        const file = e.target.files[0];
        console.log("Selected file:", file);
        if (file) {
            setSelectedImage(file);
            setIsProfileModalOpen(true);
            e.target.value = '';
        }
    };

    // Calculate strength for the UI
    const strength = getPasswordStrength(passwords.new);

    return (
        <div className="settings-container">

            <div className="settings-header">
                <div className="header-content">
                    <h1>Settings</h1>
                    <p>Manage your personal details and account security.</p>
                </div>
                <div className="header-decor bubble-large"></div>
                <div className="header-decor bubble-small"></div>
                {/* --- THE TOAST --- */}
                {message.text && (
                    <div className="settings-notification-wrapper" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50 }}>
                        <div className={`notification-toast ${message.type}`}>
                            <div className="toast-content">
                                <div className="check-circle">{message.type === 'error' ? '!' : '✓'}</div>
                                <span>{message.text}</span>
                            </div>
                            <button className="toast-close" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                            <div className="toast-progress-bar"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-card">
                <div className="card-left">
                    <div className="panel-header"><h3>Employee Profile</h3></div>
                    <div className="panel-body">
                        <div className="avatar-section">
                            <div className="avatar-wrapper" >
                                {getImageUrl(profile.avatar) ? (
                                    <img src={getImageUrl(profile.avatar)} alt="Profile" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">{getInitials(profile.first_name, profile.last_name)}</div>
                                )}
                                <label className="camera-btn" htmlFor="profile-image-upload"
                                    onClick={() => console.log("Camera label clicked!")}>
                                    <Camera size={20} color="white" />
                                    <input id="profile-image-upload" type="file" style={{ display: 'none' }} hidden onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>
                            <h2 className="user-fullname">{profile.first_name} {profile.last_name}</h2>
                        </div>
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
                            {/* Row 1: Direct children, they will naturally take Col 1 and Col 2 */}
                            <div className="input-group">
                                <label>First Name</label>
                                <input type="text" className="text-input" value={profile.first_name || ''} onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Last Name</label>
                                <input type="text" className="text-input" value={profile.last_name || ''} onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
                            </div>

                            {/* Row 2: Designation. Adding 'designation-wrapper' triggers your 'grid-column: span 2' CSS */}
                            <div className="input-group designation-wrapper">
                                <label>Designation</label>
                                <input type="text" className="text-input disabled" value={profile.designation || ''} disabled />
                            </div>

                            {/* Row 3: Password. We use an inline style to span 2 columns here so we don't break the relative positioning of your inner password-wrapper! */}
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <div className="text-input password-dots">••••••••••••••••••••</div>
                                    <button className="edit-password-btn" onClick={() => setIsPasswordModalOpen(true)}><Edit2 size={16} /> Edit</button>
                                </div>
                            </div>

                            {/* Row 4: Action Row. Your CSS already sets this to span 2 columns and align to the right */}
                            <div className="action-row">
                                <button className="save-btn" onClick={handleTextSave}>Save Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Image Modal */}
            <ProfilePictureModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
                image={selectedImage}
                onSave={handleImageSave}
                isLoading={isUploadingImage}
            />

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content password-modal">
                        <div className="modal-header">
                            <h2>Change Account Password</h2>
                            <button onClick={() => { setIsPasswordModalOpen(false); setPasswordError(""); }} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword.old ? "text" : "password"}
                                        className={`input-field ${passwordError.includes("Current") ? 'input-error' : ''}`}
                                        placeholder="Enter current password"
                                        value={passwords.old}
                                        onBlur={handleCurrentPasswordBlur}
                                        onChange={e => {
                                            setPasswords({ ...passwords, old: e.target.value });
                                            if (passwordError.includes("Current")) setPasswordError("");
                                        }}
                                    />
                                    <button type="button" className="eye-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleShowPassword('old')}>
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
                                        disabled={!passwords.old}
                                        value={passwords.new}
                                        onChange={e => {
                                            setPasswords({ ...passwords, new: e.target.value });
                                            if (passwordError.includes("New") || passwordError.includes("weak")) setPasswordError("");
                                        }}
                                    />
                                    <button type="button" className="eye-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleShowPassword('new')}>
                                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Strength Meter: Red, Orange, Green logic is handled by utility */}
                                {passwords.new && (
                                    <div className="strength-meter-container">
                                        <span className="strength-text" style={{ color: strength.color }}>
                                            {strength.label} Strength
                                        </span>
                                        <div className="strength-bar-bg">
                                            <div
                                                className="strength-bar-fill"
                                                style={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: strength.color }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword.confirm ? "text" : "password"}
                                        className={`input-field ${passwordError.includes("match") ? 'input-error' : ''}`}
                                        value={passwords.confirm}
                                        onChange={e => {
                                            setPasswords({ ...passwords, confirm: e.target.value });
                                            if (passwordError.includes("match")) setPasswordError("");
                                        }}
                                    />
                                    <button type="button" className="eye-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleShowPassword('confirm')}>
                                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Specific error for mismatch */}
                            {passwordError.includes("match") && (
                                <div className="password-inline-error">{passwordError}</div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsPasswordModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                            <button className="btn-save" onClick={handlePasswordChange} disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Save Details"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;