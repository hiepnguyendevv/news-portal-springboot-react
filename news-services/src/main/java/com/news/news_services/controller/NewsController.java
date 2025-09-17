package com.news.news_services.controller;

import com.news.news_services.entity.News;
import com.news.news_services.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:3000")
public class NewsController {

    @Autowired
    private NewsService newsService;

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
}