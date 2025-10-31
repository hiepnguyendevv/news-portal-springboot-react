import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import AdminNewsHeader from '../../components/admin/AdminNewsHeader';
import AdminNewsFilters from '../../components/admin/AdminNewsFilters';
import AdminNewsTable from '../../components/admin/AdminNewsTable';
import AdminRejectModal from '../../components/admin/AdminRejectModal';
import { toast } from 'react-toastify';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft, pending, featured
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const PAGE_SIZE = 20;

  const navigate = useNavigate();

  // Đọc URL params 1 lần khi mount để đồng bộ state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get('filter');
    const c = params.get('category');
    const q = params.get('q');
    const s = params.get('sortBy');
    const p = params.get('page');

    if (f) setFilter(f);
    if (c) setCategoryFilter(c);
    if (q) setSearchTerm(q);
    if (s) setSortBy(s);
    if (p) setPage(Math.max(0, parseInt(p, 10) || 0));
  }, []);

  useEffect(() => {
    // fetch once on mount
    fetchCategories();
  }, []);

  useEffect(() => {
    // whenever filters change, reset to first page and fetch
    setPage(0);
    fetchNews(0);
  }, [filter, categoryFilter, sortBy, searchTerm]);

  // Cập nhật URL khi filter/sort/page/search thay đổi mà không navigate
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.set('filter', filter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (searchTerm) params.set('q', searchTerm);
    if (sortBy && sortBy !== 'date') params.set('sortBy', sortBy);
    if (page && page > 0) params.set('page', String(page));

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filter, categoryFilter, searchTerm, sortBy, page]);

  const fetchNews = async (targetPage = page) => {
    try {
      setLoading(true);
      const response = await newsAPI.adminSearchNews({
        page: targetPage,
        size: PAGE_SIZE,
        filter,
        category: categoryFilter,
        q: searchTerm,
        sortBy
      });
      
      const pageData = response.data;
      setNews(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setPage(pageData.number ?? targetPage);
    } catch (err) {
      toast.error('Không thể tải danh sách tin tức');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    // Page state will be synchronized from server response inside fetchNews
    fetchNews(newPage);
  };

  const fetchCategories = async () => {
    try {
      const response = await newsAPI.getAllCategoryIncludingChildren();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const openDeleteNews = (newsId) => {
    setSelectedNewsId(newsId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNewsId) return;
    try {
      await newsAPI.deleteNews(selectedNewsId);
      setNews(news.filter(item => item.id !== selectedNewsId));
      toast.success('Xóa tin tức thành công');
    } catch (err) {
      toast.error('Lỗi khi xóa tin tức');
    } finally {
      setShowDeleteModal(false);
      setSelectedNewsId(null);
    }
  };

  const handleTogglePublish = async (newsId, currentStatus) => {
    try {
      await newsAPI.updateNewsStatus(newsId, { published: !currentStatus });
      setNews(news.map(item => 
        item.id === newsId ? { ...item, published: !currentStatus } : item
      ));
      toast.success(`${!currentStatus ? 'Xuất bản' : 'Hủy xuất bản'} thành công`);
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };
  
  const handleToggleFeatured = async (newsId, currentStatus) => {
    try {
      await newsAPI.updateNewsStatus(newsId, { featured: !currentStatus });
      setNews(news.map(item => 
        item.id === newsId ? { ...item, featured: !currentStatus } : item
      ));
      toast.success(`${!currentStatus ? 'Đặt' : 'Bỏ'} tin nổi bật thành công`);
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusBadge = (status, published, featured) => {
    if (featured) {
      return <span className="badge bg-warning text-dark">Nổi bật</span>;
    }
    const effective = status || (published ? 'PUBLISHED' : 'DRAFT');
    if (effective === 'PUBLISHED') {
      return <span className="badge bg-success">Đã xuất bản</span>;
    }
    if (effective === 'PENDING_REVIEW') {
      return <span className="badge bg-info text-dark">Đang chờ duyệt</span>;
    }
    return <span className="badge bg-secondary">Bản nháp</span>;
  };

  const handleReject = (newsId) => {
    setSelectedNewsId(newsId);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const handleCloseReject = () => {
    setShowRejectModal(false);
    setRejectNote('');
    setSelectedNewsId(null);
  };

  const handleConfirmReject = async () => {
    if (!selectedNewsId) {
      return;
    }
    try {
      await newsAPI.updateNewsStatus(selectedNewsId, { published: false, reviewNote: rejectNote || '' });
      setNews(news.map(item => 
        item.id === selectedNewsId ? { ...item, published: false, status: 'DRAFT', reviewNote: rejectNote || '' } : item
      ));
      toast.success('Đã từ chối bài viết và chuyển về bản nháp');
      handleCloseReject();
    } catch (err) {
      toast.error('Lỗi khi từ chối bài viết');
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
      setSelectedItems(news.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tin tức để xóa');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleBulkApprove = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tin tức để phê duyệt');
      return;
    }
    setShowBulkApproveModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const response = await newsAPI.bulkDeleteNews(selectedItems);
      setNews(news.filter(item => !selectedItems.includes(item.id)));
      toast.success(response.data.message);
      setSelectedItems([]);
    } catch (err) {
      toast.error('Lỗi khi xóa tin tức: ' + (err.response?.data?.error || err.message));
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  const handleConfirmBulkApprove = async () => {
    try {
      const response = await newsAPI.bulkApproveNews(selectedItems);
      setNews(news.map(item => 
        selectedItems.includes(item.id) 
          ? { ...item, published: true, status: 'PUBLISHED' } 
          : item
      ));
      toast.success(response.data.message);
      setSelectedItems([]);
    } catch (err) {
      toast.error('Lỗi khi phê duyệt tin tức');
    } finally {
      setShowBulkApproveModal(false);
    }
  };

  return (
    <div className="container py-5">
      <ConfirmModal
        show={showDeleteModal}
        title="Xóa tin tức"
        message="Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onClose={() => { setShowDeleteModal(false); setSelectedNewsId(null); }}
      />
      <ConfirmModal
        show={showBulkDeleteModal}
        title="Xóa nhiều tin tức"
        message={`Bạn có chắc chắn muốn xóa ${selectedItems.length} tin tức đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmBtnClass="btn-danger"
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
      />
      <ConfirmModal
        show={showBulkApproveModal}
        title="Phê duyệt nhiều tin tức"
        message={`Bạn có chắc chắn muốn phê duyệt ${selectedItems.length} tin tức đã chọn?`}
        confirmText="Phê duyệt tất cả"
        cancelText="Hủy"
        confirmBtnClass="btn-success"
        onConfirm={handleConfirmBulkApprove}
        onClose={() => setShowBulkApproveModal(false)}
      />
      <AdminRejectModal
        show={showRejectModal}
        note={rejectNote}
        setNote={setRejectNote}
        onClose={handleCloseReject}
        onConfirm={handleConfirmReject}
      />
      <div className="row">
        <div className="col-12">
          <AdminNewsHeader
            onCreate={() => navigate('/admin/news/create')}
            onBack={() => navigate('/admin')}
          />

          <AdminNewsFilters
            filter={filter}
            setFilter={setFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            sortBy={sortBy}
            setSortBy={setSortBy}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={() => fetchNews(0)}
          />
          

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Danh sách tin tức ({news.length})</h5>
              {selectedItems.length > 0 && (
                <div className="btn-group">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={handleBulkApprove}
                    title="Phê duyệt tất cả đã chọn"
                  >
                    <i className="fas fa-check me-1"></i>
                    Phê duyệt ({selectedItems.length})
                  </button>
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
              ) : (
                <AdminNewsTable
                  items={news}
                 
                  onEdit={(item) => {
                    const isRealtime = Boolean(item?.isRealtime || item?.realtime);
                    navigate(isRealtime ? `/admin/live-news/${item.id}` : `/admin/news/edit/${item.id}`);
                  }}
                  onTogglePublish={handleTogglePublish}
                  onToggleFeatured={handleToggleFeatured}
                  onDelete={openDeleteNews}
                  onReject={handleReject}
                  getStatusBadge={getStatusBadge}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                />
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
