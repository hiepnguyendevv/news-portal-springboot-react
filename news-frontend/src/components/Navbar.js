import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { newsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    

    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
  const loadNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        newsAPI.getUnreadCount(),
        newsAPI.getMyNotifications()
      ]);
      setUnread(countRes.data.count || 0);
      setNotifs(listRes.data || []);
    } catch (e) {
     }
  };

  const handleMarkRead = async (id) => {
    try {
      await newsAPI.markNotificationAsRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategory();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="fas fa-newspaper me-2"></i>
          NewsPortal
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              {/* <Link className="nav-link" to="/">
                <i className="fas fa-home me-1"></i>
                Trang chủ
              </Link> */}
            </li>

            {/* Categories Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i className="fas fa-list me-1"></i>
                Danh mục
              </a>
              <ul className="dropdown-menu">
                {loading ? (
                  <li>
                    <span className="dropdown-item-text">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang tải...
                    </span>
                  </li>
                ) : categories.length > 0 ? (
                  categories.map(category => (
                    <li key={category.id}>
                      <Link
                        className="dropdown-item"
                        to={`/category/${category.slug || category.name}`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="dropdown-item-text text-muted">
                      Không có danh mục
                    </span>
                  </li>
                )}
              </ul>
            </li>

            
          </ul>

          {/* Quick Search Form */}
          <form className="d-flex me-3" onSubmit={handleQuickSearch}>
            <div className="input-group">
              <input
                className="form-control"
                type="search"
                placeholder="Tìm kiếm nhanh..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                style={{ width: '200px' }}
              />
              <button className="btn btn-outline-light" type="submit">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </form>

          {/* Authentication Section */}
          <ul className="navbar-nav">
            {authLoading ? (
              // Loading state - hiển thị placeholder để tránh flash
              <>
                <li className="nav-item">
                  <span className="nav-link" style={{ minWidth: '120px' }}>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem' }}></span>
                    <span className="visually-hidden">Đang tải...</span>
                  </span>
                </li>
              </>
            ) : isAuthenticated ? (
              // Logged in user menu
              <>
              <li className="nav-item dropdown me-3">
                <a
                  className="nav-link dropdown-toggle position-relative"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="fas fa-bell"></i>
                  {unread > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unread}
                    </span>
                  )}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <li><span className="dropdown-item-text text-muted">Không có thông báo</span></li>
                  ) : (
                    notifs.slice(0, 10).map(n => (
                      <li key={n.id}>
                        <div className="dropdown-item d-flex justify-content-between align-items-start">
                          <div className="me-2" style={{ maxWidth: '240px', overflow: 'hidden' }}>
                            <div className="fw-semibold text-truncate" title={n.title || 'Thông báo'}>{n.title || 'Thông báo'}</div>
                            <div
                              className="small text-muted"
                              style={{
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {n.message}
                            </div>
                          </div>
                          {!n.read && (
                            <button className="btn btn-sm btn-link" onClick={() => handleMarkRead(n.id)}>Đã đọc</button>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={loadNotifications}>
                      Làm mới
                    </button>
                  </li>
                </ul>
              </li>
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="fas fa-user-circle me-1"></i>
                  {user?.fullName || user?.username || 'User'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="fas fa-user me-2"></i>
                      Hồ sơ cá nhân
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/my-news">
                      <i className="fas fa-newspaper me-2"></i>
                      Bài viết của tôi
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/saved">
                      <i className="fas fa-bookmark me-2"></i>
                      Tin đã lưu
                    </Link>
                  </li>
                  {user?.role === 'ADMIN' && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link className="dropdown-item" to="/admin">
                          <i className="fas fa-cog me-2"></i>
                          Quản trị
                        </Link>
                      </li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >                                                                                                             
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
              </>
            ) : (
              // Not logged in
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Đăng nhập
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">
                    <i className="fas fa-user-plus me-1"></i>
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;