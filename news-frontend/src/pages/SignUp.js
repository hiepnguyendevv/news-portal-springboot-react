import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...signupData } = formData;

    const result = await signup(signupData);
    
    if (result.success) {
      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="card-title">Đăng ký tài khoản</h2>
                <p className="text-muted">Tạo tài khoản mới để trải nghiệm đầy đủ</p>
              </div>

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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="username" className="form-label">
                      <i className="fas fa-user me-1"></i>
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="Nhập tên đăng nhập"
                      disabled={loading}
                      minLength="3"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-1"></i>
                      Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Nhập email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">
                    <i className="fas fa-id-card me-1"></i>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    <i className="fas fa-phone me-1"></i>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    disabled={loading}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="password" className="form-label">
                      <i className="fas fa-lock me-1"></i>
                      Mật khẩu *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Nhập mật khẩu"
                      disabled={loading}
                      minLength="6"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      <i className="fas fa-lock me-1"></i>
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Nhập lại mật khẩu"
                      disabled={loading}
                      minLength="6"
                    />
                  </div>
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="agreeTerms"
                    required
                  />
                  <label className="form-check-label" htmlFor="agreeTerms">
                    Tôi đồng ý với{' '}
                    <Link to="/terms" className="text-decoration-none">
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link to="/privacy" className="text-decoration-none">
                      Chính sách bảo mật
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-1"></i>
                      Đăng ký
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-muted">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;