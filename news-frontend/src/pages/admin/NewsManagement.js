import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { newsAPI } from '../../services/api';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, published, draft, featured
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [filter, categoryFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getAllNews();
      let filteredNews = response.data;

      // Filter by status
      if (filter === 'published') {
        filteredNews = filteredNews.filter(item => item.published === true);
      } else if (filter === 'draft') {
        filteredNews = filteredNews.filter(item => item.published === false);
      } else if (filter === 'featured') {
        filteredNews = filteredNews.filter(item => item.featured === true);
      }

      // Filter by category
      if (categoryFilter) {
        filteredNews = filteredNews.filter(item => 
          item.category?.id.toString() === categoryFilter
        );
      }

      // Filter by search term
      if (searchTerm) {
        filteredNews = filteredNews.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setNews(filteredNews);
    } catch (err) {
      setError('Không thể tải danh sách tin tức');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      return;
    }

    try {
      // Gọi API xóa tin tức
      await newsAPI.deleteNews(newsId);
      setNews(news.filter(item => item.id !== newsId));
      setSuccess('Xóa tin tức thành công!');
    } catch (err) {
      setError('Lỗi khi xóa tin tức: ' + err.message);
    }
  };

  const handleTogglePublish = async (newsId, currentStatus) => {
    try {
      // Gọi API cập nhật trạng thái publish
      // Debug dữ liệu trước khi gửi API
 console.log('=== DEBUG PUBLISHED TOGGLE ===');
 console.log('newsId:', newsId);
 console.log('currentStatus:', currentStatus);
 console.log('newStatus sẽ là:', !currentStatus);
 console.log('Dữ liệu gửi đi:', { published: !currentStatus });
 

      await newsAPI.updateNewsStatus(newsId, { published: !currentStatus });
      setNews(news.map(item => 
        item.id === newsId ? { ...item, published: !currentStatus } : item
      ));
      setSuccess(`${!currentStatus ? 'Xuất bản' : 'Hủy xuất bản'} thành công!`);
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleToggleFeatured = async (newsId, currentStatus) => {
    try {
      // Gọi API cập nhật trạng thái featured
 // Debug dữ liệu trước khi gửi API
 console.log('=== DEBUG FEATURED TOGGLE ===');
 console.log('newsId:', newsId);
 console.log('currentStatus:', currentStatus);
 console.log('newStatus sẽ là:', !currentStatus);
 console.log('Dữ liệu gửi đi:', { featured: !currentStatus });
 
      await newsAPI.updateNewsStatus(newsId, { featured: !currentStatus });
      setNews(news.map(item => 
        item.id === newsId ? { ...item, featured: !currentStatus } : item
      ));
      setSuccess(`${!currentStatus ? 'Đặt' : 'Bỏ'} tin nổi bật thành công!`);
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const getStatusBadge = (published, featured) => {
    if (featured) {
      return <span className="badge bg-warning text-dark">Nổi bật</span>;
    }
    if (published) {
      return <span className="badge bg-success">Đã xuất bản</span>;
    }
    return <span className="badge bg-secondary">Bản nháp</span>;
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-newspaper me-2"></i>
              Quản lý tin tức
            </h2>
            <div>
              <button 
                className="btn btn-primary me-2"
                onClick={() => navigate('/admin/news/create')}
              >
                <i className="fas fa-plus me-1"></i>
                Tạo tin tức mới
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/admin')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Quay lại
              </button>
            </div>
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

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                {/* Status Filter */}
                <div className="col-md-3">
                  <label className="form-label">Trạng thái</label>
                  <ul className="nav nav-pills flex-column">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                      >
                        Tất cả
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${filter === 'published' ? 'active' : ''}`}
                        onClick={() => setFilter('published')}
                      >
                        Đã xuất bản
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${filter === 'draft' ? 'active' : ''}`}
                        onClick={() => setFilter('draft')}
                      >
                        Bản nháp
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${filter === 'featured' ? 'active' : ''}`}
                        onClick={() => setFilter('featured')}
                      >
                        Nổi bật
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Category Filter */}
                <div className="col-md-3">
                  <label htmlFor="categoryFilter" className="form-label">Danh mục</label>
                  <select
                    className="form-select"
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {'--'.repeat(category.level)} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div className="col-md-6">
                  <label htmlFor="search" className="form-label">Tìm kiếm</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      id="search"
                      placeholder="Tìm theo tiêu đề, nội dung..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={fetchNews}
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* News Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Danh sách tin tức ({news.length})</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : news.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tiêu đề</th>
                        <th>Danh mục</th>
                        <th>Tác giả</th>
                        <th>Trạng thái</th>
                        <th>Lượt xem</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {news.map(item => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl} 
                                  alt=""
                                  className="me-2"
                                  style={{ width: '50px', height: '30px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <Link 
                                  to={`/${item.slug}-${item.id}`}
                                  className="text-decoration-none fw-bold"
                                >
                                  {item.title}
                                </Link>
                                <br />
                                <small className="text-muted">{item.summary}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {item.category?.name || 'Chưa phân loại'}
                            </span>
                          </td>
                          <td>{item.author?.fullName || item.author?.username}</td>
                          <td>{getStatusBadge(item.published, item.featured)}</td>
                          <td>
                            <i className="fas fa-eye me-1"></i>
                            {item.viewCount || 0}
                          </td>
                          <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-info"
                                onClick={() => navigate(`/admin/news/edit/${item.id}`)}
                                title="Chỉnh sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              
                              <button
                                className={`btn btn-outline-${item.published ? 'warning' : 'success'}`}
                                onClick={() => handleTogglePublish(item.id, item.published)}
                                title={item.published ? 'Hủy xuất bản' : 'Xuất bản'}
                              >
                                <i className={`fas fa-${item.published ? 'eye-slash' : 'eye'}`}></i>
                              </button>
                              
                              <button
                                className={`btn btn-outline-${item.featured ? 'secondary' : 'warning'}`}
                                onClick={() => handleToggleFeatured(item.id, item.featured)}
                                title={item.featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                              >
                                <i className={`fas fa-${item.featured ? 'star-half-alt' : 'star'}`}></i>
                              </button>
                              
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteNews(item.id)}
                                title="Xóa"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Không có tin tức nào</h5>
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={() => navigate('/admin/news/create')}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Tạo tin tức đầu tiên
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
