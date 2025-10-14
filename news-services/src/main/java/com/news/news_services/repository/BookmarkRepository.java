package com.news.news_services.repository;

import com.news.news_services.entity.Bookmark;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark,Long> {
    Optional<Bookmark> findByUserAndNews(User user, News news);
    boolean existsByUserAndNews(User user, News news);
    Page<Bookmark> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    void deleteByNewsId(Long newsId);
    void deleteByUserId(Long userId);
}
