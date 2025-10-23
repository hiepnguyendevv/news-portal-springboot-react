package com.news.news_services.service;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.User;
import com.news.news_services.entity.Tag;
import com.news.news_services.entity.NewsTag;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.repository.CommentRepository;
import com.news.news_services.repository.BookmarkRepository;
import com.news.news_services.repository.NewsTagRepository;
import com.news.news_services.repository.TagRepository;
import com.news.news_services.repository.NotificationRepository;
import com.news.news_services.repository.CommentLikesRepository;
import com.news.news_services.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.Duration;

import com.news.news_services.service.HelperService;
import com.news.news_services.service.TagService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NewsService {

    @Autowired
    private HelperService helperService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StringRedisTemplate redis;

    @Autowired
    private TagService tagService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private NewsTagRepository newsTagRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CommentLikesRepository commentLikesRepository;

    public List<News> getAllNews() {
        return newsRepository.findAll();
    }

    // Lấy tin tức theo ID với kiểm tra quyền
    public News getNewsById(Long id, boolean isAdmin) {
        Optional<News> news = newsRepository.findById(id);
        if (news.isPresent()) {
            // Nếu là admin hoặc news đã published thì trả về
            if (isAdmin || news.get().getPublished()) {
                return news.get();
            }
        }
        return null;
    }
    
    // Lấy tin tức theo ID (chỉ trả về news đã published) - backward compatibility
    public News getNewsById(Long id) {
        return getNewsById(id, false);
    }

    // Lấy tin tức đã xuất bản
    public List<News> getPublishedNews() {
        return newsRepository.findByPublishedTrueOrderByCreatedAtDesc();
    }

    // Lấy tin tức đã xuất bản với phân trang
    public Page<News> getPublishedNewsPaged(int page, int size) {
        return newsRepository.findByPublishedTrueOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public Map<String, Object> getPublishedNewsPagedMap(int page, int size) {
        Page<News> result = getPublishedNewsPaged(page, size);
        Map<String, Object> payload = new HashMap<>();
        payload.put("content", result.getContent());
        payload.put("totalPages", result.getTotalPages());
        payload.put("totalElements", result.getTotalElements());
        payload.put("page", result.getNumber());
        payload.put("size", result.getSize());
        return payload;
    }

    // Lấy tin tức theo category
    public List<News> getNewsByCategory(String categoryName) {
        return newsRepository.findByCategoryNameAndPublishedTrueOrderByCreatedAtDesc(categoryName);
    }

    // Lấy tin tức theo category slug
    public List<News> getNewsByCategorySlug(String categorySlug) {
        return newsRepository.findByCategorySlugAndPublishedTrueOrderByCreatedAtDesc(categorySlug);
    }

    // Tìm kiếm tin tức
    public List<News> searchNews(String keyword) {
        return newsRepository.searchByKeyword(keyword);
    }

    public Page<News> getNewsSortByViewDesc(Pageable pageable) {
        return newsRepository.findByPublishedTrueOrderByViewCountDesc(pageable);
    }

    public Page<News> getNewsSortByViewAsc(Pageable pageable) {
        return newsRepository.findByPublishedTrueOrderByViewCountAsc(pageable);
    }

    @Transactional
    public Long incrementViewCount(Long id){
        int newCnt = newsRepository.incrementViewCount(id);
        if(newCnt == 0) return null;

        return newsRepository.findById(id).map(News::getViewCount).orElse(null);
    }

    @Transactional
    public Long  incrementViewCountWithCoolDown(Long newsId, String visitorKey, Duration ttl){
        String key = "view:" + newsId + ":" + visitorKey;
        Boolean firstTime = redis.opsForValue().setIfAbsent(key,"1",ttl);
        if(Boolean.TRUE.equals(firstTime)){
            newsRepository.incrementViewCount(newsId);
        }
        return newsRepository.findById(newsId).map(News::getViewCount).orElse(null);
    }

    @Transactional
    public Long incrementViewWithVisitorData(Long newsId, String userAgent, String xForwardedFor, String remoteAddr, Authentication authentication) {
        String ua = userAgent;
        String ip = xForwardedFor;
        if (ip == null || ip.isBlank()) ip = remoteAddr;
        String visitorKey;
        Authentication auth = authentication;
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal up) {
            visitorKey = "u:" + up.getId();
        } else {
            String raw = (ip == null ? "" : ip) + "|" + (ua == null ? "" : ua);
            visitorKey = "g:" + Integer.toHexString(raw.hashCode());
        }
        return incrementViewCountWithCoolDown(newsId, visitorKey, Duration.ofMinutes(1));
    }
    


    public Page<News> adminSearchNews(String filter, Long categoryId, String q, String sortBy, int page, int size) {
        Boolean published = null; News.Status status = null; Boolean featured = null;
        if (filter != null) {
            String f = filter.toLowerCase();
            switch (f) {
                case "published" -> { published = true; status = News.Status.PUBLISHED; }
                case "draft" -> { published = false; status = News.Status.DRAFT; }
                case "pending" -> status = News.Status.PENDING_REVIEW;
                case "featured" -> featured = true;
                default -> {}
            }
        }

        Sort sort;
        if ("desc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "viewCount");
        } else if ("asc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "viewCount");
        } else {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        PageRequest pageable = PageRequest.of(page, size, sort);
        return newsRepository.adminSearch(q, categoryId, published, status, featured, pageable);
    }


    public News getNewsDetailForCurrentUser(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        News news = getNewsById(id, isAdmin);
        if (news == null) return null;

        List<Tag> tags = tagService.getTagByNewsId(id);
        news.setNewsTags(tags.stream().map(tag -> {
            NewsTag newsTag = new NewsTag();
            newsTag.setNews(news);
            newsTag.setTag(tag);
            return newsTag;
        }).collect(Collectors.toSet()));
        return news;
    }


    public List<News> getMyNewsOfCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return newsRepository.findByAuthorIdOrderByCreatedAtDesc(userPrincipal.getId());
    }

    @Transactional
    public News submitMyNewsForReview(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

        if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
            throw new RuntimeException("Bạn không có quyền gửi bài này");
        }

        news.setStatus(News.Status.PENDING_REVIEW);
        news.setPublished(false);
        news.setFeatured(false);
        return newsRepository.save(news);
    }

    @Transactional
    public News createMyNews(Map<String, Object> newsData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

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

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) newsData.get("tags");
        tagService.assignToNews(savedNews.getId(), tags);

        return savedNews;
    }

    @Transactional
    public News updateMyNews(Long id, Map<String, Object> newsData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

        if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa tin tức này");
        }

        news.setTitle((String) newsData.get("title"));
        news.setContent((String) newsData.get("content"));
        news.setSummary((String) newsData.get("summary"));
        news.setImageUrl((String) newsData.get("imageUrl"));
        news.setPublished(false);
        news.setFeatured(false);
        news.setStatus(News.Status.DRAFT);

        if (newsData.containsKey("categoryId")) {
            Integer categoryId = Integer.valueOf(newsData.get("categoryId").toString());
            Category category = categoryRepository.findById(categoryId.longValue())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
            news.setCategory(category);
        }

        News updatedNews = newsRepository.save(news);

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) newsData.get("tags");
        tagService.assignToNews(updatedNews.getId(), tags);

        return updatedNews;
    }

    @Transactional
    public void deleteMyNews(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

        if (!news.getAuthor().getId().equals(userPrincipal.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa tin tức này");
        }
        newsRepository.deleteById(id);
    }




    // Test kết nối database
    public String testConnection() {
        try {
            long count = newsRepository.count();
            return "Kết nối MySQL thành công! Có " + count + " tin tức trong database.";
        } catch (Exception e) {
            return "Lỗi kết nối: " + e.getMessage();
        }
    }
}