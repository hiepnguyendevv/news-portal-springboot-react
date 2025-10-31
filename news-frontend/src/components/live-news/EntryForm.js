// src/components/live-news/EntryForm.js
import React, { useState, useRef,useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { newsAPI } from '../../services/api';
const EntryForm = ({ onSubmit, isConnected, newsId  }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pin, setPin] = useState(false); // <-- State local
    const [sortOrder, setSortOrder] = useState(''); // <-- State local
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    
    const removeFile = () => {
        setImageFile(null);
        setImagePreviewUrl('');
        // setMediaUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEnterPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!isConnected) return;
        
        const currentContent = (editorRef.current) ? editorRef.current.getContent() : '';
        const currentText = (editorRef.current) ? editorRef.current.getContent({ format: 'text' }).trim() : '';

        if (!currentText && !imageFile) { // Sửa validation
            alert('Nội dung hoặc media không được để trống');
            return;
        }
        try {
            setUploading(true);
            let finalUrl = null;
            if (imageFile) {
                finalUrl = await newsAPI.uploadMedia(imageFile);
            }
            const payload = {
                action: 'ADD_ENTRY',
                content: currentContent,
                contentType: 'TEXT',
                entryStatus: pin ? 'PINNED' : 'PUBLISHED',
                mediaUrl: finalUrl,
                sortOrder: sortOrder ? Number(sortOrder) : null,
            };
            onSubmit(payload); 
        if (editorRef.current) {
            editorRef.current.setContent(''); 
        }

        removeFile();
        setPin(false);
            setSortOrder('');
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="card mb-4">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-12">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Media (tuỳ chọn)</label>
                            {!imageFile ? (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="form-control"
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        id="mediaFile"
                                    />
                                    <small className="text-muted">
                                        Hỗ trợ: JPG, PNG, GIF, MP4, MOV
                                    </small>
                                </div>
                            ) : (
                                <div className="border rounded p-3">
                                    {uploading ? (
                                        <div className="text-center">
                                            <div className="spinner-border text-primary mb-2" role="status">
                                                <span className="visually-hidden">Đang upload...</span>
                                            </div>
                                            <small className="text-muted">Đang upload...</small>
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-3">
                                                {imagePreviewUrl && (
                                                    <img 
                                                        src={imagePreviewUrl} 
                                                        alt="Preview" 
                                                        className="img-thumbnail" 
                                                        style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">{imageFile.name}</div>
                                                <small className="text-muted">
                                                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                                                </small>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={removeFile}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content - TinyMCE giống CreateNews */}
                        <div className="mb-3">
                            <label htmlFor="entry-content-editor" className="form-label fw-bold">Nội dung <span className="text-danger">*</span></label>
                            <Editor
                                id="entry-content-editor"
                                apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym'
                                onInit={(evt, editor) => editorRef.current = editor}
                                initialValue=""
                                init={{
                                    height: 250,
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
                        <div className="text-end mt-3">
                            <button 
                                onClick={handleSubmit} 
                                disabled={uploading} 
                                className="btn btn-primary px-4"
                            >
                                {uploading ? 'Đang upload...' : 'Đăng tin'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryForm;