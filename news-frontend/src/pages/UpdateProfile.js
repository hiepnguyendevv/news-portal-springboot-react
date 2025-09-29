import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { newsAPI } from '../services/api';

const UpdateProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
      }
      await newsAPI.updateMyProfile(payload);
      await refreshUser();

      setSuccess('Cập nhật hồ sơ thành công!');
      setForm(prev => ({ ...prev, password: '' }));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-user-edit me-2"></i>
                Cập nhật hồ sơ
              </h4>
              <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/profile')}>
                <i className="fas fa-arrow-left me-1"></i>
                Quay lại
              </button>
            </div>
            <div className="card-body">
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

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Họ và tên</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Nhập email"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ảnh đại diện (URL)</label>
                  <input
                    type="url"
                    className="form-control"
                    name="avatarUrl"
                    value={form.avatarUrl}
                    onChange={handleChange}
                    placeholder="Dán URL ảnh đại diện"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mật khẩu mới (tùy chọn)</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/profile')}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        Lưu thay đổi
                      </>
                    )}
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

export default UpdateProfile;


