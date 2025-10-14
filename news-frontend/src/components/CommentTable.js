import React from 'react';
import { Link } from 'react-router-dom';

const CommentTable = ({ comments, page = 0, pageSize = 20, onRestore, onDeleteAsk, onSoftDelete }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const StatusBadge = ({ deleted }) => (
    deleted ? <span className="badge bg-danger">Đã xóa</span>
            : <span className="badge bg-success">Hoạt động</span>
  );

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>STT</th>
            <th>Nội dung</th>
            <th>Tác giả</th>
            <th>Bài viết</th>
            <th>Trạng thái</th>
            <th>Likes</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
            {/* {console.log("comments",comments)} */}
          {comments.map((c, i) => (
            <tr key={c.id}>
              <td>{page * pageSize + i + 1}</td>
              <td style={{ maxWidth: 360, maxHeight: '120px' }}>
                <div style={{ 
                  maxHeight: '100px',
                  overflowY: 'auto',
                  lineHeight: '1.4',
                  padding: '4px'
                }}>
                  <p className="mb-1">{c.content}</p>
                </div>
                {c.depth > 0 && (
                  <small className="text-muted"><i className="fas fa-reply me-1" />Reply (Level {c.depth})</small>
                )}
              </td>
              <td>
                <strong>{c.authorName}</strong><br />
                <small className="text-muted">{c.authorEmail}</small>
              </td>
              <td style={{ maxWidth: 250, maxHeight: '120px' }}>
                <div style={{ 
                  maxHeight: '100px',
                  overflowY: 'auto',
                  lineHeight: '1.4',
                  padding: '4px'
                }}>
                  <Link to={`/${c.newsSlug}-${c.newsId}`} className="text-decoration-none text-primary-emphasis"><strong>{c.newsTitle}</strong></Link>
                </div>
              </td>
              <td><StatusBadge deleted={c.deleted} /></td>
              <td>
                <span className="badge bg-primary"><i className="fas fa-heart me-1" />{c.likeCount || 0}</span>
              </td>
             
              <td>
                <small>{formatDate(c.createdAt)}</small>
                {c.deletedAt && (
                  <>
                    <br />
                    <small className="text-danger">Xóa: {formatDate(c.deletedAt)}</small>
                  </>
                )}
              </td>
              <td>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-danger" onClick={() => onDeleteAsk(c.id)} title="Xóa vĩnh viễn">
                    <i className="fas fa-trash" />
                  </button>
 
                  {c.deleted ? (
                    <button className="btn btn-outline-success" onClick={() => onRestore(c.id)} title="Khôi phục">
                      <i className="fas fa-undo" />
                    </button>
                  ) : (
                    <button className="btn btn-outline-warning" onClick={() => onSoftDelete(c.id)} title="Xóa tạm thời">
                      <i className="fas fa-ban" />
                    </button>
                  )}
                 
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CommentTable;