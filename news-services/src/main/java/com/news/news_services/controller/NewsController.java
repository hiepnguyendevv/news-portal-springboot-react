package com.news.news_services.controller;

import com.news.news_services.entity.*;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.service.NewsService;
import com.news.news_services.service.TagService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:3000")
public class NewsController {

    @Autowired
    private NewsService newsService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private TagService tagService;

    //test kết nối database
    @GetMapping("/test")
    public String testConnection() {
        return newsService.testConnection();
    }




    //lấy tin tức theo id 
    @GetMapping("/{id}")
    public ResponseEntity<?> getNewsById(@PathVariable Long id) {
        try {
            News news = newsService.getNewsDetailForCurrentUser(id);
            if (news == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(news);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //lấy tin tức đã xuất bản
    @GetMapping("/published")
    public List<News> getPublishedNews() {
        return newsService.getPublishedNews();
    }

    //lấy tin tức đã xuất bản với phân trang
    @GetMapping("/published/paged")
    public ResponseEntity<?> getPublishedNewsPaged(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "12") int size) {
        try {
            return ResponseEntity.ok(newsService.getPublishedNewsPagedMap(page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //lấy tin tức theo category
    @GetMapping("/category/{category}")
    public List<News> getNewsByCategory(@PathVariable String category) {
        return newsService.getNewsByCategory(category);
    }

    //lấy tin tức theo category slug
    @GetMapping("/category/slug/{slug}")
    public List<News> getNewsByCategorySlug(@PathVariable String slug) {
        return newsService.getNewsByCategorySlug(slug);
    }

    //lấy tin tức sắp xếp theo view count
    @GetMapping("/view-desc")
    public Page<News> getNewsSortByViewDesc(@RequestParam(defaultValue = "0")int page,
                                            @RequestParam(defaultValue = "20")int size){
        Pageable pageable = PageRequest.of(page,size);
        return newsService.getNewsSortByViewDesc(pageable);
    }

    @GetMapping("/view-asc")
    public Page<News> getNewsSortByViewAsc(@RequestParam(defaultValue = "0")int page,
                                           @RequestParam(defaultValue = "20")int size){
        Pageable pageable = PageRequest.of(page,size);

        return newsService.getNewsSortByViewAsc(pageable);
    }
    //tìm kiếm tin tức theo từ khóa
    @GetMapping("/search")
    public List<News> searchNews(@RequestParam String keyword) {
        return newsService.searchNews(keyword);
    }


    //import dữ liệu mẫu
    @PostMapping("/import-data")
    public Map<String, Object> importSampleData() {
        return newsService.importSampleData();
    }

    //xóa tất cả dữ liệu
    @PostMapping("/clear-all-data")
    public Map<String, Object> clearAllData() {
        return newsService.clearAllData();
    }

    //lấy tin tức của user hiện tại
    @GetMapping("/my-news")
    public ResponseEntity<?> getMyNews() {
        try {
            return ResponseEntity.ok(newsService.getMyNewsOfCurrentUser());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi lấy tin tức: " + e.getMessage()));
        }
    }

    //tác giả gửi bài để duyệt
    @PostMapping("/my-news/{id}/submit")
    public ResponseEntity<?> submitMyNewsForReview(@PathVariable Long id)   {
        try {
            return ResponseEntity.ok(newsService.submitMyNewsForReview(id));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi gửi duyệt: " + e.getMessage()));
        }
    }

    //tạo tin tức mới (cho user)
    @PostMapping("/my-news")
    public ResponseEntity<?> createMyNews(@RequestBody Map<String, Object> newsData) {
        try {
            return ResponseEntity.ok(newsService.createMyNews(newsData));
        } catch (Exception e) {
            System.err.println("Error creating my news: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    //cập nhật tin tức của user
    @PutMapping("/my-news/{id}")
    public ResponseEntity<?> updateMyNews(@PathVariable Long id, @RequestBody Map<String, Object> newsData) {
        try {
            return ResponseEntity.ok(newsService.updateMyNews(id, newsData));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật tin tức: " + e.getMessage()));
        }
    }

    //xóa tin tức của 
    @DeleteMapping("/my-news/{id}")
    public ResponseEntity<?> deleteMyNews(@PathVariable Long id) {
        try {
            newsService.deleteMyNews(id);
            return ResponseEntity.ok(Map.of("message", "Xóa tin tức thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa tin tức: " + e.getMessage()));
        }
    }

    //đếm view count
    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> incrementView(HttpServletRequest request, @PathVariable Long id){
        Long newCount = newsService.incrementViewWithVisitorData(
                id,
                request.getHeader("User-Agent"),
                request.getHeader("X-Forwared-For"),
                request.getRemoteAddr(),
                SecurityContextHolder.getContext().getAuthentication()
        );
        return ResponseEntity.ok(Map.   of("viewCount", newCount));
    }



}