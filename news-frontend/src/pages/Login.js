import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login
  const from = location.state?.from?.pathname || '/';

  const handleGoogleLogin = () => {
    // Redirect to Spring Boot OAuth2 endpoint
    window.location.href = '/oauth2/authorization/google';
  };

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

    const result = await login(formData);
    
    if (result.success) {
      //  Redirect based on user role
      if (result.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="card-title">Đăng nhập</h2>
                <p className="text-muted">Chào mừng bạn trở lại!</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    <i className="fas fa-user me-1"></i>
                    Tên đăng nhập
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
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <i className="fas fa-lock me-1"></i>
                    Mật khẩu
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
                  />
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Ghi nhớ đăng nhập
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
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-1"></i>
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              {/* <div className="text-center mb-3">
                <div className="position-relative">
                  <hr />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                    hoặc
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-danger w-100 mb-3"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <i className="fab fa-google me-2"></i>
                Đăng nhập với Google
              </button> */}
              

              <div className="text-center">
                <p className="text-muted mb-2">
                  Chưa có tài khoản?{' '}
                  <Link to="/signup" className="text-decoration-none">
                    Đăng ký ngay
                  </Link>
                </p>
                {/* <Link to="/forgot-password" className="text-muted small text-decoration-none">
                  Quên mật khẩu?
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

