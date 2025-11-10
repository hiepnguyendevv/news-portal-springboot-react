import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import NewsCard from '../components/NewsCard';
import Pagination from '../components/Pagination';

const Home = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews(0);
  }, []);

  
  const fetchNews = async (page = 0) => {
    try {
      setLoading(true);
      const response = await newsAPI.getPublishedNewsPaged(page, 12);
      // console.log(response.data);
      // console.log(response.data.totalElement);
      setData({
        content: response.data.content,
        totalPages: response.data.totalPages,
        page: response.data.page
      });
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
            <button className="btn btn-outline-primary mt-2" onClick={()=>fetchNews()}>
              Thử lại
            </button>
          </div>
        )}

        {data.content.length === 0 && !error && !loading && (
          <div className="text-center py-5">
            <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
            <h4 className="text-muted">Chưa có tin tức nào</h4>            
          </div>
        )}

        {data.content.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Tin tức nổi bật</h2>
            </div>  
            
            <div className="row">
    
              {data.content.map(item => (
                <NewsCard key={item.id} news={item} />

              ))}
            </div>

            {data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={fetchNews}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};



export default Home;