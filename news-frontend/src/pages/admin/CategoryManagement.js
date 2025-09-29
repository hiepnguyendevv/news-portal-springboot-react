import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import CategoryTable from '../../components/CategoryTable';
import ConfirmModal from '../../components/ConfirmModal';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      setError('Không thể tải danh sách danh mục');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    navigate('/admin/categories/create');
  };

  const handleEditCategory = (categoryId) => {
    navigate(`/admin/categories/edit/${categoryId}`);
  };

  const handleDeleteCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      await newsAPI.deleteCategory(selectedCategoryId);
      setCategories(categories.filter(category => category.id !== selectedCategoryId));
      setSuccess('Xóa danh mục thành công!');
    } catch (err) {
      setError('Lỗi khi xóa danh mục: ' + err.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedCategoryId(null);
    }
  };




  return (
    <div className="container py-5">
      <ConfirmModal
        show={showDeleteModal}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onClose={() => { setShowDeleteModal(false); setSelectedCategoryId(null); }}
      />
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-tags me-2"></i>
              Quản lý danh mục
            </h2>
            <div>
              <button 
                className="btn btn-primary me-2"
                onClick={handleCreateCategory}
              >
                <i className="fas fa-plus me-1"></i>
                Thêm danh mục
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/admin')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Quay lại
              </button>
            </div>
          </div>

          {/* Alert Messages */}
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

          {/* Category Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Danh sách danh mục</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <CategoryTable 
                  categories={categories}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-tags fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Không có danh mục nào</h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;