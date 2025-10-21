// src/components/live-news/EntryForm.jsx

import React from 'react';

const EntryForm = ({ data, handlers, onSubmit, isConnected }) => {
    const { content,  mediaUrl, pin, sortOrder } = data;
    const { setContent, setMediaUrl, setPin, setSortOrder } = handlers;

    const handleEnterPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="card mb-4">
            <div className="card-body">
                <div className="row g-3">
                    {/* Cột trái */}
                    <div className="col-md-4">
                        <div className="mb-3">
                            <label htmlFor="sortOrder" className="form-label fw-bold">Thứ tự ưu tiên</label>
                            <input id="sortOrder" type="number" className="form-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Để trống để tự động" />
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pinEntry" checked={pin} onChange={(e) => setPin(e.target.checked)} />
                            <label className="form-check-label" htmlFor="pinEntry">Ghim tin này</label>
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="col-md-8">
                        <div className="mb-3">
                            <label htmlFor="mediaUrl" className="form-label fw-bold">Media URL (tuỳ chọn)</label>
                            <input id="mediaUrl" type="text" className="form-control" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Dán URL hình ảnh, video, tweet..." />
                        </div>
                        <div>
                            <label htmlFor="content" className="form-label fw-bold">Nội dung</label>
                            <textarea id="content" className="form-control" rows="5" value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={handleEnterPress} placeholder="Nhập nội dung tin tức..." />
                        </div>
                        <div className="text-end mt-3">
                            <button onClick={onSubmit} disabled={!isConnected || !content.trim()} className="btn btn-primary px-4">
                                Đăng tin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryForm;