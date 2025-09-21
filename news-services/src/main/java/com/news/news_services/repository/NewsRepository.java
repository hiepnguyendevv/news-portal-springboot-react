package com.news.news_services.repository;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    // Tìm tin đã xuất bản
    List<News> findByPublishedTrueOrderByCreatedAtDesc();


    // Tìm kiếm
    @Query("SELECT n FROM News n WHERE n.published = true AND " +
            "(LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY n.createdAt DESC")
    List<News> searchByKeyword(@Param("keyword") String keyword);


    @Query("SELECT n FROM News n JOIN n.category c WHERE n.published = true AND c.name = :categoryName ORDER BY n.createdAt DESC")
    List<News> findByCategoryNameAndPublishedTrueOrderByCreatedAtDesc(@Param("categoryName") String categoryName);

    // Lấy news theo category slug
    @Query("SELECT n FROM News n JOIN n.category c WHERE n.published = true AND c.slug = :categorySlug ORDER BY n.createdAt DESC")
    List<News> findByCategorySlugAndPublishedTrueOrderByCreatedAtDesc(@Param("categorySlug") String categorySlug);

    long countByCategoryId(Long categoryId);

    // Lấy tin tức của user theo authorId
    List<News> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}