import React, { useState, useRef, useEffect } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { X, Trash2 } from 'lucide-react';
import '../style/ProfilePictureModal.css';
import { createPortal } from 'react-dom';
import { SpinnerIcon } from './Icons';

const ProfilePictureModal = ({ isOpen, onClose, image, onSave, isLoading }) => {
  const [scale, setScale] = useState(1.2);
  const [localImage, setLocalImage] = useState(null);
  const [wasCleared, setWasCleared] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1.2);
      setWasCleared(false);
      if (typeof image === 'string' && image.length > 0) {
        // Fetch existing avatar URL as a blob so AvatarEditor canvas stays untainted
        fetch(image)
          .then(r => r.blob())
          .then(blob => setLocalImage(URL.createObjectURL(blob)))
          .catch(() => setLocalImage(null));
      } else {
        setLocalImage(image || null);
      }
    }
  }, [isOpen, image]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (!localImage && wasCleared) {
      onSave(null);
      return;
    }
    if (localImage && editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) onSave(blob);
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalImage(file);
      setWasCleared(false);
      setScale(1.2);
      e.target.value = '';
    }
  };

  const triggerFileSelect = () => fileInputRef.current.click();

  return createPortal(
    <div className="profile-modal-backdrop" onClick={!isLoading ? onClose : undefined}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>

        {isLoading && (
          <div className="loading-overlay">
            <SpinnerIcon className="profile-spinner" size={60} />
            <p className="loading-text">Uploading Profile Picture...</p>
          </div>
        )}

        <div className="profile-modal-header">
          <h3>Change Profile Picture</h3>
          <button className="profile-close-btn" onClick={!isLoading ? onClose : undefined} style={isLoading ? { opacity: 0.4, cursor: 'default' } : {}}>
            <X size={28} />
          </button>
        </div>

        <div className={`cropper-body ${isLoading ? 'hidden-content' : ''}`}>
          <div className="canvas-container">
            {localImage ? (
              <>
                <button
                  className="delete-image-btn"
                  onClick={() => { setLocalImage(null); setWasCleared(true); }}
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

        {!isLoading && (
          <div className="profile-modal-actions">
            <button onClick={onClose} className="btn-modal-cancel">
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="btn-modal-save"
              disabled={!localImage && !wasCleared}
            >
              Save
            </button>
          </div>
        )}

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
