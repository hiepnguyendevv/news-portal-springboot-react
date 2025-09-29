import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const NewsDetail = () => {
  const { slugWithId } = useParams(); // Nhận "tin-tuc-moi-123"
  
  // Extract ID từ slug-id
  const extractId = (slugWithId) => {
    const parts = slugWithId.split('-');
    return parts[parts.length - 1]; // Lấy phần cuối cùng (123)
  };
  
  const id = extractId(slugWithId);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const incrementedRef = React.useRef(false);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getNewsById(id);
      setNews(response.data);
      setError(null);

      if (!incrementedRef.current) {
        incrementedRef.current = true;
        newsAPI.incrementViewCount(id).catch(() => {});
      }
    } catch (err) {
      setError('Không thể tải chi tiết tin tức.');
      console.error('Error fetching news detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Kinh tế': 'bg-success',
      'Công nghệ': 'bg-primary',
      'Thể thao': 'bg-warning',
      'Sức khỏe': 'bg-info',
      'Giải trí': 'bg-danger'
    };
    return colors[category] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <br />
          <Link to="/" className="btn btn-primary mt-2">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!news) {
    return null;
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/category/${encodeURIComponent(news.category?.slug || news.category)}`}>
              {news.category?.name || news.category}
            </Link>
          </li>
          <li className="breadcrumb-item active">{news.title}</li>
        </ol>
      </nav>

      <article className="row">
        <div className="col-lg-8 mx-auto">
          <header className="mb-4">
            <span className={`badge mb-3 ${getCategoryColor(news.category?.name || news.category)}`}>
              {news.category?.name || news.category}
            </span>
            <h1 className="display-6 mb-3">{news.title}</h1>
            
            <div className="news-meta text-muted mb-3">
              <i className="fas fa-user me-1"></i>
              {news.author?.fullName || news.author?.username || news.author}
              <i className="fas fa-clock ms-3 me-1"></i>
              {formatDate(news.createdAt)}
            </div>
            
            {news.summary && (
              <p className="lead text-muted">{news.summary}</p>
            )}
          </header>

          {news.imageUrl && (
            <div className="mb-4">
              <img 
                src={news.imageUrl} 
                className="img-fluid rounded"
                alt={news.title}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="news-content">
            <div className="fs-5 lh-lg">
              {news.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">{paragraph}</p>
              ))}
            </div>
          </div>

          <hr className="my-5" />
          
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                Cập nhật lần cuối: {formatDate(news.updatedAt)}
              </small>
            </div>
            <div>
              <button className="btn btn-outline-primary me-2">
                <i className="fas fa-share me-1"></i>
                Chia sẻ
              </button>
              <button className="btn btn-outline-secondary">
                <i className="fas fa-bookmark me-1"></i>
                Lưu
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default NewsDetail;
