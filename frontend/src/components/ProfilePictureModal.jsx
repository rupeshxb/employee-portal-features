import React, { useState, useRef, useEffect } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { X, Trash2 } from 'lucide-react';
import '../style/ProfilePictureModal.css';
import { createPortal } from 'react-dom';
import { SpinnerIcon } from './Icons';

const ProfilePictureModal = ({ isOpen, onClose, image, onSave, isLoading }) => {
  const [scale, setScale] = useState(1.2);
  const [localImage, setLocalImage] = useState(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync the local image with the parent prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1.2);
      setLocalImage(image);
    }
  }, [isOpen, image]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (!localImage) return;
    
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalImage(file);
      setScale(1.2);
      e.target.value = '';
    }
  };

  const triggerFileSelect = () => {
      fileInputRef.current.click();
  };

  return createPortal(
    <div className="profile-modal-backdrop" onClick={!isLoading ? onClose : undefined}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <SpinnerIcon className="profile-spinner" size={60} />
            <p className="loading-text">Uploading Profile Picture...</p>
          </div>
        )}

        {/* Header */}
        <div className="profile-modal-header">
          <h3>Change Profile Picture</h3>
          <button className="profile-close-btn" onClick={!isLoading ? onClose : undefined} style={isLoading ? { opacity: 0.4, cursor: 'default' } : {}}>
            <X size={28} />
          </button>
        </div>

        {/* Cropper Body - Hide content while loading */}
        <div className={`cropper-body ${isLoading ? 'hidden-content' : ''}`}>
          <div className="canvas-container">
            {localImage ? (
              <>
                <button 
                    className="delete-image-btn" 
                    onClick={() => setLocalImage(null)}
                    title="Remove image"
                >
                    <Trash2 size={16} />
                </button>
                
                <AvatarEditor
                  ref={editorRef}
                  image={localImage}
                  width={250}
                  height={250}
                  border={0}
                  borderRadius={125}
                  color={[255, 255, 255, 0.6]}
                  scale={scale}
                  rotate={0}
                />
              </>
            ) : (
              <div className="upload-placeholder-box">
                <button className="btn-modal-save" onClick={triggerFileSelect}>
                    Select Image
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="zoom-control-wrapper">
            <div className="zoom-label">
              <span>Zoom</span>
            </div>
            <input
              className="zoom-slider"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ '--zoom-fill': `${((scale - 1) / (3 - 1)) * 100}%` }}
              disabled={!localImage}
            />
          </div>
        </div>

        {/* Footer Actions - Hide buttons while loading */}
        {!isLoading && (
          <div className="profile-modal-actions">
            <button onClick={onClose} className="btn-modal-cancel">
              Cancel
            </button>
            <button 
              onClick={handleSaveClick} 
              className="btn-modal-save" 
              disabled={!localImage}
            >
              Save
            </button>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileSelect}
            accept="image/*"
        />

      </div>
    </div>,
    document.body
  );
};

export default ProfilePictureModal;