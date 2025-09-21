import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryTable = ({ categories, onDelete }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    return status ? (
      <span className="badge bg-success">Hoạt động</span>
    ) : (
      <span className="badge bg-secondary">Không hoạt động</span>
    );
  };

  const getLevelIndent = (level) => {
    return '--'.repeat(level || 0);
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>STT</th>
            <th>Tên danh mục</th>
            <th>Mô tả</th>
            <th>Danh mục cha</th>
            <th>Cấp độ</th>
            <th>Thứ tự</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category.id}>
              <td>{index + 1}</td>
              <td>
                <strong>{getLevelIndent(category.level)} {category.name}</strong>
                <br />
                <small className="text-muted">ID: {category.id}</small>
              </td>
              <td>
                <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                  {category.description}
                </span>
              </td>
              <td>
                {category.parent ? (
                  <span className="badge bg-info">{category.parent.name}</span>
                ) : (
                  <span className="text-muted">Danh mục gốc</span>
                )}
              </td>
              <td>
                <span className="badge bg-primary">Cấp {category.level || 0}</span>
              </td>
              <td>{category.sortOrder || 0}</td>
              <td>
            
                  {getStatusBadge(category.isActive)}
              </td>
              <td>
                <div className="btn-group" role="group">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(category.id)}
                    title="Xóa"
                  >
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

export default CategoryTable;


