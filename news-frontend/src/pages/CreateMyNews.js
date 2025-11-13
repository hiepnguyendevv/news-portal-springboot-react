import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';

const CreateMyNews = () => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    published: false,
    featured: false,
    isRealtime: false,
    tags: []
  });

  const editorRef = useRef(null);

  // State ảnh (giống CreateNews.js)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [contentMediaIds, setContentMediaIds] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file ảnh hợp lệ (PNG, JPG, JPEG).');
      e.target.value = '';
      setImageFile(null);
      setImagePreviewUrl('');
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
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

    // Lấy content từ TinyMCE
    let currentContent = '';
    if (editorRef.current) {
      currentContent = editorRef.current.getContent();
    }

    if (!formData.title || !currentContent || !formData.categoryId || /*!formData.tags.length ||*/ !imageFile) {
      toast.warning('Vui lòng điền đầy đủ thông tin và chọn ảnh bìa.');
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();

    formDataToSend.append('image', imageFile);

    const newsData = {
      ...formData,
      content: currentContent,
      mediaIds: contentMediaIds
    };

    formDataToSend.append('news', JSON.stringify(newsData));

    try {
      const response = await newsAPI.createMyNews(formDataToSend);
      toast.success('Tạo bài viết thành công');

      // Reset form
      setFormData({
        title: '',
        summary: '',
        content: '',
        categoryId: '',
        published: false,
        featured: false,
        isRealtime: false,
        tags: []
      });
      if (editorRef.current) {
        editorRef.current.setContent('');
      }
      setImageFile(null);
      setImagePreviewUrl('');
      setContentMediaIds([]);
      const inputEl = document.getElementById('imageFile');
      if (inputEl) inputEl.value = '';

      navigate('/my-news');
    } catch (err) {
      toast.error('Tạo bài viết thất bại');
      console.error('Error creating news:', err);
    } finally {
      setLoading(false);
    }
  };

  return (   
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-plus-circle me-2"></i>
              Viết bài mới
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/my-news')}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Quay lại
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Thông tin bài viết</h5>
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
                      placeholder="Nhập tiêu đề bài viết..."
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
                    placeholder="Nhập tóm tắt bài viết..."
                  />
                </div>

                {/* === CONTENT EDITOR - FULL WIDTH === */}
                <div className="mb-3">
                  <label htmlFor="content-editor" className="form-label">
                    Nội dung <span className="text-danger">*</span>
                  </label>
                  <Editor
                    id="content-editor"
                    apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym'
                    onInit={(evt, editor) => editorRef.current = editor}
                    initialValue=""
                    init={{
                      height: 1000,
                      menubar: false,
                      placeholder: "Nhập nội dung chi tiết bài viết...",
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter | link image media | removeformat | help',
                      extended_valid_elements: 'span[style],p[style],h1[style],h2[style],h3[style]',
                      images_upload_handler: handleFileUpload,
                      file_picker_callback: filePickerCallback,
                      file_picker_types: 'image media',
                      automatic_uploads: true,
                    }}
                  />
                </div>

                {/* === PHẦN THÔNG TIN BỔ SUNG === */}
                <div className="row">
                  {/* Image File */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="imageFile" className="form-label">
                      Ảnh bìa <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="imageFile"
                      accept="image/*"
                      name="imageFile"
                      onChange={handleFileChange}
                    />
                    {imagePreviewUrl && (
                      <img 
                        src={imagePreviewUrl} 
                        alt="Preview" 
                        className="img-thumbnail mt-2"
                        style={{ maxWidth: '200px', maxHeight: '150px' }}
                      />
                    )}
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
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        Tạo bài viết
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

export default CreateMyNews;