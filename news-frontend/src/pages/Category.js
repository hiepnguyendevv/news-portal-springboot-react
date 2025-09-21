import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';
import NewsCard from '../components/NewsCard';

const Category = () => {
  const { category } = useParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNewsByCategory();
    fetchCategoryBySlug();
    fetchSubcategories();
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

  const fetchSubcategories = async () => {
    try {
      const response = await newsAPI.getSubcategoriesByParent(decodeURIComponent(category));
      setSubcategories(response.data);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setSubcategories([]);
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
        <div>
          <h1>Chuyên mục: {categoryInfo?.name || decodeURIComponent(category)}</h1>
          {categoryInfo?.description && (
            <p className="text-muted mb-0">{categoryInfo.description}</p>
          )}
        </div>
        <button className="btn btn-outline-primary" onClick={fetchNewsByCategory}>
          <i className="fas fa-sync-alt me-1"></i>
          Làm mới
        </button>
      </div>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="fas fa-list me-2"></i>
            Chuyên mục con
          </h5>
          <div className="row">
            {subcategories.map(subcat => (
              <div key={subcat.id} className="col-md-4 col-sm-6 mb-3">
                <Link 
                  to={`/category/${subcat.slug || subcat.name}`}
                  className="text-decoration-none"
                >
                  <div className="card h-100 border-0 shadow-sm hover-card">
                    <div className="card-body text-center">
                      <i className="fas fa-folder-open fa-2x text-primary mb-2"></i>
                      <h6 className="card-title">{subcat.name}</h6>
                      <p className="card-text text-muted small">
                        {subcat.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <hr className="my-4" />
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* News Section */}
      <div className="mb-3">
        <h5>
          <i className="fas fa-newspaper me-2"></i>
          Tin tức ({news.length})
        </h5>
      </div>

      {news.length === 0 && !error ? (
        <div className="text-center py-5">
          <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">Chưa có tin tức nào trong chuyên mục này</h4>
          {subcategories.length > 0 ? (
            <p className="text-muted">Hãy thử xem các chuyên mục con ở trên</p>
          ) : (
            <Link to="/" className="btn btn-primary mt-3">
              Về trang chủ
            </Link>
          )}
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
