import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { newsAPI } from '../services/api';

const MyNews = () => {
  const [myNews, setMyNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyNews();
  }, [filter]);

  const fetchMyNews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await newsAPI.getMyNews();
      const newsData = response.data;

      let filteredNews = newsData;
      if (filter !== 'all') {
        filteredNews = newsData.filter(news => {
          if (filter === 'published') return news.published;
          if (filter === 'draft') return !news.published;
          return true;
        });
      }

      setMyNews(filteredNews);
    } catch (err) {
      setError('Không thể tải danh sách bài viết');
      console.error('Error fetching my news:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (published) => {
    if (published) {
      return <span className="badge bg-success">Đã xuất bản</span>;
    } else {
      return <span className="badge bg-warning text-dark">Bản nháp</span>;
    }
  };

  const handleCreateNews = () => {
    navigate('/my-news/create');
  };

  const handleEditNews = (newsId) => {
    navigate(`/my-news/edit/${newsId}`);
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      await newsAPI.deleteMyNews(newsId);
      setMyNews(myNews.filter(news => news.id !== newsId));
      setSuccess('Xóa bài viết thành công!');
    } catch (err) {
      setError('Lỗi khi xóa bài viết: ' + err.message);
    }
  };


  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-newspaper me-2"></i>
              Bài viết của tôi
            </h2>
            <button className="btn btn-primary" onClick={handleCreateNews}>
              <i className="fas fa-plus me-1"></i>
              Viết bài mới
            </button>
          </div>

          {/* Alert Messages */}
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

          {/* Filter Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({myNews.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'published' ? 'active' : ''}`}
                onClick={() => setFilter('published')}
              >
                Đã xuất bản ({myNews.filter(n => n.published).length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${filter === 'draft' ? 'active' : ''}`}
                onClick={() => setFilter('draft')}
              >
                Bản nháp ({myNews.filter(n => !n.published).length})
              </button>
            </li>
          </ul>

          {/* News List */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : myNews.length > 0 ? (
            <div className="row">
              {myNews.map(news => (
                <div key={news.id} className="col-12 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-8">
                          <h5 className="card-title">
                            <Link 
                              to={`/${news.id}`} 
                              className="text-decoration-none"
                            >
                              {news.title}
                            </Link>
                          </h5>
                          <p className="card-text text-muted">{news.summary}</p>
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-3">
                              <i className="fas fa-calendar me-1"></i>
                              {new Date(news.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="me-3">
                              <i className="fas fa-eye me-1"></i>
                              {news.viewCount || 0} lượt xem
                            </span>
                            <span className="me-3">
                              <i className="fas fa-tag me-1"></i>
                              {news.category?.name || 'Chưa phân loại'}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-4 text-md-end">
                          <div className="mb-2">
                            {getStatusBadge(news.published)}
                          </div>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleEditNews(news.id)}
                              title="Chỉnh sửa"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="btn btn-outline-info btn-sm"
                              onClick={() => window.open(`/${news.id}`, '_blank')}
                              title="Xem"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteNews(news.id)}
                              title="Xóa"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">Chưa có bài viết nào</h5>
              <p className="text-muted">Bắt đầu viết bài đầu tiên của bạn!</p>
              <button className="btn btn-primary" onClick={handleCreateNews}>
                <i className="fas fa-plus me-1"></i>
                Viết bài mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNews;

