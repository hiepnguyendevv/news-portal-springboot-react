import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { newsAPI } from '../services/api';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await newsAPI.getAllCategory();
        setCategories(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Không thể tải danh mục');
        // Fallback to default categories if API fails
      
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-newspaper me-2"></i>
          News Portal
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Trang chủ</Link>
            </li>
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
              >
                Chuyên mục
              </a>
              <ul className="dropdown-menu">
                {loading ? (
                  <li><span className="dropdown-item-text">Đang tải...</span></li>
                ) : error ? (
                  <li><span className="dropdown-item-text text-danger">{error}</span></li>
                ) : categories.length > 0 ? (
                  categories.map(category => (
                    <li key={category.id}>
                      <Link 
                        className="dropdown-item" 
                        to={`/category/${encodeURIComponent(category.slug)}`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li><span className="dropdown-item-text">Không có danh mục</span></li>
                )}
              </ul>
            </li>
          </ul>
          
          <form className="d-flex" onSubmit={handleSearch}>
            <input 
              className="form-control me-2" 
              type="search" 
              placeholder="Tìm kiếm tin tức..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="btn btn-outline-light" type="submit">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;