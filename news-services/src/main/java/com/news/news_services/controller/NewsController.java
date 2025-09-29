package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.UserPrincipal;
import com.news.news_services.service.HelperService;
import com.news.news_services.service.NewsService;
import com.news.news_services.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:3000")
public class NewsController {

    @Autowired
    private NewsService newsService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private HelperService helperService;

    @Autowired
    private NotificationService notificationService;
    // Test kết nối database
    @GetMapping("/test")
    public String testConnection() {
        return newsService.testConnection();
    }



    // Lấy tin tức theo ID
    @GetMapping("/{id}")
    public News getNewsById(@PathVariable Long id) {
        return newsService.getNewsById(id);
    }

    // Lấy tin tức đã xuất bản
    @GetMapping("/published")
    public List<News> getPublishedNews() {
        return newsService.getPublishedNews();
    }

    // Lấy tin tức theo category
    @GetMapping("/category/{category}")
    public List<News> getNewsByCategory(@PathVariable String category) {
        return newsService.getNewsByCategory(category);
    }

    // Lấy tin tức theo category slug
    @GetMapping("/category/slug/{slug}")
    public List<News> getNewsByCategorySlug(@PathVariable String slug) {
        return newsService.getNewsByCategorySlug(slug);
    }

    //Lấy tin tức sắp xếp theo view count
    @GetMapping("/view-desc")
    public List<News> getNewsSortByViewDesc(){
        return newsRepository.findByPublishedTrueOrderByViewCountDesc();
    }

    @GetMapping("/view-asc")
    public List<News> getNewsSortByViewAsc(){
        return newsRepository.findByPublishedTrueOrderByViewCountAsc();
    }
    // Tìm kiếm tin tức theo từ khóa
    @GetMapping("/search")
    public List<News> searchNews(@RequestParam String keyword) {
        return newsService.searchNews(keyword);
    }


    // Import dữ liệu mẫu
    @PostMapping("/import-data")
    public Map<String, Object> importSampleData() {
        return newsService.importSampleData();
    }

    // Xóa tất cả dữ liệu
    @PostMapping("/clear-all-data")
    public Map<String, Object> clearAllData() {
        return newsService.clearAllNews();
    }

    // ========== MY NEWS ENDPOINTS ==========
    
    // Lấy tin tức của user hiện tại
    @GetMapping("/my-news")
    public ResponseEntity<?> getMyNews() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            
            List<News> myNews = newsRepository.findByAuthorIdOrderByCreatedAtDesc(userPrincipal.getId());
            return ResponseEntity.ok(myNews);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi lấy tin tức: " + e.getMessage()));
        }
    }

    // Tác giả gửi bài để duyệt
    @PostMapping("/my-news/{id}/submit")
    public ResponseEntity<?> submitMyNewsForReview(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Bạn không có quyền gửi bài này"));
            }

            news.setStatus(News.Status.PENDING_REVIEW);
            news.setPublished(false);
            news.setFeatured(false);

            News updated = newsRepository.save(news);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi gửi duyệt: " + e.getMessage()));
        }
    }

    // Tạo tin tức mới (cho user)
    @PostMapping("/my-news")
    public ResponseEntity<?> createMyNews(@RequestBody Map<String, Object> newsData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            
            // Tạo News entity mới
            News news = new News();
            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setSlug(helperService.toSlug((String) newsData.get("title"))); 
            news.setImageUrl((String) newsData.get("imageUrl"));
            news.setPublished(false);
            news.setFeatured(false);
            news.setStatus(News.Status.DRAFT);

            User author = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            news.setAuthor(author);

            if (newsData.containsKey("categoryId")) {
                Integer categoryId = Integer.valueOf(newsData.get("categoryId").toString());
                Category category = categoryRepository.findById(categoryId.longValue())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
                news.setCategory(category);
            }

            News savedNews = newsRepository.save(news);
            return ResponseEntity.ok(savedNews);

        } catch (Exception e) {
            System.err.println("Error creating my news: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Cập nhật tin tức của user
    @PutMapping("/my-news/{id}")
    public ResponseEntity<?> updateMyNews(@PathVariable Long id, @RequestBody Map<String, Object> newsData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            //  Kiểm tra quyền sở hữu
            if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
                return ResponseEntity.status(403)
                    .body(Map.of("error", "Bạn không có quyền chỉnh sửa tin tức này"));
            }


            // Cập nhật các trường
            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setImageUrl((String) newsData.get("imageUrl"));
            // Tác giả cập nhật vẫn luôn giữ trạng thái nháp, không nổi bật
            news.setPublished(false);
            news.setFeatured(false);
            news.setStatus(News.Status.DRAFT);

            // Cập nhật category nếu có
            if (newsData.containsKey("categoryId")) {
                Integer categoryId = Integer.valueOf(newsData.get("categoryId").toString());
                Category category = categoryRepository.findById(categoryId.longValue())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
                news.setCategory(category);
            }

            News updatedNews = newsRepository.save(news);
            return ResponseEntity.ok(updatedNews);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật tin tức: " + e.getMessage()));
        }
    }

    // Xóa tin tức của user
    @DeleteMapping("/my-news/{id}")
    public ResponseEntity<?> deleteMyNews(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            // Kiểm tra quyền sở hữu
            if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
                return ResponseEntity.status(403)
                    .body(Map.of("error", "Bạn không có quyền xóa tin tức này"));
            }

            newsRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Xóa tin tức thành công"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa tin tức: " + e.getMessage()));
        }
    }

    //Đếm view
    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> incrementView(HttpServletRequest request, @PathVariable Long id){

        String ua = request.getHeader("User-Agent");
        String ip = request.getHeader("X-Forwared-For");

        if(ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        String visitorKey;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal up) {
            visitorKey = "u:" + up.getId();
        } else {
            String raw = (ip == null ? "" : ip) + "|" + (ua == null ? "" : ua);
            visitorKey = "g:" + Integer.toHexString(raw.hashCode());
        }

        Long newCount = newsService.incrementViewCountWithCoolDown(id, visitorKey, Duration.ofMinutes(3));
        if (newCount == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("viewCount", newCount));
    }

}