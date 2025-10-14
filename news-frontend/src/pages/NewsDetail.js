import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';
import BookmarkButton from '../components/BookmarkButton';
import CommentSection from '../components/CommentSection';
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
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);
   
  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getNewsById(id);
      
      // Kiểm tra nếu không có data (bất kể status code)
      if (!response.data) {
        setError('Bài viết không tồn tại hoặc đã bị gỡ xuống.');
        return;
      }
      
      setNews(response.data);
      console.log(response.data);
      setError(null);

      if (!incrementedRef.current) {
        incrementedRef.current = true;
        newsAPI.incrementViewCount(id).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching news detail:', err);
      
      // Kiểm tra các trường hợp lỗi khác nhau
      if (err.response?.status === 404) {
        setError('Bài viết không tồn tại hoặc đã bị gỡ xuống.');
      } else if (err.response?.status === 304) {
        // 304 Not Modified - có thể là cache issue
        setError('Bài viết không tồn tại hoặc đã bị gỡ xuống.');
      } else if (err.response?.status >= 400) {
        setError('Bài viết không tồn tại hoặc đã bị gỡ xuống.');
      } else {
        setError('Không thể tải chi tiết tin tức.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await newsAPI.getTagsByNewsId(id);
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
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
        <div className="error-message text-center py-5">
          <i className="fas fa-exclamation-triangle me-2 text-warning" style={{fontSize: '2rem'}}></i>
          <h3 className="mt-3">{error}</h3>
          <p className="text-muted">Bài viết có thể đã bị gỡ xuống hoặc chưa được phê duyệt.</p>
          <div className="mt-4">
            <Link to="/" className="btn btn-primary me-2">
              <i className="fas fa-home me-1"></i>
              Về trang chủ
            </Link>

          </div>
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
            <Link to="/" className="text-decoration-none">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item ">
            <Link className="text-decoration-none" to={`/category/${encodeURIComponent(news.category?.slug || news.category)}`}>
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
                <p key={index} className="mb-3" style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%'
                }}>{paragraph}</p>
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
              
                <BookmarkButton newsId={news.id}/>
            </div>
            
          </div>
          <div className="mb-4">
            <h5 className="mb-3">Tags</h5>
            <div className="d-flex flex-wrap">
              {news.tags.map((tag) => (
                <span key={tag.id} className="badge bg-primary me-2">{tag != null ? tag.name : 'null'}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
      <CommentSection newsId={news.id}/>
    </div>
    
  );
};

export default NewsDetail;
