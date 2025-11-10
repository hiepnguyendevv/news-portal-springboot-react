package com.news.news_services.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.news.news_services.dto.NewsCreateDto;
import com.news.news_services.entity.*;
import com.news.news_services.repository.*;

import com.news.news_services.security.UserPrincipal;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.jsoup.safety.Safelist;

import java.io.IOException;
import java.time.Duration;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class NewsService {

    private static final Logger logger = LoggerFactory.getLogger(NewsService.class);
    @Autowired
    private HelperService helperService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LiveContentRepository liveContentRepository;


    @Autowired
    private StringRedisTemplate redis;

    @Autowired
    private TagService tagService;


    @Autowired
    private Cloudinary cloudinary;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private TagGenerationService tagGenerationService;


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
    public News createMyNews(NewsCreateDto newsDto,String imageUrl) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        User author = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String rawHtmlContent = newsDto.getContent();
        String content = Jsoup.clean(rawHtmlContent,Safelist.basicWithImages());
        System.out.println("newsdto content:" + newsDto.getContent());

        // 2. Tạo đối tượng News Entity mới
        News newsEntity = new News();

        // 3. Map dữ liệu từ DTO sang Entity
        newsEntity.setTitle(newsDto.getTitle());
        newsEntity.setSummary(newsDto.getSummary());
        newsEntity.setContent(newsDto.getContent());
        newsEntity.setImageUrl(imageUrl); // Set imageUrl from parameter
        newsEntity.setRealtime(newsDto.isRealTime());


        // 4. Thiết lập các thông tin khác
        newsEntity.setAuthor(author);
        newsEntity.setSlug(helperService.toSlug(newsDto.getTitle()));
        // Use default values or values from DTO if provided
        if(author.getRole().name() == "ADMIN"){
            if(Boolean.TRUE.equals(newsDto.getPublished())){
                newsEntity.setPublished(true);
                newsEntity.setStatus(News.Status.PUBLISHED);
            }
            if(Boolean.TRUE.equals(newsDto.getFeatured())){
                newsEntity.setFeatured(true);
            }
        }
        newsEntity.setPublished(newsDto.getPublished() != null ? newsDto.getPublished() : false);
        newsEntity.setFeatured(newsDto.getFeatured() != null ? newsDto.getFeatured() : false);
        newsEntity.setStatus(newsDto.getPublished() != true ? News.Status.DRAFT : News.Status.PUBLISHED); // Or determine based on DTO.published

        // 5. Xử lý Category
            Category category = categoryRepository.findById(newsDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + newsDto.getCategoryId()));
            newsEntity.setCategory(category);


        // 6. Lưu Entity vào DB (để lấy ID)
        News savedNews = newsRepository.save(newsEntity);

        // BÂY GIỜ CHÚNG TA TỰ ĐỘNG TẠO TAGS
        List<String> tagNames = tagGenerationService.generateTagsFromContent(
                newsDto.getTitle(),
                newsDto.getContent() // Lấy nội dung gốc trước khi Jsoup clean
        );
        if (tagNames != null && !tagNames.isEmpty()) {
            tagService.assignToNews(savedNews.getId(), tagNames);
        }

        // 7. Liên kết media với news (nếu có)
        List<Long> mediaIds = newsDto.getMediaIds();
        if (mediaIds != null && !mediaIds.isEmpty()) {
            // Tìm các media "mồ côi" của user hiện tại
            List<Media> orphanMedia = mediaRepository.findByIdsAndUploaderAndNewsIsNull(
                    mediaIds, 
                    userPrincipal.getId()
            );
            
            // Liên kết từng media với news
            for (Media media : orphanMedia) {
                media.setNews(savedNews);
            }
            
            // Lưu tất cả media đã được liên kết
            if (!orphanMedia.isEmpty()) {
                mediaRepository.saveAll(orphanMedia);
                logger.info("Linked {} media items to news ID {}", orphanMedia.size(), savedNews.getId());
            }
        }

        return savedNews; // Return the saved Entity
    }

        @Transactional
        public News updateMyNews(Long id, NewsCreateDto newsDto, String imageUrl) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            News news = newsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

            boolean isAdmin = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));


            if (!news.getAuthor().getId().equals(userPrincipal.getId()) && !isAdmin ) {
                throw new RuntimeException("Bạn không có quyền chỉnh sửa tin tức này");
            }
            String rawHtmlContent = newsDto.getContent();
            String content = Jsoup.clean(rawHtmlContent,Safelist.basicWithImages());

            news.setTitle(newsDto.getTitle());
            news.setContent(content);
            news.setSummary(newsDto.getSummary());
            if(imageUrl != null) {
                String publicId = extractPublicIdFromUrl(news.getImageUrl());
                try{
                    cloudinary.uploader().destroy(publicId,ObjectUtils.emptyMap());
                    news.setImageUrl(imageUrl);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }

            }
            news.setPublished(newsDto.getPublished() != null ? newsDto.getPublished() : false);
            news.setFeatured(newsDto.getFeatured() != null ? newsDto.getFeatured() : false);

                Category category = categoryRepository.findById(newsDto.getCategoryId())
                        .orElseThrow(() -> new RuntimeException("Category not found"));
                news.setCategory(category);


            News updatedNews = newsRepository.save(news);
            List<String> tagNames = newsDto.getTags();
            if (tagNames != null && !tagNames.isEmpty()) {
                tagService.assignToNews(id, tagNames);
            }

            return updatedNews;
        }



    @Transactional
    public void deleteMyNews(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));


        boolean isAdmin = authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !news.getAuthor().getId().equals(userPrincipal.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa tin tức này");
        }


        try {
            String imageUrl = news.getImageUrl();
            String publicId = extractPublicIdFromUrl(imageUrl);
            if(publicId!=null){
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());

            }


            if(news.isRealtime()){
                String resourceType = "image";
                List<LiveContent> liveContents = liveContentRepository.findByNewsId(id);

                for(LiveContent lc : liveContents ){
                    String url = lc.getMediaUrl();
                    if(url != null){
                        if (url.contains("/video/")) resourceType = "video";
                        String idImg = extractPublicIdFromUrl(url);

                        cloudinary.uploader().destroy(
                                idImg,
                                ObjectUtils.asMap("resource_type", resourceType, "invalidate", true)
                        );

                    }
                    System.out.println("xóa image live content thành công");
                        }

            }


        } catch (IOException e) {
            logger.error("Lỗi khi xóa ảnh trên Cloudinary cho news ID {}: {}", id, e.getMessage());

        }

        newsRepository.deleteById(id);
    }



    private String extractPublicIdFromUrl(String imageUrl) {
        Pattern pattern = Pattern.compile("/upload/(?:v\\d+/)?([^.]+?)(\\.\\w+)?$");
        Matcher matcher = pattern.matcher(imageUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }


    public String testConnection() {
        try {
            long count = newsRepository.count();
            return "Kết nối MySQL thành công! Có " + count + " tin tức trong database.";
        } catch (Exception e) {
            return "Lỗi kết nối: " + e.getMessage();
        }
    }

}