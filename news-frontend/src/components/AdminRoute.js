import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

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

  return children;
};

export default AdminRoute;


