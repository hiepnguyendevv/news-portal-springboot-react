package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.service.HelperService;
import com.news.news_services.service.NewsService;
import com.news.news_services.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin/news")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminNewsController {
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

    // Lấy tất cả tin tức
    @GetMapping
    public List<News> getAllNews() {
        return newsRepository.findAllByOrderByCreatedAtDesc();
    }

    //tạo news
    @PostMapping
    public ResponseEntity<?> createNews(@RequestBody Map<String, Object> newsData) {

        try {
            //Tạo News entity mới
            News news = new News();
            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setSlug(helperService.toSlug(newsData.get("slug").toString()));
            news.setImageUrl((String) newsData.get("imageUrl"));
            news.setPublished((Boolean) newsData.get("published"));
            news.setFeatured((Boolean) newsData.get("featured"));

            Integer authorId = Integer.valueOf(newsData.get("authorId").toString());
            if (authorId != null) {
                User author = userRepository.findById(authorId.longValue())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + authorId));
                news.setAuthor(author);
            }

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

    //update news
    @PutMapping("/{id}")
    public ResponseEntity<?> updateNews(@PathVariable Long id, @RequestBody Map<String, Object> newsData) {
        try {
            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setImageUrl((String) newsData.get("imageUrl"));
            news.setPublished((Boolean) newsData.get("published"));
            news.setFeatured((Boolean) newsData.get("featured"));
            if (Boolean.TRUE.equals(news.getPublished())) {
                news.setStatus(News.Status.PUBLISHED);
            }
            if (newsData.containsKey("reviewNote")) {
                news.setReviewNote((String) newsData.get("reviewNote"));
            }

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

    // Xóa news
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

            if (statusData.containsKey("published")) {
                Boolean published = (Boolean) statusData.get("published");
                news.setPublished(published);
                if (Boolean.TRUE.equals(published)) {
                    news.setStatus(News.Status.PUBLISHED);
                } else {
                    news.setStatus(News.Status.DRAFT);
                }
            }

            // Cập nhật featured status nếu có
            if (statusData.containsKey("featured")) {
                Boolean featured = (Boolean) statusData.get("featured");
                news.setFeatured(featured);
            }

            // Cập nhật review note nếu có
            if (statusData.containsKey("reviewNote")) {
                String note = (String) statusData.get("reviewNote");
                news.setReviewNote(note);
            }

            News updatedNews = newsRepository.save(news);

            if (Boolean.FALSE.equals(news.getPublished())) {
                String title = "Bài viết bị từ chối";
                String message = "Bài '" + news.getTitle() + "' đã bị từ chối." +
                        (news.getReviewNote() != null && !news.getReviewNote().isBlank() ?
                                " Lý do: " + news.getReviewNote() : "");
                String link = "/my-news/edit/" + news.getId();
                notificationService.create(news.getAuthor(), title, message, link);
            }
            return ResponseEntity.ok(updatedNews);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }





}
