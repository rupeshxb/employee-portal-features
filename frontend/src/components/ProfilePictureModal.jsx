import React, { useState, useRef, useEffect } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { X } from 'lucide-react';
import '../style/ProfilePictureModal.css';
import { createPortal } from 'react-dom';

const ProfilePictureModal = ({ isOpen, onClose, image, onSave, isLoading }) => {
  const [scale, setScale] = useState(1.2);
  const editorRef = useRef(null);

  // Reset scale when modal opens
  useEffect(() => {
    if (isOpen) setScale(1.2);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (editorRef.current) {
      // 1. Get the canvas
      const canvas = editorRef.current.getImageScaledToCanvas();

      // 2. Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // 3. Send blob back to parent
          onSave(blob);
        }
      }, 'image/jpeg', 0.95); // High quality JPEG
    }
  };

  return createPortal(
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="profile-modal-header">
          <h3>Adjust Profile Picture</h3>
          <button className="profile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Cropper Body */}
        <div className="cropper-body">
          <div className="canvas-container">
            {image ? (
              <AvatarEditor
                ref={editorRef}
                image={image}
                width={250}
                height={250}
                border={0}
                borderRadius={125} // Circle mask
                color={[255, 255, 255, 0.6]} // Semi-transparent white mask
                scale={scale}
                rotate={0}
              />
            ) : (
              <div className="upload-placeholder-box">No image loaded</div>
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
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="profile-modal-actions">
          <button onClick={onClose} className="btn-modal-cancel" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleSaveClick} className="btn-modal-save" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save & Update'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ProfilePictureModal;