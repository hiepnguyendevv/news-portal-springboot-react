package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.*;
import com.news.news_services.service.HelperService;
import com.news.news_services.service.NewsService;
import com.news.news_services.service.NotificationService;
import com.news.news_services.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin/news")
//@CrossOrigin(origins = "http://localhost:3000")
public class AdminNewsController {
    @Autowired
    private NewsService newsService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;
    @Autowired
    private NewsTagRepository newsTagRepository;

    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private CommentLikesRepository commentLikesRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private HelperService helperService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TagService tagService;
    // Lấy tất cả tin tức
    @GetMapping
    public Page<News> getAllNews(@RequestParam(defaultValue = "0")int page,
                                 @RequestParam(defaultValue = "20")int size) {
        Pageable pageable = PageRequest.of(page,size);
        return newsRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchAdminNews(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             @RequestParam(required = false) String filter,
                                             @RequestParam(required = false) Long category,
                                             @RequestParam(required = false, name = "q") String q,
                                             @RequestParam(required = false) String sortBy) {
        Page<News> result = newsService.adminSearchNews(filter, category, q, sortBy, page, size);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalPages", result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "page", result.getNumber(),
                "size", result.getSize()
        ));
    }

    //tạo news
    @PostMapping
    public ResponseEntity<?> createNews(@RequestBody Map<String, Object> newsData) {

        try {
            //Tạo News entity mới
            System.out.println("isRealtime:" + (Boolean)newsData.get("isRealtime"));
            System.out.println("published:" + (Boolean)newsData.get("published"));
            News news = new News();
            news.setTitle((String) newsData.get("title"));
            news.setContent((String) newsData.get("content"));
            news.setSummary((String) newsData.get("summary"));
            news.setSlug(helperService.toSlug((String)newsData.get("title")));
            news.setImageUrl((String) newsData.get("imageUrl"));
            if((Boolean) newsData.get("published")){
                news.setPublished((Boolean) newsData.get("published"));
                news.setStatus(News.Status.PUBLISHED);
            }
            if((Boolean) newsData.get("isRealtime")){
                news.setRealtime(true);
            }
            news.setFeatured((Boolean) newsData.get("featured"));

            Integer authorId = Integer.valueOf(newsData.get("authorId").toString());
                User author = userRepository.findById(authorId.longValue())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + authorId));
                news.setAuthor(author);


            Integer categoryId = Integer.valueOf(newsData.get("categoryId").toString());
                Category category = categoryRepository.findById(categoryId.longValue())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
                news.setCategory(category);


            News savedNews = newsRepository.save(news);

            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) newsData.get("tags");

            tagService.assignToNews(news.getId(),tags);
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
            List<String> tags = (List<String>) newsData.get("tags");

            tagService.assignToNews(news.getId(),tags);
            return ResponseEntity.ok(updatedNews);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi cập nhật tin tức: " + e.getMessage()));
        }
    }

    // Xóa news
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNews(@PathVariable Long id) {
        if (!newsRepository.existsById(id)) {
            throw new RuntimeException("News not found with id: " + id);
        }
        commentLikesRepository.deleteByNewsId(id);
        commentRepository.deleteByNewsId(id);
//        newsTagRepository.deleteByNewsId(id);
        bookmarkRepository.deleteByNewsId(id);

        newsRepository.deleteById(id);
        return ResponseEntity.ok("News deleted successfully");
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

            if (statusData.containsKey("featured")) {
                Boolean featured = (Boolean) statusData.get("featured");
                news.setFeatured(featured);
            }
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

    // Bulk delete news
    @DeleteMapping("/bulk")
    @Transactional
    public ResponseEntity<?> bulkDeleteNews(@RequestParam List<Long> newsIds) {
        try {
            if (newsIds == null || newsIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID tin tức không được để trống"));
            }

            int deletedCount = 0;
            for (Long id : newsIds) {
                if (newsRepository.existsById(id)) {
                    // Xóa phụ thuộc
                    commentLikesRepository.deleteByNewsId(id);
                    commentRepository.deleteByNewsId(id);
                    bookmarkRepository.deleteByNewsId(id);
                    
                    // Xóa news
                    newsRepository.deleteById(id);
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa tin tức thành công"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa tin tức: " + e.getMessage()));
        }
    }

    // Bulk approve news
    @PutMapping("/bulk/approve")
    @Transactional
    public ResponseEntity<?> bulkApproveNews(@RequestParam List<Long> newsIds) {
        try {
            if (newsIds == null || newsIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID tin tức không được để trống"));
            }


            for (Long id : newsIds) {
                News news = newsRepository.findById(id).orElse(null);
                if (news != null) {
                    news.setPublished(true);
                    news.setStatus(News.Status.PUBLISHED);
                    newsRepository.save(news);
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Đã phê duyệt tin tức thành công"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi phê duyệt tin tức: " + e.getMessage()));
        }
    }






}
