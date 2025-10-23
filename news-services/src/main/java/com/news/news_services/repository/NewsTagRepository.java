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

    //tìm tất cả NewsTag theo news id 
    List<NewsTag> findByNewsId(Long newsId);

    //tìm tất cả NewsTag theo tag id
    List<NewsTag> findByTagId(Long tagId);

    //xóa NewsTag theo news id và tag id
    void deleteByNewsIdAndTagId(Long newsId, Long tagId);

    void deleteByTagId(Long tagId);

    //kiểm tra xem NewsTag đã tồn tại chưa
    boolean existsByNewsIdAndTagId(Long newsId, Long tagId);

    //xóa tất cả NewsTag theo news id
    void deleteByNewsId(Long newsId);

    //tìm tin tức theo tag id
    @Query("SELECT nt.news FROM NewsTag nt WHERE nt.tag.id = :tagId AND nt.news.published = true")
    List<NewsTag> findPublishedNewsByTagId(@Param("tagId") Long tagId);

}