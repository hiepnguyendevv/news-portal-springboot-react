// src/main/java/com/news/news_services/repository/NewsTagRepository.java
package com.news.news_services.repository;

import com.news.news_services.entity.NewsTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsTagRepository extends JpaRepository<NewsTag, Long> {

    // Tìm tất cả NewsTag theo news ID
    List<NewsTag> findByNewsId(Long newsId);

    // Tìm tất cả NewsTag theo tag ID
    List<NewsTag> findByTagId(Long tagId);

    // Xóa NewsTag theo news ID và tag ID
    void deleteByNewsIdAndTagId(Long newsId, Long tagId);

    void deleteByTagId(Long tagId);

    // Kiểm tra xem NewsTag đã tồn tại chưa
    boolean existsByNewsIdAndTagId(Long newsId, Long tagId);

    // Xóa tất cả NewsTag theo news ID
    void deleteByNewsId(Long newsId);

    // Tìm tin tức theo tag ID
    @Query("SELECT nt.news FROM NewsTag nt WHERE nt.tag.id = :tagId AND nt.news.published = true")
    List<NewsTag> findPublishedNewsByTagId(@Param("tagId") Long tagId);

}