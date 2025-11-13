import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6 text-center">
          <div className="card shadow-sm">
            <div className="card-body py-5">
              <div className="mb-4">
                <h1 className="display-1 fw-bold text-primary">404</h1>
                <h2 className="h4 mb-3">Trang không tìm thấy</h2>
                <p className="text-muted mb-4">
                  Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            
                <Link to="/" className="btn btn-outline-primary">
                  <i className="fas fa-home me-2"></i>
                  Về trang chủ
                </Link>
              </div>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

