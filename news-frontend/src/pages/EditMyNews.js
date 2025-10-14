import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsAPI } from '../services/api';
import { toast } from 'react-toastify';

const EditMyNews = () => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    imageUrl: '',
    published: false,
    featured: false,
    tags: []
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchCategories();
    fetchTags();
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

  const fetchTags = async () => {
    try {
      const response = await newsAPI.getAllTags();
      setTags(response.data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchNewsData = async () => {
    try {
      setPageLoading(true);
      const response = await newsAPI.getNewsById(id);
      const newsData = response.data;
      
      // Xử lý tags - có thể là objects hoặc strings
      const processedTags = newsData.tags ? 
        newsData.tags.map(tag => typeof tag === 'object' ? tag.name : tag) : [];
      
      setFormData({
        title: newsData.title || '',
        summary: newsData.summary || '',
        content: newsData.content || '',
        categoryId: newsData.category?.id || '',
        imageUrl: newsData.imageUrl || '',
        published: newsData.published || false,
        featured: newsData.featured || false,
        tags: processedTags
      });
      console.log("newsData", newsData.tags);
      console.log("processedTags", processedTags);
    } catch (err) {
      // setError('Không thể tải thông tin bài viết');
      console.error('Error fetching news:', err);
      toast.error('Không thể tải thông tin bài viết');
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

  

  const handleToggleTag = (tagName) => {  
    setFormData(prev => {
      // Nếu tag đã được chọn thì bỏ chọn, nếu chưa chọn thì thêm vào
      if (prev.tags.includes(tagName)) {
        // Bỏ chọn: lọc ra tag này
        return { ...prev, tags: prev.tags.filter(name => name !== tagName) };
      } else {
        // Chọn: thêm tag này vào
        return { ...prev, tags: [...prev.tags, tagName] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.categoryId) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Đảm bảo categoryId là number
      const updateData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
      };
      console.log("Sending update data:", updateData);
      await newsAPI.updateMyNews(id, updateData);
      // setSuccess('Cập nhật bài viết thành công!');
      toast.success('Cập nhật bài viết thành công');
      
      // Chuyển đến trang My News sau 2 giây
      // setTimeout(() => {
        navigate('/my-news');
      // }, 2000);

    } catch (err) {
      console.error('Update error:', err);
      console.error('Error response:', err.response?.data);
      setError('Có lỗi xảy ra khi cập nhật bài viết: ' + (err.response?.data?.error || err.message));
      toast.error('Cập nhật bài viết thất bại: ' + (err.response?.data?.error || err.message));
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
               {/* Tags */}
               <div className="mb-3">
                      <label htmlFor="tags" className="form-label">
                        Tags <span className="text-danger">*</span>
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
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
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

