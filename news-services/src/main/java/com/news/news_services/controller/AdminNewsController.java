package com.news.news_services.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.news.news_services.dto.NewsCreateDto;
import com.news.news_services.dto.NewsResponseDto;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.*;
import com.news.news_services.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin/news")
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

    @Autowired
    private CloudinaryService cloudinaryService;


    //lấy tất cả tin tức
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
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createMyNews(@RequestPart("image") MultipartFile imageFile,
                                          @RequestPart("news") String newJson) {
        try {

            // === BƯỚC DEBUG 1: In ra JSON ===
            System.out.println("------------------------------------");
            System.out.println("Received newsJson string:");
            System.out.println(newJson); // In chuỗi JSON nhận được
            System.out.println("------------------------------------");
            String imageUrl = cloudinaryService.uploadFile(imageFile);

            ObjectMapper mapper = new ObjectMapper();
            NewsCreateDto newsDto = mapper.readValue(newJson,NewsCreateDto.class);

            News savedNewsEntity = newsService.createMyNews(newsDto, imageUrl);

            NewsResponseDto responseDTO = new NewsResponseDto(savedNewsEntity);// Pass DTO and URL
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            System.err.println("Error creating my news: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }



    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateNews(@PathVariable Long id,
                                        @RequestPart(value = "image", required = false) MultipartFile imageFile,
                                        @RequestPart("news") String newJson) { // Đã sửa tên biến thành newJson


        try {
            String imageUrl = null;
            if (imageFile != null && !imageFile.isEmpty()) {
                System.out.println("Attempting to upload new image..."); // Thêm log
                imageUrl = cloudinaryService.uploadFile(imageFile);
                System.out.println("Upload ảnh mới thành công, URL: " + imageUrl);
            } else {
                System.out.println("No new image file provided."); // Thêm log
            }

            ObjectMapper mapper = new ObjectMapper();
            NewsCreateDto newsDto = null;

            try {
                newsDto = mapper.readValue(newJson, NewsCreateDto.class);
                System.out.println("Tạo newsDto thành công!"); // Log thành công
                // In ra nội dung DTO để kiểm tra
                System.out.println("Parsed News DTO: " + newsDto.toString()); // Cần @ToString hoặc tự in các trường
            } catch (Exception e) {
                System.err.println("!!! LỖI KHI PARSE JSON SANG NewsCreateDto !!!");
                e.printStackTrace(); // In ra toàn bộ lỗi Jackson chi tiết
                // Trả về lỗi 400 ngay lập tức với thông tin lỗi
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Lỗi định dạng dữ liệu gửi lên: " + e.getMessage()));
            }
            // === HẾT BƯỚC DEBUG 2 ===

            // Nếu parse thành công, tiếp tục gọi service
            News existingNews = newsService.updateMyNews(id, newsDto, imageUrl);
            NewsResponseDto responseDTO = new NewsResponseDto(existingNews);
            return ResponseEntity.ok(responseDTO);

        } catch (Exception e) { // Bắt các lỗi khác (ví dụ: lỗi service)
            System.err.println("!!! LỖI TRONG QUÁ TRÌNH UPDATE NEWS !!!");
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi cập nhật tin tức: " + e.getMessage()));
        }
    }

    //xóa news
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNews(@PathVariable Long id) {
        if (!newsRepository.existsById(id)) {
            throw new RuntimeException("News not found with id: " + id);
        }
        News news = newsRepository.findById(id).orElseThrow();

        commentLikesRepository.deleteByNewsId(id);
        commentRepository.deleteByNewsId(id);
        bookmarkRepository.deleteByNewsId(id);

        newsService.deleteMyNews(id);
        return ResponseEntity.ok("News deleted successfully");
    }

    //update status
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

    //bulk delete news
    @DeleteMapping("/bulk")
    @Transactional
    public ResponseEntity<?> bulkDeleteNews(@RequestParam List<Long> newsIds) {
        try {
            if (newsIds == null || newsIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID tin tức không được để trống"));
            }

            for (Long id : newsIds) {
                if (newsRepository.existsById(id)) {
                    //xóa phụ thuộc
                    commentLikesRepository.deleteByNewsId(id);
                    commentRepository.deleteByNewsId(id);
                    bookmarkRepository.deleteByNewsId(id);

                    //xóa news
                    newsService.deleteMyNews(id);
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

    //bulk approve news
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
