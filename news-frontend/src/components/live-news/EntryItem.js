// src/components/live-news/EntryItem.jsx

import React from 'react';

const EntryItem = ({ entry, onEdit, onTogglePin, onDelete }) => {
    return (
        <div className="card mb-3 shadow-sm">
            <div className={`card-body ${entry.entryStatus === 'PINNED' ? 'border-start border-5 border-warning' : ''}`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2 fw-bold text-muted">
                        {entry.entryStatus === 'PINNED' && <span className="badge bg-warning text-dark">Pinned</span>}
                    </div>
                    <small className="text-muted">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('vi-VN') : 'Đang gửi...'}
                    </small>
                </div>

                <div>
                    {entry.content && <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p>}
                    
                    {entry.mediaUrl && (
                        <div className="mt-2">
                            {/* Kiểm tra loại media dựa trên URL */}
                            {entry.mediaUrl.includes('youtube.com') || entry.mediaUrl.includes('youtu.be') || entry.mediaUrl.includes('vimeo.com') ? (
                                <div className="ratio ratio-16x9">
                                    <iframe title={`video-${entry.id}`} src={entry.mediaUrl} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                </div>
                            ) : entry.mediaUrl.includes('twitter.com') || entry.mediaUrl.includes('x.com') ? (
                                <a href={entry.mediaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">Xem trên Twitter/X</a>
                            ) : (
                                <img src={entry.mediaUrl} alt="Live content" className="img-fluid rounded" />
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="card-footer bg-transparent border-0 text-end p-0 pt-2">
                    <div className="d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(entry)}>
                            ✏️ Sửa
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-info" onClick={() => onTogglePin(entry)}>
                            📌 {entry.entryStatus === 'PINNED' ? 'Bỏ ghim' : 'Ghim'}
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