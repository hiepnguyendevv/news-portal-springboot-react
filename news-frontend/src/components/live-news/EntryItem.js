// src/components/live-news/EntryItem.jsx

import React from 'react';

const EntryItem = ({ entry, onEdit, onDelete }) => {
    const mediaStyle = { width: '100%', height: 'auto', maxHeight: '800px', objectFit: 'contain' };
  
    return (
        <div className="card mb-3 shadow-sm">
            <div className={`card-body`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2 fw-bold text-muted">
                        {/* Pinned badge removed */}
                    </div>
                    <small className="text-muted">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('vi-VN') : 'Đang gửi...'}
                    </small>
                </div>

                <div>
                    {entry.content && (
                        <div
                            className="card-text mb-2"
                            // style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: entry.content }}
                        />
                    )}
                    {entry.mediaUrl && (
                        <div className="mt-2">
                            {(() => {
                                const url = entry.mediaUrl;
                                const isVideoByExt = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
                                const isCloudinaryVideo = url.includes('/video/');

                                if (isVideoByExt || isCloudinaryVideo) {
                                    return (
                                        <video src={url} controls className="rounded" style={mediaStyle} />
                                    );
                                }

                                return (
                                    <img src={url} alt="Live content" className="rounded" style={mediaStyle} />
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="card-footer bg-transparent border-0 text-end p-0 pt-2">
                    <div className="d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(entry)}>
                            ✏️ Sửa
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(entry)}>
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryItem;