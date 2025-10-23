package com.news.news_services.repository;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    //tìm tin đã xuất bản       
    List<News> findByPublishedTrueOrderByCreatedAtDesc();
    
    //tìm tin đã xuất bản với phân trang
    Page<News> findByPublishedTrueOrderByCreatedAtDesc(Pageable pageable);


    //tìm kiếm
    @Query("SELECT n FROM News n WHERE n.published = true AND " +
            "(LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY n.createdAt DESC")
    List<News> searchByKeyword(@Param("keyword") String keyword);


    @Query("SELECT n FROM News n JOIN n.category c WHERE n.published = true AND c.name = :categoryName ORDER BY n.createdAt DESC")
    List<News> findByCategoryNameAndPublishedTrueOrderByCreatedAtDesc(@Param("categoryName") String categoryName);

    //lấy news theo category slug
    @Query("SELECT n FROM News n JOIN n.category c WHERE n.published = true AND c.slug = :categorySlug ORDER BY n.createdAt DESC")
    List<News> findByCategorySlugAndPublishedTrueOrderByCreatedAtDesc(@Param("categorySlug") String categorySlug);

    long countByCategoryId(Long categoryId);

    @Modifying
    @Query("UPDATE News n SET n.viewCount = n.viewCount + 1 WHERE n.id = :id")
            int incrementViewCount(@Param("id") Long id);

    //lấy tin tức của user theo authorId
    List<News> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    //xóa tin tức theo authorId
    @Modifying
    void deleteByAuthorId(Long authorId);

    Page<News> findByPublishedTrueOrderByViewCountDesc(Pageable pageable);

    Page<News> findByPublishedTrueOrderByViewCountAsc(Pageable pageable);

    Page<News> findAllByOrderByCreatedAtDesc(Pageable pageable);

    //search
    SELECT n FROM News n
    WHERE (:q IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(n.content) LIKE LOWER(CONCAT('%', :q, '%')))
      AND (:categoryId IS NULL OR n.category.id = :categoryId)
      AND (:published IS NULL OR n.published = :published)
      AND (:status IS NULL OR n.status = :status)
      AND (:featured IS NULL OR n.featured = :featured)
    """)
    Page<News> adminSearch(
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("published") Boolean published,
            @Param("status") News.Status status,
            @Param("featured") Boolean featured,
            Pageable pageable
    );
}