import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { newsAPI } from '../../services/api';
import { toast } from 'react-toastify';
const EditUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setPageLoading(true);
      const response = await newsAPI.getUserById(id);
      const userData = response.data;
      
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        fullName: userData.fullName || '',
        password: '', 
        role: userData.role || 'USER',
        status: userData.status || 'ACTIVE'
      });
    } catch (err) {
      setError('Không thể tải thông tin người dùng');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.fullName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; 
      }
      
      await newsAPI.updateUser(id, updateData);
      toast.success('Cập nhật người dùng thành công');
      navigate('/admin/users');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-user-edit me-2"></i>Chỉnh sửa người dùng</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
              <i className="fas fa-arrow-left me-1"></i>Quay lại
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên đăng nhập <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Họ tên <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Mật khẩu mới</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Để trống nếu không đổi mật khẩu"
                      />
                      <div className="form-text">Để trống nếu không muốn thay đổi mật khẩu</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Vai trò</label>
                      <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                        <option value="USER">Người dùng</option>
              
                        <option value="ADMIN">Quản trị viên</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Trạng thái</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="INACTIVE">Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;