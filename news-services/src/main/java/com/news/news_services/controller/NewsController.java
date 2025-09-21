package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.UserPrincipal;
import com.news.news_services.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    // Test kết nối database
    @GetMapping("/test")
    public String testConnection() {
        return newsService.testConnection();
    }

    // Lấy tất cả tin tức
    @GetMapping
    public List<News> getAllNews() {
        return newsService.getAllNews();
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

    // Tìm kiếm tin tức theo từ khóa
    @GetMapping("/search")
    public List<News> searchNews(@RequestParam String keyword) {
        return newsService.searchNews(keyword);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createNews(@RequestBody Map<String, Object> newsData) {

        try {
            //Tạo News entity mới
            News news = new News();
            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setImageUrl((String) newsData.get("imageUrl"));
            news.setPublished((Boolean) newsData.get("published"));
            news.setFeatured((Boolean) newsData.get("featured"));

            // 🔧 Convert authorId thành User object
            Integer authorId = Integer.valueOf(newsData.get("authorId").toString());
            if (authorId != null) {
                User author = userRepository.findById(authorId.longValue())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + authorId));
                news.setAuthor(author);
            }

            // 🔧 Convert categoryId thành Category object
            Integer categoryId = Integer.valueOf(newsData.get("categoryId").toString());
            if (categoryId != null) {
                Category category = categoryRepository.findById(categoryId.longValue())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
                news.setCategory(category);
            }

            News savedNews = newsRepository.save(news);
            return ResponseEntity.ok(savedNews);

        } catch (Exception e) {
            System.err.println("Error creating news: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    String deleteNews(@PathVariable Long id) {

//        Long categoryId = Long.parseLong(id);

        if(!newsRepository.existsById(id)){
            throw new RuntimeException("News not found with id: " + id);
        }
        System.out.println(id);
        newsRepository.deleteById(id);
        return "News deleted successfully";
    }


    //UpdateStatus
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateNewsStatus(@PathVariable Long id, @RequestBody Map<String, Object> statusData) {
        try {
            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            // Cập nhật published status nếu có
            if (statusData.containsKey("published")) {
                Boolean published = (Boolean) statusData.get("published");
                news.setPublished(published);
            }

            // Cập nhật featured status nếu có
            if (statusData.containsKey("featured")) {
                Boolean featured = (Boolean) statusData.get("featured");
                news.setFeatured(featured);
            }

            News updatedNews = newsRepository.save(news);
            return ResponseEntity.ok(updatedNews);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }

    // Thêm endpoint cập nhật toàn bộ tin tức
    @PutMapping("/{id}")
    public ResponseEntity<?> updateNews(@PathVariable Long id, @RequestBody Map<String, Object> newsData) {
        try {
            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            // Cập nhật các trường cơ bản
                news.setTitle((String) newsData.get("title"));
                news.setContent((String) newsData.get("content"));
                news.setSummary((String) newsData.get("summary"));
                news.setImageUrl((String) newsData.get("imageUrl"));
                news.setPublished((Boolean) newsData.get("published"));
                news.setFeatured((Boolean) newsData.get("featured"));


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
            news.setImageUrl((String) newsData.get("imageUrl"));
            news.setPublished((Boolean) newsData.get("published"));
            news.setFeatured((Boolean) newsData.get("featured"));

            // Set author từ user hiện tại
            User author = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            news.setAuthor(author);

            // Set category nếu có
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
            news.setPublished((Boolean) newsData.get("published"));
            news.setFeatured((Boolean) newsData.get("featured"));

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
}