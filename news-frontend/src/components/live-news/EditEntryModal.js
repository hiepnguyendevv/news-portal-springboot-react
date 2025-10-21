import React, { useState, useEffect } from 'react';

const EditEntryModal = ({ entry, isOpen, onClose, onSave, isConnected }) => {
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [pin, setPin] = useState(false);
    const [sortOrder, setSortOrder] = useState('');

    useEffect(() => {
        if (entry) {
            setContent(entry.content || '');
            setMediaUrl(entry.mediaUrl || '');
            setPin(entry.entryStatus === 'PINNED');
            setSortOrder(entry.sortOrder || '');
        }
    }, [entry]);

    const handleSave = () => {
        if (!content.trim()) return;

        const updatedEntry = {
            ...entry,
            content: content.trim(),
            mediaUrl: mediaUrl.trim() || null,
            entryStatus: pin ? 'PINNED' : 'PUBLISHED',
            sortOrder: sortOrder ? Number(sortOrder) : null,
        };

        onSave(updatedEntry);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen || !entry) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Chỉnh sửa Entry</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="row g-3">
                            {/* Cột trái */}
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label htmlFor="sortOrder" className="form-label fw-bold">Thứ tự ưu tiên</label>
                                    <input 
                                        id="sortOrder" 
                                        type="number" 
                                        className="form-control" 
                                        value={sortOrder} 
                                        onChange={(e) => setSortOrder(e.target.value)} 
                                        placeholder="Để trống để tự động" 
                                    />
                                </div>
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="pinEntry" 
                                        checked={pin} 
                                        onChange={(e) => setPin(e.target.checked)} 
                                    />
                                    <label className="form-check-label" htmlFor="pinEntry">Ghim tin này</label>
                                </div>
                            </div>

                            {/* Cột phải */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label htmlFor="mediaUrl" className="form-label fw-bold">Media URL (tuỳ chọn)</label>
                                    <input 
                                        id="mediaUrl" 
                                        type="text" 
                                        className="form-control" 
                                        value={mediaUrl} 
                                        onChange={(e) => setMediaUrl(e.target.value)} 
                                        onKeyDown={handleKeyDown}
                                        placeholder="Dán URL hình ảnh, video, tweet..." 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="content" className="form-label fw-bold">Nội dung</label>
                                    <textarea 
                                        id="content" 
                                        className="form-control" 
                                        rows="5" 
                                        value={content} 
                                        onChange={(e) => setContent(e.target.value)} 
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập nội dung tin tức..." 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleSave}
                            disabled={!isConnected || !content.trim()}
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditEntryModal;
