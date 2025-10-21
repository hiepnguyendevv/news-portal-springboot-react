import React from 'react';
import { Link } from 'react-router-dom';
import BookmarkButton from './BookmarkButton';

const NewsCard = ({ news }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit'
    });
  };



  return (
    <div className="col-12 col-md-6 col-lg-4 mb-4">
      <div className="card news-card h-100">
        <img 
          src={news.imageUrl || 'https://via.placeholder.com/800x450?text=No+Image'}
          className="card-img-top"
          alt={news.title}
          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x450?text=No+Image';
          }}
        />
        
        <div className="card-body d-flex flex-column">
          <div className="mb-2">
            <span className={`badge category-badge ${news.category?.name || news.category}`}>
              {news.category?.name || news.category}
            </span>
          </div>
          
          <Link to={`/${news.slug}-${news.id}`} className="news-title text-decoration-none">
            <h5 className="card-title">{news.title}</h5>
          </Link>
          
          <p className="card-text news-summary flex-grow-1">
            {news.summary || news.content?.substring(0, 150) + '...'}
          </p>
          
          <div className="news-meta mt-auto">
            <small className="text-muted">
              <i className="fas fa-user me-1"></i>
              {news.author?.fullName || news.author?.username || news.author} 
              <i className="fas fa-clock ms-3 me-1"></i>
              {formatDate(news.createdAt)}
            </small>
            <div className="mt-2">
              <BookmarkButton newsId={news.id} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
