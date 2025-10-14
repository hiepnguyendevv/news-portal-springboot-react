import React from 'react';

const CommentSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  authorFilter, 
  setAuthorFilter, 
  newsFilter, 
  setNewsFilter, 
  statusFilter, 
  setStatusFilter, 
  onSearch, 
  onClear 
}) => {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Tìm kiếm & Lọc</h5>
      </div>
      <div className="card-body">
        {/* Search Bar */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo nội dung, tên tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              />
              <button className="btn btn-primary" onClick={onSearch}>
                🔍 Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="row">
          <div className="col-md-3">
            <label className="form-label">Trạng thái:</label>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="deleted">Đã xóa</option>
            </select>
          </div>
          
          <div className="col-md-3">
            <label className="form-label">Tác giả:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Lọc theo tác giả..."
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            />
          </div>
          
          <div className="col-md-3">
            <label className="form-label">Bài viết:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Lọc theo bài viết..."
              value={newsFilter}
              onChange={(e) => setNewsFilter(e.target.value)}
            />
          </div>
          
          <div className="col-md-3 d-flex align-items-end">
            <div className="btn-group w-100">
              <button className="btn btn-success" onClick={onSearch}>
                Áp dụng
              </button>
              <button className="btn btn-outline-secondary" onClick={onClear}>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSearch;
