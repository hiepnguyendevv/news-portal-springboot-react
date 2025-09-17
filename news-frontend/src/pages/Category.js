import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';
import NewsCard from '../components/NewsCard';

const Category = () => {
  const { category } = useParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNewsByCategory();
    fetchCategoryBySlug();
  }, [category]);

  const fetchNewsByCategory = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getNewsByCategorySlug(decodeURIComponent(category));
      
      setNews(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải tin tức theo chuyên mục.');
      console.error('Error fetching news by category:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryBySlug = async () => {
    try {
      const response = await newsAPI.getCategoryBySlug(decodeURIComponent(category));
      setCategoryInfo(response.data);
    } catch (err) {
      console.error('Error fetching category by slug:', err);
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
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item active">
            {categoryInfo?.name || decodeURIComponent(category)}
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Chuyên mục: {categoryInfo?.name || "loi"}</h1>
        <button className="btn btn-outline-primary" onClick={fetchNewsByCategory}>
          <i className="fas fa-sync-alt me-1"></i>
          Làm mới
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {news.length === 0 && !error ? (
        <div className="text-center py-5">
          <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">Chưa có tin tức nào trong chuyên mục này</h4>
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
    </div>
  );
};

export default Category;
