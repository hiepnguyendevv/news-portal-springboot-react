import React from 'react';

const UserTable = ({ users, onEdit, onDelete, onToggleStatus, selectedItems, onSelectItem, onSelectAll }) => {
  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-danger',
      EDITOR: 'bg-warning text-dark',
      AUTHOR: 'bg-info',
      USER: 'bg-secondary'
    };
    
    const labels = {
      ADMIN: 'Quản trị',
 
      USER: 'Người dùng'
    };

    return (
      <span className={`badge ${badges[role] || 'bg-secondary'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'ACTIVE' ? (
      <span className="badge bg-success">Hoạt động</span>
    ) : (
      <span className="badge bg-danger">Không hoạt động</span>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedItems.length === users.length && users.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="form-check-input"
              />
            </th>
            <th>STT</th>
            <th>Tên đăng nhập</th>
            <th>Email</th>
            <th>Họ tên</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(user.id)}
                  onChange={(e) => onSelectItem(user.id, e.target.checked)}
                  className="form-check-input"
                />
              </td>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.fullName}</td>
              <td>{getRoleBadge(user.role)}</td>
              <td>{getStatusBadge(user.status)}</td>
              <td>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => onEdit(user.id)}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => onDelete(user.id)}
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

export default UserTable;
