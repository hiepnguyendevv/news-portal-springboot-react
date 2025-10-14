import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import UserTable from '../../components/UserTable';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('ACTIVE');

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
      // setError('Không thể tải danh sách người dùng');
      toast.error('Không thể tải danh sách người dùng');
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
      // setSuccess('Xóa người dùng thành công!');
      toast.success('Xóa người dùng thành công');
    } catch (err) {
      // setError('Lỗi khi xóa người dùng: ' + err.message);
      toast.error('Lỗi khi xóa người dùng');
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
      // setSuccess('Cập nhật trạng thái thành công!');
      toast.success('Cập nhật trạng thái thành công');
    } catch (err) {
      // setError('Lỗi khi cập nhật trạng thái: ' + err.message);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Bulk action handlers
  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(users.map(user => user.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một người dùng để xóa');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleBulkStatusUpdate = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một người dùng để cập nhật trạng thái');
      return;
    }
    setShowBulkStatusModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      console.log('Deleting user IDs:', selectedItems);
      const response = await newsAPI.bulkDeleteUsers(selectedItems);
      console.log('Delete response:', response);
      setUsers(users.filter(user => !selectedItems.includes(user.id)));
      toast.success(response.data.message);
      setSelectedItems([]);
    } catch (err) {
      console.error('Error deleting users:', err);
      console.error('Error response:', err.response);
      toast.error('Lỗi khi xóa người dùng: ' + (err.response?.data?.error || err.message));
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  const handleConfirmBulkStatusUpdate = async () => {
    try {
      console.log('Updating status for user IDs:', selectedItems, 'to status:', bulkStatus);
      const response = await newsAPI.bulkUpdateUserStatus(selectedItems, bulkStatus);
      console.log('Status update response:', response);
      setUsers(users.map(user => 
        selectedItems.includes(user.id) 
          ? { ...user, status: bulkStatus } 
          : user
      ));
      toast.success(response.data.message);
      setSelectedItems([]);
    } catch (err) {
      console.error('Error updating user status:', err);
      console.error('Error response:', err.response);
      toast.error('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.error || err.message));
    } finally {
      setShowBulkStatusModal(false);
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
      <ConfirmModal
        show={showBulkDeleteModal}
        title="Xóa nhiều người dùng"
        message={`Bạn có chắc chắn muốn xóa ${selectedItems.length} người dùng đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
      />
      <ConfirmModal
        show={showBulkStatusModal}
        title="Cập nhật trạng thái nhiều người dùng"
        message={`Bạn có chắc chắn muốn cập nhật trạng thái ${selectedItems.length} người dùng đã chọn thành ${bulkStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}?`}
        confirmText="Cập nhật tất cả"
        cancelText="Hủy"
        confirmBtnClass="btn-success"
        onConfirm={handleConfirmBulkStatusUpdate}
        onClose={() => setShowBulkStatusModal(false)}
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
              toast.error('Lỗi khi xóa người dùng');
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Danh sách người dùng</h5>
              {selectedItems.length > 0 && (
                <div className="btn-group">
                  <div className="dropdown me-2">
                    <button 
                      className="btn btn-warning btn-sm dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      title="Cập nhật trạng thái tất cả đã chọn"
                    >
                      <i className="fas fa-user-check me-1"></i>
                      Trạng thái ({selectedItems.length})
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            setBulkStatus('ACTIVE');
                            handleBulkStatusUpdate();
                          }}
                        >
                          <i className="fas fa-check-circle text-success me-2"></i>
                          Kích hoạt
                        </button>
                      </li>
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            setBulkStatus('INACTIVE');
                            handleBulkStatusUpdate();
                          }}
                        >
                          <i className="fas fa-ban text-danger me-2"></i>
                          Vô hiệu hóa
                        </button>
                      </li>
                    </ul>
                  </div>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleBulkDelete}
                    title="Xóa tất cả đã chọn"
                  >
                    <i className="fas fa-trash me-1"></i>
                    Xóa ({selectedItems.length})
                  </button>
                </div>
              )}
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
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
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