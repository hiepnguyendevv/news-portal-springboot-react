package com.news.news_services.repository;

import com.news.news_services.entity.Comment;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;


import java.time.LocalDate;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    //Lấy comment gốc
    List<Comment> findByNewsAndParentIsNullOrderByCreatedAtDesc(News news);

    //Lấy replies theo comment gốc
    List<Comment> findByParentIdOrderByCreatedAtDesc(Long parentId);

    //Lấy tất cả con cháu của comment
    @Query("SELECT c FROM Comment c where c.path LIKE :pathPattern ORDER BY c.path ASC")
    List<Comment> findByPathStartingWith(@Param("pathPattern") String pathPattern);

    //Lấy comment theo độ sâu
    @Query("Select c from Comment c where c.news.id = :newsId and c.depth = :depth Order by c.path ASC")
    List<Comment> findByNewsIdAndDepth(@Param("newsId") Long newsId, @Param("depth") Integer depth);

    //Lấy tất cả các comment của tin tức, sắp xếp theo path
    @Query("Select c from Comment c where c.news.id = :newsId order by c.path ASC")
    List<Comment> findByNews(@Param("newsId") Long newsId);

    //--------Admin---------//
    //lấy comment cho  admin
    void deleteByNewsId(Long newsId);

    void deleteByUserId(Long userId);

    @Query("SELECT c FROM Comment c " +
            "LEFT JOIN FETCH c.user u " +
            "LEFT JOIN FETCH c.news n " +
            "ORDER BY c.createdAt DESC")
    Page<Comment> getAllCommentForAdmin(Pageable pageable);

    @Query("SELECT c FROM Comment c " +
            "LEFT JOIN FETCH c.user u " +
            "LEFT JOIN FETCH c.news n " +
            "WHERE (:content IS NULL OR c.content LIKE %:content%) " +
            "AND (:author IS NULL OR u.fullName LIKE %:author%) " +
            "AND (:news IS NULL OR n.title LIKE %:news%) " +
            "AND (:status IS NULL OR " +
            "  (:status = 'active' AND c.delete = false) OR " +
            "  (:status = 'deleted' AND c.delete = true) OR " +
            "  (:status = 'all')) " +
            "ORDER BY c.createdAt DESC")
    Page<Comment> searchComment(@Param("content") String content,
                                @Param("author") String author,
                                @Param("news") String news,
                                @Param("status") String status,
                                Pageable pageable);

    Page<Comment> findByUserId(Long user, Pageable pageable);
    //tìm kiếm comment theo nội dung
    @Query("select c from Comment c where c.content like %:keywork%")
    List<Comment> findByContent(@Param("keywork") String keywork);
}
