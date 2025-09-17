import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>News Portal</h5>
            <p>Trang tin tức cập nhật nhanh nhất và chính xác nhất.</p>
          </div>
          <div className="col-md-3">
            <h6>Liên kết</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-light">Về chúng tôi</a></li>
              <li><a href="#" className="text-light">Liên hệ</a></li>
              <li><a href="#" className="text-light">Chính sách</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6>Theo dõi</h6>
            <div>
              <a href="#" className="text-light me-3"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="text-light me-3"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-light me-3"><i className="fab fa-youtube"></i></a>
              <a href="#" className="text-light"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>
        <hr className="my-3" />
        <div className="text-center">
          <small>&copy; 2024 News Portal. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


