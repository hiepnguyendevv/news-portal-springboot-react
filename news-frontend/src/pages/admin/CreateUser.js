import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { newsAPI } from '../../services/api';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await newsAPI.createUser(formData);
      navigate('/admin/users');
    } catch (err) {
      setError('Có lỗi xảy ra: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-user-plus me-2"></i>Tạo người dùng mới</h2>
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
                      <label className="form-label">Mật khẩu <span className="text-danger">*</span></label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Vai trò</label>
                      <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                        <option value="USER">Người dùng</option>
                        <option value="AUTHOR">Tác giả</option>
                        <option value="EDITOR">Biên tập viên</option>
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
                    {loading ? 'Đang tạo...' : 'Tạo người dùng'}
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

export default CreateUser;
// import { useNavigate } from 'react-router-dom';
// import { newsAPI } from '../../services/api';

// const CreateUser = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     fullName: '',
//     password: '',
//     role: 'USER',
//     status: 'ACTIVE'
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
//       setError('Vui lòng điền đầy đủ thông tin bắt buộc');
//       return;
//     }

//     setLoading(true);
//     setError('');
    
//     try {
//       await newsAPI.createUser(formData);
//       navigate('/admin/users');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Có lỗi xảy ra');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container py-5">
//       <div className="row justify-content-center">
//         <div className="col-md-8">
//           <div className="card">
//             <div className="card-header">
//               <h4 className="mb-0">
//                 <i className="fas fa-user-plus me-2"></i>
//                 Tạo người dùng mới
//               </h4>
//             </div>
//             <div className="card-body">
//               {error && (
//                 <div className="alert alert-danger">{error}</div>
//               )}

//               <form onSubmit={handleSubmit}>
//                 <div className="row">
//                   <div className="col-md-6">
//                     <div className="mb-3">
//                       <label className="form-label">Tên đăng nhập *</label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         name="username"
//                         value={formData.username}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>

//                     <div className="mb-3">
//                       <label className="form-label">Email *</label>
//                       <input
//                         type="email"
//                         className="form-control"
//                         name="email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>

//                     <div className="mb-3">
//                       <label className="form-label">Họ tên *</label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         name="fullName"
//                         value={formData.fullName}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div className="col-md-6">
//                     <div className="mb-3">
//                       <label className="form-label">Mật khẩu *</label>
//                       <input
//                         type="password"
//                         className="form-control"
//                         name="password"
//                         value={formData.password}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>

//                     <div className="mb-3">
//                       <label className="form-label">Vai trò</label>
//                       <select
//                         className="form-select"
//                         name="role"
//                         value={formData.role}
//                         onChange={handleChange}
//                       >
//                         <option value="USER">Người dùng</option>
//                         <option value="AUTHOR">Tác giả</option>
//                         <option value="EDITOR">Biên tập viên</option>
//                         <option value="ADMIN">Quản trị viên</option>
//                       </select>
//                     </div>

//                     <div className="mb-3">
//                       <label className="form-label">Trạng thái</label>
//                       <select
//                         className="form-select"
//                         name="status"
//                         value={formData.status}
//                         onChange={handleChange}
//                       >
//                         <option value="ACTIVE">Hoạt động</option>
//                         <option value="INACTIVE">Không hoạt động</option>
//                       </select>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="d-flex gap-2">
//                   <button
//                     type="submit"
//                     className="btn btn-primary"
//                     disabled={loading}
//                   >
//                     {loading ? 'Đang tạo...' : 'Tạo người dùng'}
//                   </button>
//                   <button
//                     type="button"
//                     className="btn btn-secondary"
//                     onClick={() => navigate('/admin/users')}
//                   >
//                     Hủy
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateUser;




