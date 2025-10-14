import React from 'react';

const AdminRejectModal = ({ show, note, setNote, onClose, onConfirm }) => {
  if (!show) return null;
  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-times-circle me-2 text-danger"></i>
              Từ chối bài viết
            </h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label htmlFor="rejectNote" className="form-label">Lý do từ chối (tùy chọn)</label>
            <textarea
              id="rejectNote"
              className="form-control"
              rows="4"
              placeholder="Nhập lý do..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>
              <i className="fas fa-times me-1"></i>
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRejectModal;



