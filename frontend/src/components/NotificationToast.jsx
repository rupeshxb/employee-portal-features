import React from 'react';
const NotificationToast = ({ show, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="notification-toast">
        <div className="check-circle">✓</div>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};
export default NotificationToast;