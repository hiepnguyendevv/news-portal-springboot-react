import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { newsAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, published, draft, pending, featured
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  const [sortBy, setSortBy] = useState('date');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [filter, categoryFilter,sortBy]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      let response;
   // Nếu sort theo view count, chỉ lấy tin published và không filter thêm
   if (sortBy === 'desc') {
    response = await newsAPI.getNewsByViewCountDesc();
  } else if (sortBy === 'asc') {
    response = await newsAPI.getNewsByViewCountAsc();
  } else {
    response = await newsAPI.getAllNews();
  }
  
  let filteredNews = response.data;


      // Filter by status
      if (filter === 'published') {
        filteredNews = filteredNews.filter(item => (item.status === 'PUBLISHED') || (item.status == null && item.published === true));
      } else if (filter === 'draft') {
        filteredNews = filteredNews.filter(item => (item.status === 'DRAFT') || (item.status == null && item.published === false));
      } else if (filter === 'pending') {
        filteredNews = filteredNews.filter(item => item.status === 'PENDING_REVIEW');
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

  const openDeleteNews = (newsId) => {
    setSelectedNewsId(newsId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNewsId) return;
    try {
      await newsAPI.deleteNews(selectedNewsId);
      setNews(news.filter(item => item.id !== selectedNewsId));
      setSuccess('Xóa tin tức thành công!');
    } catch (err) {
      setError('Lỗi khi xóa tin tức: ' + err.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedNewsId(null);
    }
  };

  const handleTogglePublish = async (newsId, currentStatus) => {
    try {

 

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

 
      await newsAPI.updateNewsStatus(newsId, { featured: !currentStatus });
      setNews(news.map(item => 
        item.id === newsId ? { ...item, featured: !currentStatus } : item
      ));
      setSuccess(`${!currentStatus ? 'Đặt' : 'Bỏ'} tin nổi bật thành công!`);
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const getStatusBadge = (status, published, featured) => {
    if (featured) {
      return <span className="badge bg-warning text-dark">Nổi bật</span>;
    }
    const effective = status || (published ? 'PUBLISHED' : 'DRAFT');
    if (effective === 'PUBLISHED') {
      return <span className="badge bg-success">Đã xuất bản</span>;
    }
    if (effective === 'PENDING_REVIEW') {
      return <span className="badge bg-info text-dark">Đang chờ duyệt</span>;
    }
    return <span className="badge bg-secondary">Bản nháp</span>;
  };

  const handleReject = (newsId) => {
    setSelectedNewsId(newsId);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const handleCloseReject = () => {
    setShowRejectModal(false);
    setRejectNote('');
    setSelectedNewsId(null);
  };

  const handleConfirmReject = async () => {
    if (!selectedNewsId) {
      return;
    }
    try {
      await newsAPI.updateNewsStatus(selectedNewsId, { published: false, reviewNote: rejectNote || '' });
      setNews(news.map(item => 
        item.id === selectedNewsId ? { ...item, published: false, status: 'DRAFT', reviewNote: rejectNote || '' } : item
      ));
      setSuccess('Đã từ chối bài viết và chuyển về bản nháp');
      handleCloseReject();
    } catch (err) {
      setError('Lỗi khi từ chối bài viết: ' + err.message);
    }
  };

  return (
    <div className="container py-5">
      <ConfirmModal
        show={showDeleteModal}
        title="Xóa tin tức"
        message="Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onClose={() => { setShowDeleteModal(false); setSelectedNewsId(null); }}
      />
      {showRejectModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-times-circle me-2 text-danger"></i>
                  Từ chối bài viết
                </h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseReject}></button>
              </div>
              <div className="modal-body">
                <label htmlFor="rejectNote" className="form-label">Lý do từ chối (tùy chọn)</label>
                <textarea
                  id="rejectNote"
                  className="form-control"
                  rows="4"
                  placeholder="Nhập lý do..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseReject}>Hủy</button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmReject}>
                  <i className="fas fa-times me-1"></i>
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                        className={`nav-link ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                      >
                        Đang chờ duyệt
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
                  <div className="mt-3">
                    <label htmlFor="sortBy" className="form-label">Sắp xếp theo</label>
                    <select  className='form-select'
                    value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">Mới nhất</option>
                      <option value="desc">Xem nhiều nhất</option>
                      <option value="asc">Xem ít nhất</option>
                    </select>
                </div>
                  
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
                          <td>{getStatusBadge(item.status, item.published, item.featured)}</td>
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

                              {item.status === 'PENDING_REVIEW' && (
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleReject(item.id)}
                                  title="Từ chối"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                              
                              <button
                                className={`btn btn-outline-${item.featured ? 'secondary' : 'warning'}`}
                                onClick={() => handleToggleFeatured(item.id, item.featured)}
                                title={item.featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                              >
                                <i className={`fas fa-${item.featured ? 'star-half-alt' : 'star'}`}></i>
                              </button>
                              
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => openDeleteNews(item.id)}
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
