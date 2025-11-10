import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { isVideoUrl } from '../../utils/mediaHelper';
import { newsAPI } from '../../services/api';

const EditEntryModal = ({ entry, isOpen, onClose, onSave, isConnected }) => {

    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const editorRef = useRef(null);
    const [initialContent, setInitialContent] = useState('');
    

    useEffect(() => {
        if (entry) {
            setMediaUrl(entry.mediaUrl || '');
            setMediaFile(null); 

            setInitialContent(entry.content || '');

        }
    }, [entry]); 

    const handleMediaFileChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) { 
            setMediaFile(file);
            setMediaUrl(URL.createObjectURL(file)); 
        } else if (file) {
            alert('Chỉ hỗ trợ file ảnh hoặc video.');
            e.target.value = null;
        }
    };
    
    const removeMedia = () => {
        setMediaFile(null);
        setMediaUrl(''); 
    };

    const handleSave = async () => {
        setUploading(true);
       
        const html = editorRef.current ? editorRef.current.getContent() : 'LỖI: REF BỊ NULL';
        const text = editorRef.current ? editorRef.current.getContent({ format: 'text' }).trim() : 'LỖI: REF BỊ NULL';
       
        if (!text && !mediaFile && !mediaUrl) {
            alert('Nội dung hoặc media không được để trống');
            setUploading(false); // 
            return; 
        }

        try {
            let finalMediaUrl = mediaUrl; 

            if (mediaFile) {
                finalMediaUrl = await newsAPI.uploadMedia(mediaFile);
            } 
            
            const updatedEntry = {
                ...entry,
                content: html, 
                mediaUrl: finalMediaUrl, 
            };
            
            console.log('Dữ liệu chuẩn bị gửi (updatedEntry):', updatedEntry);
            onSave(updatedEntry);
            onClose(); 

        } catch (error) {
            alert('Lỗi khi lưu: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen || !entry) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header align-items-center">
                        <h5 className="modal-title fw-bold">Chỉnh sửa Entry</h5>
                        <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose} />
                    </div>
                    <div className="modal-body pb-3">
                        <div className="row g-3">
                            {/* Cột ảnh & upload */}
                            <div className="col-md-4">
                                <label htmlFor="mediaFile-modal" className="form-label fw-bold">Media (tùy chọn)</label>
                                {mediaUrl && (
                                    <div className="mb-2 position-relative">
                                        {isVideoUrl(mediaUrl) ? (
                                            <video src={mediaUrl} controls className="img-fluid rounded border" style={{ maxHeight: 160, width: '100%', objectFit: 'cover' }}/>
                                        ) : (
                                            <img src={mediaUrl} alt="Preview" className="img-fluid rounded border" style={{ maxHeight: 160, width: '100%', objectFit: 'cover' }}/>
                                        )}
                                        {/* Nút xóa ảnh/video */}
                                        <button 
                                            type="button" 
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                            onClick={removeMedia}
                                            style={{ lineHeight: 1, padding: '0.25rem 0.5rem' }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                                <input
                                    id="mediaFile-modal"
                                    type="file"
                                    accept="image/*,video/*" 
                                    className="form-control form-control-sm"
                                    onChange={handleMediaFileChange}
                                    style={{ maxWidth: 260 }}
                                />
                            </div>
                            {/* Cột nội dung */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="modal-content-editor" className="form-label fw-bold">Nội dung <span className="text-danger">*</span></label>
                                    <Editor
                                        id="modal-content-editor"
                                        apiKey='29h0bkhxlcdk5pu2h6wc6b0mtk6rpojdadtsvvv1af739dym'
                                        key={entry.id}
                                        onInit={(evt, editor) => { 
                                            editorRef.current = editor; 
                                        }}
                                        initialValue={initialContent}
                                        
                                        onKeyDown={handleKeyDown} 
                                        
                                        init={{
                                            height: 250,
                                            menubar: false,
                                            placeholder: "Nhập nội dung trực tiếp...",
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
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-3 justify-content-end">
                        <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Huỷ</button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!isConnected || uploading}
                        >
                            {uploading ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ):null}
                            {uploading ? 'Đang upload...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditEntryModal;