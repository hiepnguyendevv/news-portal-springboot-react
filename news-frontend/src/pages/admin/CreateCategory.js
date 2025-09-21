import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';

const CreateCategory = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    sortOrder: 0,
    isActive: true
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
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
    
    if (!formData.name || !formData.description) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const categoryData = {
        ...formData,
        parentId: formData.parentId || null,
        sortOrder: parseInt(formData.sortOrder) || 0
      };
      
      await newsAPI.createCategory(categoryData);
      navigate('/admin/categories');
    } catch (err) {
      setError('Có lỗi xảy ra: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-plus-circle me-2"></i>Tạo danh mục mới</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/categories')}>
              <i className="fas fa-arrow-left me-1"></i>Quay lại
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên danh mục <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Mô tả <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Danh mục cha</label>
                      <select
                        className="form-select"
                        name="parentId"
                        value={formData.parentId}
                        onChange={handleChange}
                      >
                        <option value="">Chọn danh mục cha (tùy chọn)</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {'--'.repeat(category.level || 0)} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Thứ tự sắp xếp</label>
                      <input
                        type="number"
                        className="form-control"
                        name="sortOrder"
                        value={formData.sortOrder}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">
                          Danh mục hoạt động
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/categories')}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Đang tạo...' : 'Tạo danh mục'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory;


