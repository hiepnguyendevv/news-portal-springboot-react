import React, { useEffect, useState } from 'react';
import { newsAPI } from '../services/api';
import BookmarkButton from '../components/BookmarkButton';
import Pagination from '../components/Pagination';

const SavedNews = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const loadBookmarks = async (page = 0) => {
    try {
      setLoading(true);
      setError('');
      const res = await newsAPI.getMyBookmark(page, 12);
      setData({ 
        content: res.data.content, 
        totalPages: res.data.totalPages, 
        page: res.data.page 
      });
    } catch (err) {
      setError('Không thể tải danh sách tin đã lưu');
      console.error('Error loading bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks(0);
  }, []);


  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Tin đã lưu ({data.content.length} tin)</h3>
        <button 
          className="btn btn-outline-primary" 
          onClick={() => loadBookmarks(data.page)}
        >
          Làm mới
        </button>
      </div>

      {data.content.length === 0 ? (
        <div className="text-center py-5">
          <h5>Chưa có tin nào được lưu</h5>
          <p>Hãy lưu những tin tức bạn quan tâm để xem lại sau!</p>
          <a href="/" className="btn btn-primary">Xem tin tức</a>
        </div>
      ) : (
        <>
          <div className="row">
            {data.content.map(bookmark => (
              <div key={bookmark.id} className="col-12 mb-3">
                <div className="card">
                  <div className="row g-0">
                    <div className="col-md-3">
                      <img 
                        src={bookmark.news.imageUrl || 'https://via.placeholder.com/400x250?text=No+Image'}
                        className="img-fluid rounded-start h-100"
                        alt={bookmark.news.title}
                        style={{ objectFit: 'cover', minHeight: '150px' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="col-md-9">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className={`badge ${getCategoryColor(bookmark.news.category?.name || bookmark.news.category)}`}>
                            {bookmark.news.category?.name || bookmark.news.category}
                          </span>
                          <small className="text-muted">
                            Lưu lúc: {formatDate(bookmark.createdAt)}
                          </small>
                        </div>
                        
                        <h5 className="card-title">
                          <a href={`/${bookmark.news.slug}-${bookmark.news.id}`} className="text-decoration-none text-dark">
                            {bookmark.news.title}
                          </a>
                        </h5>
                        
                        <p className="card-text text-muted">
                          {bookmark.news.summary || bookmark.news.content?.substring(0, 200) + '...'}
                        </p>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="fas fa-user me-1"></i>
                            {bookmark.news.author?.fullName || bookmark.news.author?.username || bookmark.news.author}
                            <i className="fas fa-clock ms-3 me-1"></i>
                            {formatDate(bookmark.news.createdAt)}
                            <i className="fas fa-eye ms-3 me-1"></i>
                            {bookmark.news.viewCount || 0} lượt xem
                          </small>
                          <div>
                            <BookmarkButton newsId={bookmark.news.id} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={loadBookmarks}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SavedNews;
