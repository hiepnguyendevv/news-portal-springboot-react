import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';

const EditMyNews = () => {
  // State chính
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    published: false,
    featured: false,
    tags: []
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editorRef = useRef(null);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchNewsData();
  }, [id]);

  // Fetch data
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
      const response = await newsAPI.getMyNews();
      const myNewsList = response.data;
      const newsData = myNewsList.find(news => news.id === parseInt(id));
      if (!newsData) throw new Error('Không tìm thấy bài viết hoặc bạn không có quyền chỉnh sửa bài viết này');
      const processedTags = newsData.tags ? newsData.tags.map(tag => typeof tag === 'object' ? tag.name : tag) : [];

      setFormData({
        title: newsData.title,
        summary: newsData.summary,
        content: newsData.content,
        categoryId: newsData.category?.id,
        published: newsData.published,
        featured: newsData.featured,
        tags: processedTags
      });
      setImagePreviewUrl(newsData.imageUrl || '');
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin bài viết');
      toast.error(err.message || 'Không thể tải thông tin bài viết');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let currentContent = '';
    if (editorRef.current) {
      currentContent = editorRef.current.getContent();
    } else {
      currentContent = formData.content;
    }
    if (!formData.title || !currentContent || !formData.categoryId) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      const newsData = { ...formData, content: currentContent };
      formDataToSend.append('news', JSON.stringify(newsData));
      await newsAPI.updateMyNews(id, formDataToSend);
      toast.success('Cập nhật bài viết thành công');
      navigate('/my-news');
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật bài viết: ' + (err.response?.data?.error || err.message));
      toast.error('Cập nhật bài viết thất bại: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2">Đang tải thông tin bài viết...</p>
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
            <h2><i className="fas fa-edit me-2"></i>Chỉnh sửa bài viết của tôi</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/my-news')}>
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
                        placeholder="Nhập tiêu đề tin tức..."
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="summary" className="form-label">Tóm tắt</label>
                      <textarea
                        className="form-control"
                        id="summary"
                        name="summary"
                        rows="3"
                        value={formData.summary}
                        onChange={handleChange}
                        placeholder="Nhập tóm tắt tin tức..."
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="content-editor" className="form-label">Nội dung <span className="text-danger">*</span></label>
                      {!pageLoading && (
                        <Editor
                          id="content-editor"
                          apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym'
                          onInit={(evt, editor) => editorRef.current = editor}
                          initialValue={formData.content}
                          init={{
                            height: 350,
                            menubar: false,
                            placeholder: "Nhập nội dung chi tiết bài viết...",
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'textcolor'
                            ],
                            toolbar: 'undo redo | blocks | code | bold italic forecolor backcolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'link image media | removeformat | help',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="categoryId" className="form-label">Danh mục <span className="text-danger">*</span></label>
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

                    <div className="mb-3">
                      <label htmlFor="imageFile" className="form-label">Ảnh bìa (Thay đổi)</label>
                      <input
                        type="file"
                        className="form-control"
                        id="imageFile"
                        accept="image/png, image/jpeg, image/jpg"
                        name="imageFile"
                        onChange={handleFileChange}
                      />
                      {imagePreviewUrl && (
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="img-thumbnail mt-2"
                          style={{ maxWidth: '200px', maxHeight: '150px' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="tags" className="form-label">Tags <span className="text-danger">*</span></label>
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


                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang cập nhật...</> : <><i className="fas fa-save me-1"></i>Cập nhật bài viết</>}
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

