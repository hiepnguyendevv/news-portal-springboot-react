import React from 'react';
import { Link } from 'react-router-dom';

const AdminNewsTable = ({ items, onEdit, onTogglePublish, onToggleFeatured, onDelete, onReject, getStatusBadge, selectedItems, onSelectItem, onSelectAll }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
        <h5 className="text-muted">Không có tin tức nào</h5>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedItems.length === items.length && items.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="form-check-input"
              />
            </th>
            <th>ID</th>
            <th>Tiêu đề</th>
            <th>Danh mục</th>
            <th>Tác giả</th>
            <th>Trạng thái</th>
            <th>Lượt xem</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  className="form-check-input"
                />
              </td>
              <td>{item.id}</td>
              <td>
                <div className="d-flex align-items-center">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt=""
                      className="me-2"
                      style={{ width: '50px', height: '30px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <Link 
                      to={`/${item.slug}-${item.id}`}
                      className="text-decoration-none fw-bold"
                    >
                      {item.title}
                    </Link>
                    <br />
                    <small className="text-muted">{item.summary}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="badge bg-info">
                  {item.category?.name || 'Chưa phân loại'}
                </span>
              </td>
              <td>{item.author?.fullName || item.author?.username}</td>
              <td>{getStatusBadge(item.status, item.published, item.featured)}</td>
              <td>
                <i className="fas fa-eye me-1"></i>
                {item.viewCount || 0}
              </td>
              <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
              <td>
                <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-info" onClick={() => onEdit(item)} title="Chỉnh sửa">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className={`btn btn-outline-${item.published ? 'warning' : 'success'}`}
                    onClick={() => onTogglePublish(item.id, item.published)}
                    title={item.published ? 'Hủy xuất bản' : 'Xuất bản'}
                  >
                    <i className={`fas fa-${item.published ? 'eye-slash' : 'eye'}`}></i>
                  </button>

                  {item.status === 'PENDING_REVIEW' && (
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => onReject(item.id)}
                      title="Từ chối"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  
                  <button
                    className={`btn btn-outline-${item.featured ? 'secondary' : 'warning'}`}
                    onClick={() => onToggleFeatured(item.id, item.featured)}
                    title={item.featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                  >
                    <i className={`fas fa-${item.featured ? 'star-half-alt' : 'star'}`}></i>
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => onDelete(item.id)} title="Xóa">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminNewsTable;



