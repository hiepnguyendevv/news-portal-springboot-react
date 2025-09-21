import React from 'react';
import { useAuth } from '../components/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-user-circle me-2"></i>
                Hồ sơ cá nhân
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center mb-3">
                  <div className="avatar-placeholder bg-primary text-white rounded-circle mx-auto d-flex align-items-center justify-content-center" 
                       style={{width: '120px', height: '120px', fontSize: '48px'}}>
                    <i className="fas fa-user"></i>
                  </div>
                </div>
                <div className="col-md-8">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Tên đăng nhập:</strong></td>
                        <td>{user?.username}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{user?.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Họ và tên:</strong></td>
                        <td>{user?.fullName || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td><strong>Vai trò:</strong></td>
                        <td>
                          <span className={`badge ${user?.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                            {user?.role}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="mt-3">
                    <button className="btn btn-primary me-2">
                      <i className="fas fa-edit me-1"></i>
                      Chỉnh sửa
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="fas fa-key me-1"></i>
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;