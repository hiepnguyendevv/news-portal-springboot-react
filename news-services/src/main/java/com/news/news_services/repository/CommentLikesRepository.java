package com.news.news_services.repository;

import com.news.news_services.entity.Comment;
import com.news.news_services.entity.CommentLike;
import com.news.news_services.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface CommentLikesRepository extends JpaRepository<CommentLike,Long> {
    boolean existsByUserAndComment(User user, Comment comment);
    Optional<CommentLike> findByUserAndComment(User user, Comment comment);
    Long countByComment(Comment comment);
    void deleteByUserAndComment(User user, Comment comment);
    void deleteByCommentId(Long comment_id);


    @Modifying
    @Transactional
    @Query("delete from CommentLike cl where cl.comment.news.id = :newsId")
    void deleteByNewsId(@Param("newsId") Long newsId);
    
    // Xóa tất cả CommentLike của user
    void deleteByUserId(Long userId);
}
