import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import CategoryTable from '../../components/CategoryTable';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'react-toastify';
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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
      // setSuccess('Xóa danh mục thành công!');
      toast.success('Xóa danh mục thành công');
    } catch (err) {
      // setError('Lỗi khi xóa danh mục: ' + err.message);
      toast.error('Lỗi khi xóa danh mục');
    } finally {
      setShowDeleteModal(false);
      setSelectedCategoryId(null);
    }
  };

  // Bulk action handlers
  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(categories.map(category => category.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một danh mục để xóa');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      console.log('Deleting category IDs:', selectedItems);
      const response = await newsAPI.bulkDeleteCategories(selectedItems);
      console.log('Delete response:', response);
      setCategories(categories.filter(category => !selectedItems.includes(category.id)));
      toast.success(response.data.message);
      setSelectedItems([]);
    } catch (err) {
      console.error('Error deleting categories:', err);
      console.error('Error response:', err.response);
      toast.error('Lỗi khi xóa danh mục: ' + (err.response?.data?.error || err.message));
    } finally {
      setShowBulkDeleteModal(false);
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
      <ConfirmModal
        show={showBulkDeleteModal}
        title="Xóa nhiều danh mục"
        message={`Bạn có chắc chắn muốn xóa ${selectedItems.length} danh mục đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Danh sách danh mục</h5>
              {selectedItems.length > 0 && (
                <div className="btn-group">
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleBulkDelete}
                    title="Xóa tất cả đã chọn"
                  >
                    <i className="fas fa-trash me-1"></i>
                    Xóa ({selectedItems.length})
                  </button>
                </div>
              )}
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
                  onDelete={handleDeleteCategory}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
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