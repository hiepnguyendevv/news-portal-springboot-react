import React from 'react';

const AdminNewsHeader = ({ onCreate, onBack }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i className="fas fa-newspaper me-2"></i>
        Quản lý tin tức
      </h2>
      <div>
        <button 
          className="btn btn-primary me-2"
          onClick={onCreate}
        >
          <i className="fas fa-plus me-1"></i>
          Tạo tin tức mới
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left me-1"></i>
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default AdminNewsHeader;




