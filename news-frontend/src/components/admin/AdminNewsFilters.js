import React from 'react';

const AdminNewsFilters = ({
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  sortBy,
  setSortBy,
  searchTerm,
  setSearchTerm,
  onSearch,
}) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row">
          <div className="col-md-3">
            <label className="form-label">Trạng thái</label>
            <ul className="nav nav-pills flex-column">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'published', label: 'Đã xuất bản' },
                { key: 'draft', label: 'Bản nháp' },
                { key: 'pending', label: 'Đang chờ duyệt' },
                { key: 'featured', label: 'Nổi bật' },
              ].map(item => (
                <li className="nav-item" key={item.key}>
                  <button
                    className={`nav-link ${filter === item.key ? 'active' : ''}`}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-3">
            <label htmlFor="categoryFilter" className="form-label">Danh mục</label>
            <select
              className="form-select"
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {'--'.repeat(category.level)} {category.name}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <label htmlFor="sortBy" className="form-label">Sắp xếp theo</label>
              <select className='form-select' value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Mới nhất</option>
                <option value="desc">Xem nhiều nhất</option>
                <option value="asc">Xem ít nhất</option>
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="search" className="form-label">Tìm kiếm</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Tìm theo tiêu đề, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-outline-secondary" onClick={onSearch}>
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNewsFilters;



