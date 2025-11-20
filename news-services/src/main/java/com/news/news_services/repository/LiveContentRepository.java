package com.news.news_services.repository;

import com.news.news_services.entity.LiveContent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveContentRepository extends JpaRepository<LiveContent,Long> {
    //tìm tất cả live content của một bài news, sắp xếp theo thời gian tạo
     List<LiveContent> findByNewsIdOrderByCreatedAtDesc(Long newsId);
    //tìm live content với phân trang
    Page<LiveContent> findByNewsIdOrderByCreatedAtDesc(Long newsId, Pageable pageable);
    //đếm số lượng live content của một bài news
    Integer countByNewsId(Long newsId);
    //tìm live content được pin
    List<LiveContent> findByNewsIdAndEntryStatusOrderByCreatedAtDesc(Long newsId, LiveContent.EntryStatus entryStatus);

    List<LiveContent> findByNewsId(Long newsId);
    Page<LiveContent> findByNewsId(Long newsId, Pageable pageable);
    void deleteById(Long id);

}
