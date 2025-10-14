package com.news.news_services.dto;

import com.news.news_services.entity.Comment;
import java.time.Instant;
import java.util.List;

public class  CommentWithRepliesDto {
    private Long id;
    private String content;
    private Instant createdAt;
    private Integer likeCount;
    private Long userId;
    private String userName;

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    private String fullName;
    private String path;
    private boolean isLiked;
    private boolean deleted;
    private List<CommentWithRepliesDto> replies; // Self-reference cho replies

    public static CommentWithRepliesDto from(Comment comment, List<CommentWithRepliesDto> replies) {
        CommentWithRepliesDto dto = new CommentWithRepliesDto();
        dto.setId(comment.getId());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setLikeCount(comment.getLikeCount());
        dto.setPath(comment.getPath());
        dto.setDeleted(comment.isDelete());
        if(comment.isDelete()){
            dto.setContent("Bình luận đã bị xóa");
            dto.setFullName(null);
        }else{
            dto.setContent(comment.getContent());
            if (comment.getUser() != null) {
                dto.setUserId(comment.getUser().getId());
                dto.setUserName(comment.getUser().getUsername());
                dto.setFullName(comment.getUser().getFullName());
            }
        }
        

        
        dto.setReplies(replies);
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public boolean isLiked() {
        return isLiked;
    }

    public void setLiked(boolean liked) {
        isLiked = liked;
    }

    public Integer getLikeCount() { return likeCount; }
    public void setLikeCount(Integer likeCount) { this.likeCount = likeCount; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public List<CommentWithRepliesDto> getReplies() { return replies; }
    public void setReplies(List<CommentWithRepliesDto> replies) { this.replies = replies; }
}
