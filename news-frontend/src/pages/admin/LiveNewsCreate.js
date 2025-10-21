import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { newsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CreateNews = () => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    isRealtime: true,
    content: 'Nội dung tường thuật',
    categoryId: '',
    imageUrl: '',
    published: true,
    featured: true,
    tags: []
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]); 

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchTags();
    }, []);

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  const fetchTags = async () => {
    try {
      const response = await newsAPI.getAllTags();
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleTag = (tagName) => {

    setFormData(prev => {
      if (prev.tags.includes(tagName)) {
        return { ...prev, tags: prev.tags.filter(name => name !== tagName) };
      } else {
        return { ...prev, tags: [...prev.tags, tagName] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title  || !formData.categoryId || !formData.tags.length) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Gọi API tạo tin tức mới (cần implement ở backend)
      const newsData = {
        ...formData,
        authorId: user.id
      };
      
      // avoid logging large objects during render/submit in production
      const response = await newsAPI.createNews(newsData);
      toast.success('Tạo tin tức thành công');
      
      // Reset form giống CreateMyNews.js
      setFormData({
        title: '',
        summary: '',
        content: '',
        categoryId: '',
        imageUrl: '',
        published: false,
        featured: false,
        tags: []
      });

      // Điều hướng
      navigate(`/admin/live-news/${response.data.id}`);

    } catch (err) {
      toast.error('Có lỗi xảy ra khi tạo tin tức');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <i className="fas fa-bolt me-2"></i>
              Tạo tin trực tiếp
            </h2>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/admin')}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Về trang quản trị
            </button>
          </div>


          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                Thông tin tin trực tiếp
              </h5>
              <small className="text-muted">Các trường có dấu * là bắt buộc</small>
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
                        placeholder="Nhập tiêu đề tin trực tiếp..."
                        required
                      />
                    </div>

                    {/* Summary */}
                    <div className="mb-3">
                      <label htmlFor="summary" className="form-label">Tóm tắt</label>
                      <textarea
                        className="form-control"
                        id="summary"
                        name="summary"
                        rows="3"
                        value={formData.summary}
                        onChange={handleChange}
                        placeholder="Nhập mô tả ngắn cho tin trực tiếp..."
                      />
                    </div>

                    
                  </div>

                  <div className="col-md-4">
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
                        <option value="">Chọn danh mục phù hợp</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {'--'.repeat(category.level)} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">Ảnh đại diện (URL)</label>
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

                    <div className="mb-3">
                      <label className="form-label d-block">
                        Thẻ <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {tags.map(tag => {
                          const selected = formData.tags.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => handleToggleTag(tag.name)}
                              aria-pressed={selected}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                      <small className="text-muted d-block mt-1">Chọn ít nhất 1 thẻ để phân loại tin trực tiếp.</small>
                    </div>

                    {/* Submit Button */}
                    <div className="d-grid mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Đang tạo tin trực tiếp...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Tạo tin trực tiếp
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

export default CreateNews;
