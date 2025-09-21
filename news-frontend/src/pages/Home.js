import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import NewsCard from '../components/NewsCard';

const Home = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getPublishedNews();
      setNews(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải tin tức. Vui lòng thử lại sau.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
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

  return (
    
    <div>      
      <div className="container">
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <br />
            <button className="btn btn-outline-primary mt-2" onClick={fetchNews}>
              Thử lại
            </button>
          </div>
        )}

        {news.length === 0 && !error && !loading && (
          <div className="text-center py-5">
            <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
            <h4 className="text-muted">Chưa có tin tức nào</h4>            
          </div>
        )}

        {news.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Tin tức nổi bật ({news.length} bài)</h2>
              <button className="btn btn-outline-primary" onClick={fetchNews}>
                <i className="fas fa-sync-alt me-1"></i>
                Làm mới
              </button>
            </div>  
            
            <div className="row">
              {news.map(item => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>

            <div className="text-center mt-4">
              <button className="btn btn-outline-primary">
                <i className="fas fa-plus me-2"></i>
                Xem thêm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};



export default Home;