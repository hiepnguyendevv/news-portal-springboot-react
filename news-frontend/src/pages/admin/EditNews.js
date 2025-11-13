import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsAPI } from '../../services/api'; 
import { toast } from 'react-toastify';
import LiveNewsDashboard from './LiveNewsDashboard'; 
import { Editor } from '@tinymce/tinymce-react';

const EditNews = () => {
  const [formData, setFormData] = useState({
    title: '', 
    summary: '', 
    content: '', 
    categoryId: '', 
    published: false, 
    featured: false, 
    tags: [] });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [contentMediaIds, setContentMediaIds] = useState([]);
  const editorRef = useRef(null); 

  const navigate = useNavigate();
  const { newsId } = useParams();

  useEffect(() => {
    fetchNewsData();
    fetchCategories();
    fetchTags();
  }, [newsId]);

  const fetchNewsData = async () => {
    try {
      setPageLoading(true);
      const response = await newsAPI.getNewsById(newsId);
      const news = response.data;
      
      const processedTags = news.tags ? 
        news.tags.map(tag => typeof tag === 'object' ? tag.name : tag) : [];
      
      setFormData({
        title: news.title,
        summary: news.summary,
        content: news.content, 
        categoryId: news.category?.id,
        published: news.published,
        featured: news.featured,
        tags: processedTags
      });
      setImagePreviewUrl(news.imageUrl || '');
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setPageLoading(false); 
    }
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileUpload = async (blobInfo, progress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const file = blobInfo.blob();
        const result = await newsAPI.uploadNewsMedia(file);
        if (!result) {
          reject('Upload failed: No response from server');
          return;
        }
        const mediaUrl = result.location || result.url;
        if (!mediaUrl) {
          reject('Upload failed: No URL returned from server');
          return;
        }
        if (result.mediaId) {
          setContentMediaIds(prev => [...prev, result.mediaId]);
        }
        resolve(result.location);
      } catch (error) {
        console.error('Upload image failed:', error);
        reject('Upload failed: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const filePickerCallback = (callback, value, meta) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    if (meta.filetype === 'image') {
      input.setAttribute('accept', 'image/*');
    } else if (meta.filetype === 'media') {
      input.setAttribute('accept', 'video/*, audio/*');
    } else {
      input.setAttribute('accept', '*/*');
    }

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const toastId = toast.loading("Đang tải lên file media...");
      if (!editorRef.current) {
        toast.error("Editor chưa sẵn sàng, vui lòng thử lại.");
        return;
      }
      const blobInfo = editorRef.current.editorUpload.blobCache.create(
        `${new Date().getTime()}-${file.name}`,
        file,
        file.type
      );
      try {
        const location = await handleFileUpload(blobInfo);
        callback(location, { title: file.name });
        toast.update(toastId, { render: "Tải lên thành công!", type: "success", isLoading: false, autoClose: 3000 });
      } catch (error) {
        console.error('Upload from picker failed:', error);
        toast.update(toastId, { render: `Upload thất bại: ${error}`, type: "error", isLoading: false, autoClose: 5000 });
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let currentContent = '';
    if (editorRef.current) { 
      currentContent = editorRef.current.getContent(); 
    } else {
      currentContent = formData.content; 
    }
  
    if (!formData.title || !currentContent || !formData.categoryId /* || !formData.tags.length */) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const newsData = { ...formData, content: currentContent, mediaIds: contentMediaIds }; 
      formDataToSend.append('news', JSON.stringify(newsData));
      
      const response = await newsAPI.updateNews(newsId, formDataToSend);
      toast.success('Cập nhật tin tức thành công');
      setContentMediaIds([]);
      navigate('/admin/news'); 

    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật tin tức');
      console.error("Update error:", err.response?.data || err.message);
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
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Đang tải thông tin tin tức...</p>
          </div>
        </div>
      </div>
    );
  }

  if(formData.realtime) { 
    return <LiveNewsDashboard />;
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-edit me-2"></i>
              Chỉnh sửa tin tức
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin/news')}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Quay lại
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Thông tin tin tức</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* === PHẦN THÔNG TIN CƠ BẢN === */}
                <div className="row">
                  {/* Title */}
                  <div className="col-md-8 mb-3">
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

                  {/* Category */}
                  <div className="col-md-4 mb-3">
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
                    placeholder="Nhập tóm tắt tin tức..."
                  />
                </div>

                {/* === CONTENT EDITOR - FULL WIDTH === */}
                <div className="mb-3">
                  <label htmlFor="content-editor" className="form-label">
                    Nội dung <span className="text-danger">*</span>
                  </label>
                  {!pageLoading && ( 
                    <Editor
                      id="content-editor"
                      apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym' 
                      onInit={(evt, editor) => editorRef.current = editor}
                      initialValue={formData.content} 
                      init={{
                        height: 1000,
                        menubar: false,
                        placeholder: "Nhập nội dung chi tiết tin tức...",
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'textcolor'
                        ],
                        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter | link image media | removeformat | help',
                        extended_valid_elements: 'span[style],p[style],h1[style],h2[style],h3[style]',
                        images_upload_handler: handleFileUpload,
                        file_picker_callback: filePickerCallback,
                        file_picker_types: 'image media',
                        automatic_uploads: true,
                      }}
                    />
                  )}
                </div>

                {/* === PHẦN THÔNG TIN BỔ SUNG === */}
                <div className="row">
                  {/* Image File */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="imageFile" className="form-label">
                      Ảnh bìa (Thay đổi)
                    </label>
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
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Options */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tùy chọn</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="published"
                        name="published"
                        checked={formData.published}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="published">
                        Xuất bản
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="featured">
                        Tin tức nổi bật
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tags  */}
                {/*
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
                */}

                {/* Submit Button */}
                <div className="d-grid mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
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
                        Cập nhật tin tức
                      </>
                    )}
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

export default EditNews;