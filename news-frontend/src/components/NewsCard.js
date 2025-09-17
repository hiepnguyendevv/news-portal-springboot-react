import React from 'react';
import { Link } from 'react-router-dom';

const NewsCard = ({ news }) => {
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

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card news-card h-100">
        {news.imageUrl && (
          <img 
            src={news.imageUrl} 
            className="card-img-top news-image" 
            alt={news.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
            }}
          />
        )}
        
        <div className="card-body d-flex flex-column">
          <div className="mb-2">
            <span className={`badge category-badge ${getCategoryColor(news.category?.name || news.category)}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
