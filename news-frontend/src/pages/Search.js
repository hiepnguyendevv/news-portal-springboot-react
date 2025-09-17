import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';
import NewsCard from '../components/NewsCard';

const Search = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword) {
      searchNews();
    }
  }, [keyword]);

  const searchNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.searchNews(keyword);
      setNews(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tìm kiếm tin tức.');
      console.error('Error searching news:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tìm kiếm...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item active">
            Tìm kiếm
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Kết quả tìm kiếm</h1>
          <p className="text-muted">
            Từ khóa: "<strong>{keyword}</strong>" - Tìm thấy {news.length} kết quả
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={searchNews}>
          <i className="fas fa-sync-alt me-1"></i>
          Tìm lại
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {news.length === 0 && !error && keyword ? (
        <div className="text-center py-5">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">Không tìm thấy kết quả nào</h4>
          <p className="text-muted">
            Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả
          </p>
          <Link to="/" className="btn btn-primary mt-3">
            Về trang chủ
          </Link>
        </div>
      ) : (
        <div className="row">
          {news.map(item => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}

      {!keyword && (
        <div className="text-center py-5">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">Nhập từ khóa để tìm kiếm</h4>
          <Link to="/" className="btn btn-primary mt-3">
            Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
};

export default Search;
