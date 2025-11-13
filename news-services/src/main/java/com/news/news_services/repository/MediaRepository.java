package com.news.news_services.repository;

import com.news.news_services.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MediaRepository extends JpaRepository<Media,Long> {
    void deleteByNewsId(Long id);
    
    // Tìm các media theo danh sách ID, uploader và chưa có news
    @Query("SELECT m FROM Media m WHERE m.id IN :mediaIds AND m.uploader.id = :uploaderId AND m.news IS NULL")
    List<Media> findByIdsAndUploaderAndNewsIsNull(@Param("mediaIds") List<Long> mediaIds, 
                                                   @Param("uploaderId") Long uploaderId);
}
