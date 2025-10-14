// pages/admin/CommentManagement.js
import React, { useState, useEffect } from 'react';
import Pagination from '../../components/Pagination';
import { useNavigate, useLocation } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import CommentTable from '../../components/CommentTable';
import CommentSearch from '../../components/CommentSearch';
import { toast } from 'react-toastify';

const PAGE_SIZE = 20;

const CommentManagement = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [newsFilter, setNewsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { 
    // Đọc URL params 1 lần khi mount
    const urlParams = new URLSearchParams(location.search);
    const content = urlParams.get('content') || '';
    const author = urlParams.get('author') || '';
    const news = urlParams.get('news') || '';
    const status = urlParams.get('status') || 'all';
    
    setSearchTerm(content);
    setAuthorFilter(author);
    setNewsFilter(news);
    setStatusFilter(status);
    
    const params = { content, author, news, status };
    fetchComments(0, params);
  }, []);

  const fetchComments = async (page = 0, searchFilters = {}) => {
    try {
      setLoading(true);
       
      let res = await newsAPI.searchComment({
        ...searchFilters,
        page,
        size: PAGE_SIZE
      });
      
      setData({
        content: res.data.content || [],
        totalPages: res.data.totalPages ?? 0,
        page: res.data.page ?? 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Không thể tải danh sách bình luận. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters = {
      content: searchTerm,
      author: authorFilter,
      news: newsFilter,
      status: statusFilter
    };
    
    // Cập nhật URL (không trigger re-render)
    const urlParams = new URLSearchParams();
    if (searchTerm) urlParams.append('content', searchTerm);
    if (authorFilter) urlParams.append('author', authorFilter);
    if (newsFilter) urlParams.append('news', newsFilter);
    if (statusFilter && statusFilter !== 'all') urlParams.append('status', statusFilter);
    const newUrl = urlParams.toString() ? `${location.pathname}?${urlParams.toString()}` : location.pathname;
    window.history.replaceState({}, '', newUrl);
    fetchComments(0, filters);
  };

  const handleClear = () => {
    setSearchTerm('');
    setAuthorFilter('');
    setNewsFilter('');
    setStatusFilter('all');
    window.history.replaceState({}, '', location.pathname);
    fetchComments(0);
  };

  const handleDeleteAsk = (commentId) => {
    setSelectedCommentId(commentId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCommentId) return;
    try {
      await newsAPI.adminDeleteComment(selectedCommentId);
      setData(d => ({ ...d, content: d.content.filter(c => c.id !== selectedCommentId) }));
      toast.success('Xóa bình luận thành công');
    } catch {
      toast.error('Lỗi khi xóa bình luận');
    } finally {
      setShowDeleteModal(false);
      setSelectedCommentId(null);
    }
  };

  const handleRestore = async (commentId) => {
    try {
      await newsAPI.restoreComment(commentId);
      setData(d => ({
        ...d,
        content: d.content.map(c => c.id === commentId ? { ...c, deleted: false, deletedAt: null } : c)
      }));
      toast.success('Khôi phục bình luận thành công');
    } catch {
      toast.error('Lỗi khi khôi phục bình luận');
    }
  };

  const handleSoftDelete = async (commentId) => {
    try {
      await newsAPI.softDeleteComment(commentId);
      setData(d => ({
        ...d,
        content: d.content.map(c => c.id === commentId ? { 
          ...c, 
          deleted: true, 
          deletedAt: new Date().toISOString() 
        } : c)
      }));    
      toast.success('Xóa tạm thời bình luận thành công');
    } catch {
      toast.error('Lỗi khi xóa tạm thời bình luận');
    }
  };

  const handlePageChange = (newPage) => {
    const filters = { content: searchTerm, author: authorFilter, news: newsFilter, status: statusFilter };
    fetchComments(newPage, filters);
  };

  // Không return cả trang khi loading để tránh cảm giác reload; chỉ show spinner ở khu vực bảng

  return (
    <div className="container py-5">
      <ConfirmModal
        show={showDeleteModal}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onClose={() => { setShowDeleteModal(false); setSelectedCommentId(null); }}
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-comments me-2"></i>Quản lý bình luận</h2>
        <div className="d-flex gap-2">
        
          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            <i className="fas fa-arrow-left me-1"></i>Quay lại
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <CommentSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        authorFilter={authorFilter}
        setAuthorFilter={setAuthorFilter}
        newsFilter={newsFilter}
        setNewsFilter={setNewsFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <br />
          <button className="btn btn-outline-primary mt-2" onClick={() => fetchComments()}>
            Thử lại
          </button>
        </div>
      )}

      {data.content.length === 0 && !error && !loading && (
        <div className="text-center py-5">
          <i className="fas fa-comments fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">Không có bình luận nào</h4>
        </div>
      )}

      {data.content.length > 0 && (
        <>
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Danh sách bình luận
                <span className="text-muted ms-2">(Trang {data.page + 1}/{data.totalPages || 1})</span>
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : (
                <CommentTable
                  comments={data.content}
                  page={data.page}
                  pageSize={PAGE_SIZE}
                  onRestore={handleRestore}
                  onDeleteAsk={handleDeleteAsk}
                  onSoftDelete={handleSoftDelete}
                />
              )}
            </div>
          </div>

          {data.totalPages > 1 && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CommentManagement;