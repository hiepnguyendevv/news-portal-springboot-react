import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react'; // Import TinyMCE

const CreateNews = () => { 
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
  
  // State mới cho file ảnh
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreviewUrl, setImagePreviewUrl] = useState(''); // State để xem trước ảnh
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]); 

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
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- LẤY DỮ LIỆU TỪ EDITOR REF ---
    let currentContent = '';
    if (editorRef.current) {
      currentContent = editorRef.current.getContent(); // Lấy HTML content
    }
    // --- KẾT THÚC LẤY DỮ LIỆU ---
    
    // Sửa validation để kiểm tra 'currentContent' thay vì 'formData.content'
    if (!formData.title || !currentContent || !formData.categoryId || !formData.tags.length || !imageFile) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc và chọn ảnh bìa');
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);
      
      const newsData = {
        ...formData,
        content: currentContent // Gán content mới nhất từ ref
      };

      formDataToSend.append('news', JSON.stringify(newsData));
      
      console.log("formData", formDataToSend);
      const response = await newsAPI.createNews(formDataToSend);
      console.log("response", response);
      toast.success('Tạo tin tức thành công');
      
      // Reset form
      setFormData({
        title: '',
        summary: '',
        content: '', // Reset content trong state
        categoryId: '',
        published: false,
        featured: false,
        tags: []
      });
      // Reset editor
      if (editorRef.current) {
        editorRef.current.setContent('');
      }
      setImageFile(null);
      setImagePreviewUrl('');
      document.getElementById('imageFile').value = ''; 

      // Điều hướng
      navigate(`/admin/news`);

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
          {/* ... Tiêu đề và nút quay lại ... */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-plus-circle me-2"></i>
              Tạo tin tức mới
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin')}
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
                <div className="row">
                  
                  {/* === CỘT BÊN TRÁI (8) === */}
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
                        placeholder="Nhập tiêu đề tin tức..."
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
                        placeholder="Nhập tóm tắt tin tức..."
                      />
                    </div>

                    {/* Content (ĐÃ CHUYỂN VỀ ĐÂY) */}
                    <div className="mb-3">
                      <label htmlFor="content-editor" className="form-label">
                        Nội dung <span className="text-danger">*</span>
                      </label>
                      <Editor
                        id="content-editor"
                        apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym' // <-- DÙNG API KEY CỦA BẠN (HOẶC BIẾN MÔI TRƯỜNG)
                        onInit={(evt, editor) => editorRef.current = editor}
                        initialValue="" // Bắt đầu bằng rỗng
                        init={{
                          height: 350,
                          menubar: false,
                          placeholder: "Nhập nội dung chi tiết bài viết...",
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'help', 'wordcount'
                          ],
                          toolbar: 'undo redo | blocks | code ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'link image media | removeformat | help',
                          }}
                      />
                    </div>

                  </div> {/* === KẾT THÚC CỘT BÊN TRÁI (8) === */}
                  

                  {/* === CỘT BÊN PHẢI (4) === */}
                  <div className="col-md-4">

                    {/* Category (ĐÚNG VỊ TRÍ) */}
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

                    {/* Image File (ĐÚNG VỊ TRÍ) */}
                    <div className="mb-3">
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

                    {/* Options (ĐÚNG VỊ TRÍ) */}
                    <div className="mb-3">
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
                          Xuất bản ngay
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
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

                    {/* Tags (ĐÚNG VỊ TRÍ) */}
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

                    {/* Submit Button (ĐÚNG VỊ TRÍ) */}
                    <div className="d-grid mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
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
                            Tạo tin tức
                          </>
                        )}
                      </button>
                    </div>

                  </div> {/* === KẾT THÚC CỘT BÊN PHẢI (4) === */}

                </div> {/* === KẾT THÚC <div className="row"> === */}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNews;