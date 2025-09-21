import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Admin = () => {

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Bạn không có quyền truy cập trang này');
      return;
    }
  }, [user]);

 
  if (user?.role !== 'ADMIN') {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Truy cập bị từ chối</h4>
          <p>Bạn không có quyền truy cập trang quản trị này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="fas fa-cog me-2"></i>
            Quản trị hệ thống
          </h2>

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
        </div>
      </div>


          {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Truy cập nhanh</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => navigate('/admin/news/create')}
                  >
                    <i className="fas fa-plus fa-2x d-block mb-2"></i>
                    <span>Tạo tin tức mới</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-info w-100"
                    onClick={() => navigate('/admin/news')}
                  >
                    <i className="fas fa-newspaper fa-2x d-block mb-2"></i>
                    <span>Quản lý tin tức</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-success w-100"
                    onClick={() => navigate('/admin/users')}
                  >
                    <i className="fas fa-users-cog fa-2x d-block mb-2"></i>
                    <span>Quản lý người dùng</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-warning w-100"
                    onClick={() => navigate('/admin/categories')}
                  >
                    <i className="fas fa-tags fa-2x d-block mb-2"></i>
                    <span>Quản lý danh mục</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

