import React from 'react';

const ConfirmModal = ({
  show,
  title = 'Xác nhận',
  message,
  children,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmBtnClass = 'btn-danger',
  onConfirm,
  onClose,
}) => {
  if (!show) return null;
  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {message && <p className="mb-0">{message}</p>}
            {children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
            <button type="button" className={`btn ${confirmBtnClass}`} onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;



