import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { newsAPI } from '../services/api';

const CommentSection = ({ newsId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    try {
      const response = await newsAPI.getComments(newsId);
      const commentsData = response.data || [];
      // console.log(commentsData);
      setComments(commentsData);

      const likedSet = new Set();
      const extractLikedStatus = (comments) => {
        comments.forEach(comment => {
          if(comment.liked){
            likedSet.add(comment.id);
          }
          if(comment.replies && comment.replies.length > 0){
            extractLikedStatus(comment.replies);
          }
        });
      };
      extractLikedStatus(commentsData);
      setLikedComments(likedSet);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      await newsAPI.addComment(newsId, newComment);
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleSubmitReply = async (parentId) => {
    try {
      await newsAPI.addComment(newsId, replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
      
      // Reload toàn bộ comments và replies
      await loadComments();
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await newsAPI.deleteComment(commentId);
      loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {

      const isLiked = likedComments.has(commentId);
      if(isLiked){
        // console.log('unlike comment');
        await newsAPI.unlikeComment(commentId);
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }else{
        // console.log('like comment');
        await newsAPI.likeComment(commentId);
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(commentId);
          return newSet;
        });
      }
      await loadComments();
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm tìm tên người được reply dựa trên path
  const findRepliedUserName = (reply, allReplies) => {
    if (!reply.path) return null;
    
    const pathParts = reply.path.split('.');
    if (pathParts.length < 2) return null; // Không phải reply
    
    // Lấy parent ID (phần cuối cùng trước ID hiện tại)
    const parentId = pathParts[pathParts.length - 2];
    const parent = allReplies.find(r => r.id.toString() === parentId);
    return parent ? (parent.fullName || parent.userName || 'Anonymous') : null;
  };

  const renderReplies = (replies) => {
    
    if (!replies || replies.length === 0) {
      return null;
    }
    
    return replies.map(reply => {
      const repliedUserName = findRepliedUserName(reply, replies);
      const displayContent = repliedUserName 
        ? (
            <>
              <span className="text-primary fw-bold">@{repliedUserName}</span> {reply.content}
            </>
          )
        : reply.content;
      
       return (
         <div key={reply.id} className="reply-item border-start border-primary ps-3 mb-3 bg-light rounded p-2">
          <div className="d-flex align-items-start mb-1">
            <strong className="text-black">{reply.fullName || reply.userName || 'Anonymous'}</strong>
            <span className="ms-1">
              {displayContent}
              </span>
            <small className="text-muted ms-2">{formatDate(reply.createdAt)}</small>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="button"
              className={`btn btn-sm ${likedComments.has(reply.id) ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleLikeComment(reply.id)}
              disabled={!user || reply.deleted}
            >
              👍 {reply.likeCount || 0}
            </button>
            <button 
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setReplyingTo(reply.id)}
              disabled={!user || reply.deleted}
            >
              Trả lời
            </button>
            {user && user.id === reply.userId && (
              <button 
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteComment(reply.id)}
                disabled={!user || reply.deleted}
              >
                Xóa
              </button>
            )}
          </div>
          
          {/* Form trả lời cho reply */}
          {replyingTo === reply.id && (
            <div className="reply-form mt-3">
              <div className="mb-2">
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Viết trả lời..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2">
                <button 
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSubmitReply(reply.id)}
                >
                  Gửi trả lời
                </button>
                <button 
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <div className="text-center py-3">Đang tải bình luận...</div>;
  }

  return (
    <div className="comment-section mt-4">
      <h5>Bình luận ({comments?.length || 0})</h5>
      
      {/* Form thêm bình luận */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-4">
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Gửi bình luận
          </button>
        </form>
      ) : (
        <div className="alert alert-info">
          <a href="/login" className="btn btn-primary">Đăng nhập</a> để bình luận
        </div>
      )}

      {/* Danh sách bình luận */}
      <div className="comments-list">
        {comments && comments.map(comment => (
          <div key={comment.id} className="comment-item border-bottom py-3">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <strong>{comment.fullName || comment.userName || 'Anonymous'}</strong>
                  <small className="text-muted ms-2">{formatDate(comment.createdAt)}</small>
                </div>
                <p className="mb-2">{comment.content}</p>
                <div className="d-flex gap-2">
                  <button 
                    className={`btn btn-sm ${likedComments.has(comment.id) ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={!user || comment.deleted}
                  >
                    👍 {comment.likeCount || 0}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setReplyingTo(comment.id)}
                    disabled={!user || comment.deleted}
                  >
                    Trả lời
                  </button>
                  {user && user.id === comment.userId && (
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={!user || comment.deleted}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Hiển thị replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="replies ms-4 mt-3">
                <h6 className="text-muted mb-2">Trả lời ({comment.replies.length})</h6>
                {renderReplies(comment.replies)}
              </div>
            )}
            
            {/* Form trả lời */}
            {replyingTo === comment.id && (
              <div className="reply-form mt-3 ms-4">
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Viết trả lời..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSubmitReply(comment.id)}
                  >
                    Gửi trả lời
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {(!comments || comments.length === 0) && (
        <div className="text-center py-4 text-muted">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      )}
    </div>
  );
};

export default CommentSection;