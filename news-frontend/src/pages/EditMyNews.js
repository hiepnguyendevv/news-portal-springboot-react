import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { newsAPI } from '../services/api';

const EditMyNews = () => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    imageUrl: '',
    published: false,
    featured: false
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchCategories();
    fetchNewsData();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNewsData = async () => {
    try {
      setPageLoading(true);
      const response = await newsAPI.getNewsById(id);
      const newsData = response.data;
      
      setFormData({
        title: newsData.title || '',
        summary: newsData.summary || '',
        content: newsData.content || '',
        categoryId: newsData.category?.id || '',
        imageUrl: newsData.imageUrl || '',
        published: newsData.published || false,
        featured: newsData.featured || false
      });
    } catch (err) {
      setError('Không thể tải thông tin bài viết');
      console.error('Error fetching news:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.categoryId) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await newsAPI.updateMyNews(id, formData);
      setSuccess('Cập nhật bài viết thành công!');
      
      // Chuyển đến trang My News sau 2 giây
      setTimeout(() => {
        navigate('/my-news');
      }, 2000);

    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật bài viết: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-edit me-2"></i>
              Chỉnh sửa bài viết
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/my-news')}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Quay lại
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Thông tin bài viết</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-8">
                    {/* Title */}
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        Tiêu đề <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Nhập tiêu đề bài viết..."
                        required
                      />
                    </div>

                    {/* Summary */}
                    <div className="mb-3">
                      <label htmlFor="summary" className="form-label">
                        Tóm tắt
                      </label>
                      <textarea
                        className="form-control"
                        id="summary"
                        name="summary"
                        rows="3"
                        value={formData.summary}
                        onChange={handleChange}
                        placeholder="Nhập tóm tắt bài viết..."
                      />
                    </div>

                    {/* Content */}
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        Nội dung <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        id="content"
                        name="content"
                        rows="10"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Nhập nội dung chi tiết bài viết..."
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    {/* Category */}
                    <div className="mb-3">
                      <label htmlFor="categoryId" className="form-label">
                        Danh mục <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {'--'.repeat(category.level)} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Image URL */}
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        URL hình ảnh
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.imageUrl && (
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="img-thumbnail mt-2"
                          style={{ maxWidth: '200px', maxHeight: '150px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
              

                    {/* Submit Button */}
                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Cập nhật bài viết
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMyNews;

