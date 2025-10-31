package com.news.news_services.controller;

import com.news.news_services.dto.NewsCreateDto;
import com.news.news_services.dto.NewsResponseDto;
import com.news.news_services.entity.*;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.service.CloudinaryService;
import com.news.news_services.service.NewsService;
import com.news.news_services.service.TagService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
@RestController
@RequestMapping("/api/news")
public class NewsController {

    @Autowired
    private NewsService newsService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private TagService tagService;

    @Autowired
    private CloudinaryService cloudinaryService;

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
    @PostMapping(value = "/my-news",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createMyNews(@RequestPart("image") MultipartFile imageFile,
                                          @RequestPart("news") String newJson) {
        try {
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

    //cập nhật tin tức của user
    @PutMapping(value = "/my-news/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateNews(@PathVariable Long id,
                                        @RequestPart(value = "image", required = false) MultipartFile imageFile,
                                        @RequestPart("news") String newJson) {
        try {
            String imageUrl = null;
            if (imageFile != null && !imageFile.isEmpty()) {
                imageUrl = cloudinaryService.uploadFile(imageFile);
            }

            ObjectMapper mapper = new ObjectMapper();
            NewsCreateDto newsDto = mapper.readValue(newJson,NewsCreateDto.class);

            News existingNews = newsService.updateMyNews(id, newsDto, imageUrl);

            NewsResponseDto responseDTO = new NewsResponseDto(existingNews);// Pass DTO and URL
            return ResponseEntity.ok(responseDTO);


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