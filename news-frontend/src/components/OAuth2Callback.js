import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { newsAPI } from '../services/api';

const OAuth2Callback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { oauth2Login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    handleOAuth2Callback();
  }, []);

  const handleOAuth2Callback = async () => {
    try {

      const response = await newsAPI.googleLogin();
      
      const token = response.data.token;
      
      if (token) {
        localStorage.setItem('token', token);
        console.log("Token saved, getting user info...");
        
        // Gọi API để lấy thông tin user
        const me = await newsAPI.getCurrentUser();
        const payload = me.data;
        
        console.log("User info:", payload);
        const result = await oauth2Login(token, payload);
        console.log("OAuth2 login result:", result);

        if (result.success) {
          if (result.user.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          setError('Đăng nhập thất bại');
        }
      } else {
        setError('Không tìm thấy token trong response');
      }
    } catch (error) {
      console.error('OAuth2 callback error:', error);
      setError('Có lỗi xảy ra trong quá trình đăng nhập: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4 text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5>Đang xử lý đăng nhập...</h5>
                <p className="text-muted">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4 text-center">
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/login')}
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuth2Callback;