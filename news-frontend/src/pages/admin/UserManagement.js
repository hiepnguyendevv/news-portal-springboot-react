import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import UserTable from '../../components/UserTable';
import ConfirmModal from '../../components/ConfirmModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getAllUsers();
      let usersData = response.data;

      // Filter users based on selected filter
      let filteredUsers = usersData;
      if (filter !== 'all') {
        if (filter === 'active') {
          filteredUsers = usersData.filter(user => 
            user.status === 'ACTIVE'
          );
        } else if (filter === 'inactive') {
          filteredUsers = usersData.filter(user => 
            user.status === 'INACTIVE'
          );
        } else {
          filteredUsers = usersData.filter(user => 
            user.role.toLowerCase() === filter.toLowerCase()
          );
        }
      }

      setUsers(filteredUsers);
    } catch (err) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  const handleEditUser = (userId) => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleDeleteUser = (userId) => {
    setSelectedUserId(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;
    try {
      console.log("id ",selectedUserId);

      await newsAPI.deleteUser(selectedUserId);   
      setUsers(users.filter(user => user.id !== selectedUserId));
      setSuccess('Xóa người dùng thành công!');
    } catch (err) {
      setError('Lỗi khi xóa người dùng: ' + err.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
  };

  const handleToggleStatus = async (userId, newStatus) => {
    try {
      await newsAPI.updateUserStatus(userId, { status: newStatus });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      setSuccess('Cập nhật trạng thái thành công!');
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  return (
    <div className="container py-5">
      <ConfirmModal
        show={showDeleteModal}
        title="Xóa người dùng"
        message="Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onClose={() => { setShowDeleteModal(false); setSelectedUserId(null); }}
      />
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-users me-2"></i>
              Quản lý người dùng
            </h2>
            <div>
              <button 
                className="btn btn-primary me-2"
                onClick={handleCreateUser}
              >
                <i className="fas fa-plus me-1"></i>
                Thêm người dùng
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/admin')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Quay lại
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          {/* Filter Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({users.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Hoạt động
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilter('inactive')}
              >
                Bị khóa
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'admin' ? 'active' : ''}`}
                onClick={() => setFilter('admin')}
              >
                Quản trị
              </button>
            </li>
          </ul>

          {/* Users Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Danh sách người dùng</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : users.length > 0 ? (
                <UserTable 
                  users={users}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onToggleStatus={handleToggleStatus}
                />
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Không có người dùng nào</h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;