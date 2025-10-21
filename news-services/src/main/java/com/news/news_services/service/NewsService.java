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
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.Duration;

import org.springframework.web.bind.annotation.*;

import com.news.news_services.service.HelperService;
import com.news.news_services.service.TagService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
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
    // Xóa tất cả dữ liệu trong database
    @Transactional
    public Map<String, Object> clearAllData() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Long> deletedCounts = new HashMap<>();
        
        try {
            // Đếm số lượng trước khi xóa
            long newsCount = newsRepository.count();
            long commentCount = commentRepository.count();
            long bookmarkCount = bookmarkRepository.count();
            long newsTagCount = newsTagRepository.count();
            long tagCount = tagRepository.count();
            long categoryCount = categoryRepository.count();
            long userCount = userRepository.count();
            long notificationCount = notificationRepository.count();
            long commentLikeCount = commentLikesRepository.count();
            
            // Xóa theo thứ tự để tránh foreign key constraint
            // 1. Xóa các bảng liên kết trước
            commentLikesRepository.deleteAll();
            deletedCounts.put("commentLikes", commentLikeCount);
            
            newsTagRepository.deleteAll();
            deletedCounts.put("newsTags", newsTagCount);
            
            bookmarkRepository.deleteAll();
            deletedCounts.put("bookmarks", bookmarkCount);
            
            commentRepository.deleteAll();
            deletedCounts.put("comments", commentCount);
            
            notificationRepository.deleteAll();
            deletedCounts.put("notifications", notificationCount);
            
            // 2. Xóa các bảng chính
            newsRepository.deleteAll();
            deletedCounts.put("news", newsCount);
            
            tagRepository.deleteAll();
            deletedCounts.put("tags", tagCount);
            
            categoryRepository.deleteAll();
            deletedCounts.put("categories", categoryCount);
            
            // 3. Cuối cùng xóa users (trừ admin)
            userRepository.deleteAll();
            deletedCounts.put("users", userCount);
            
            // Tạo lại admin user
            createDefaultAdminUser();
            
            response.put("success", true);
            response.put("message", "Đã xóa tất cả dữ liệu thành công!");
            response.put("deletedCounts", deletedCounts);
            response.put("totalDeleted", deletedCounts.values().stream().mapToLong(Long::longValue).sum());
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa dữ liệu: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
        }
        
        return response;
    }
    
    // Tạo lại admin user mặc định
    private void createDefaultAdminUser() {
        try {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@news.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Quản trị viên");
            admin.setRole(User.UserRole.ADMIN);
            admin.setStatus(User.UserStatus.ACTIVE);
            admin.setEmailVerified(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo admin user: " + e.getMessage());
        }
    }

    public Map<String, Object> importSampleData() {
        Map<String, Object> response = new HashMap<>();
        try {
            long countBefore = newsRepository.count();

            createSimpleSampleData();

            long countAfter = newsRepository.count();
            long addedCount = countAfter - countBefore;

            response.put("success", true);
            response.put("message", "Import dữ liệu thành công!");
            response.put("totalBefore", countBefore);
            response.put("totalAfter", countAfter);
            response.put("addedCount", addedCount);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi import: " + e.getMessage());
        }
        return response;
    }

    // ===== Admin search with filters & sort =====
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


    @Transactional
    private void createSimpleSampleData() {
        User admin = userRepository.findByUsername("admin")
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername("admin");
                    user.setEmail("admin@news.com");
                    user.setPassword(passwordEncoder.encode("admin123")); 
                    user.setFullName("Quản trị viên");
                    user.setRole(User.UserRole.ADMIN);
                    user.setStatus(User.UserStatus.ACTIVE);
                    return userRepository.save(user);
                });


        Category techCategory = findOrCreateCategory("Công nghệ", "Tin tức công nghệ", null);
        Category aiCategory = findOrCreateCategory("Trí tuệ nhân tạo", "Tin tức về AI và Machine Learning", techCategory);
        Category mobileCategory = findOrCreateCategory("Di động", "Tin tức về điện thoại và thiết bị di động", techCategory);

        Category sportsCategory = findOrCreateCategory("Thể thao", "Tin tức thể thao", null);
        Category footballCategory = findOrCreateCategory("Bóng đá", "Tin tức bóng đá trong nước và quốc tế", sportsCategory);
        Category tennisCategory = findOrCreateCategory("Tennis", "Tin tức tennis", sportsCategory);

        Category economyCategory = findOrCreateCategory("Kinh tế", "Tin tức kinh tế", null);
        Category stockCategory = findOrCreateCategory("Chứng khoán", "Tin tức thị trường chứng khoán", economyCategory);
        Category cryptoCategory = findOrCreateCategory("Tiền điện tử", "Tin tức về Bitcoin và các loại tiền điện tử", economyCategory);


// ====== TIN CÔNG NGHỆ ======
        createSampleNews("Thị trường công nghệ Việt Nam tăng trưởng mạnh trong Q3",
                "Báo cáo từ Bộ TT&TT cho thấy xu hướng tích cực",
                "Theo báo cáo mới nhất từ Bộ Thông tin và Truyền thông, thị trường công nghệ Việt Nam đã ghi nhận mức tăng trưởng 15.2% trong quý 3 năm 2024. Các lĩnh vực fintech, e-commerce và công nghệ giáo dục dẫn đầu về tốc độ phát triển.",
                techCategory, admin);

        createSampleNews("Việt Nam đứng top 10 về chuyển đổi số ASEAN",
                "Chỉ số số hóa quốc gia được cải thiện đáng kể",
                "Trong bảng xếp hạng chuyển đổi số ASEAN 2024, Việt Nam đã leo lên vị trí thứ 6, tăng 2 bậc so với năm trước. Các yếu tố như hạ tầng kỹ thuật số, chính phủ điện tử và kỹ năng số của người dân đều có tiến bộ vượt bậc.",
                techCategory, admin);

        createSampleNews("iPhone 16 ra mắt với nhiều tính năng mới",
                "Apple vừa công bố iPhone 16 series với chip A18 mạnh mẽ",
                "Apple đã chính thức ra mắt iPhone 16 series tại sự kiện đặc biệt. Điện thoại được trang bị chip A18 mới nhất, camera được nâng cấp đáng kể và thời lượng pin cải thiện. Giá khởi điểm từ 999 USD.",
                mobileCategory, admin);

        createSampleNews("Samsung Galaxy S25 lộ thông số kỹ thuật",
                "Flagship mới của Samsung sẽ có nhiều cải tiến",
                "Theo tin rò rỉ mới nhất, Samsung Galaxy S25 sẽ được trang bị chip Snapdragon 8 Gen 4, camera chính 200MP và pin 5000mAh với sạc nhanh 65W. Dự kiến ra mắt vào đầu năm 2025.",
                mobileCategory, admin);

        createSampleNews("ChatGPT-5 sẽ ra mắt vào cuối năm 2024",
                "OpenAI chuẩn bị công bố phiên bản ChatGPT mới nhất",
                "OpenAI đã xác nhận rằng ChatGPT-5 sẽ được ra mắt vào cuối năm 2024 với nhiều cải tiến về khả năng xử lý ngôn ngữ tự nhiên và tốc độ phản hồi. Phiên bản mới sẽ hỗ trợ nhiều ngôn ngữ hơn.",
                aiCategory, admin);

        createSampleNews("Google Gemini Pro cạnh tranh với ChatGPT",
                "Cuộc đua AI ngày càng khốc liệt",
                "Google vừa ra mắt Gemini Pro với khả năng xử lý đa phương tiện vượt trội. Model AI mới này có thể hiểu và tạo ra nội dung text, hình ảnh, âm thanh và video một cách liền mạch.",
                aiCategory, admin);

// ====== TIN THỂ THAO ======
        createSampleNews("Việt Nam đăng cai SEA Games 33 năm 2025",
                "Lễ khai mạc dự kiến tổ chức tại Hà Nội",
                "Ủy ban Olympic Việt Nam chính thức xác nhận Việt Nam sẽ đăng cai tổ chức SEA Games 33 vào tháng 12/2025. Đây là lần thứ 2 Việt Nam đăng cai giải đấu thể thao lớn nhất khu vực Đông Nam Á.",
                sportsCategory, admin);

        createSampleNews("Thể thao Việt Nam đặt mục tiêu top 3 tại ASIAD 2026",
                "Kế hoạch đầu tư 500 tỷ cho thể thao thành tích cao",
                "Tổng cục Thể dục Thể thao đã công bố kế hoạch đầu tư 500 tỷ đồng để phát triển thể thao thành tích cao, hướng đến mục tiêu đứng top 3 tại ASIAD 2026 ở Nhật Bản.",
                sportsCategory, admin);

        createSampleNews("Quang Hải ghi bàn thắng đẹp trong trận đấu",
                "Quang Hải tiếp tục tỏa sáng trên sân cỏ",
                "Trong trận đấu tối qua, Quang Hải đã có một bàn thắng đẹp mắt giúp đội nhà giành chiến thắng 2-1. Đây là bàn thắng thứ 5 của anh trong mùa giải này.",
                footballCategory, admin);

        createSampleNews("ĐT Việt Nam chuẩn bị vòng loại World Cup 2026",
                "HLV Philippe Troussier công bố danh sách sơ bộ",
                "Huấn luyện viên Philippe Troussier đã công bố danh sách sơ bộ 35 cầu thủ cho đợt tập trung chuẩn bị vòng loại thứ 3 World Cup 2026. Nhiều gương mặt trẻ được gọi lên tuyển.",
                footballCategory, admin);

        createSampleNews("Djokovic vô địch Australian Open lần thứ 10",
                "Novak Djokovic tiếp tục thống trị Melbourne",
                "Novak Djokovic đã giành chiến thắng 3-0 trong trận chung kết Australian Open, đánh bại đối thủ trong 2 giờ 15 phút. Đây là lần thứ 10 anh vô địch giải đấu này.",
                tennisCategory, admin);

        createSampleNews("Lý Hoàng Nam vào vòng 2 Roland Garros",
                "Thành tích lịch sử của quần vợt Việt Nam",
                "Lý Hoàng Nam đã tạo nên lịch sử khi trở thành tay vợt Việt Nam đầu tiên vượt qua vòng 1 Roland Garros. Anh đánh bại đối thủ xếp hạng 45 thế giới sau 4 set đấu kịch tính.",
                tennisCategory, admin);

// ====== TIN KINH TẾ ======
        createSampleNews("GDP Việt Nam tăng 6.82% trong 9 tháng đầu năm",
                "Nền kinh tế phục hồi mạnh mẽ sau khó khăn",
                "Tổng cục Thống kê công bố GDP 9 tháng đầu năm 2024 tăng 6.82% so với cùng kỳ năm trước. Đây là mức tăng trưởng cao nhất trong 3 năm qua, cho thấy nền kinh tế đang phục hồi tích cực.",
                economyCategory, admin);

        createSampleNews("Việt Nam xuất khẩu đạt 315 tỷ USD",
                "Kim ngạch xuất khẩu tiếp tục tăng trưởng dương",
                "Theo số liệu từ Tổng cục Hải quan, kim ngạch xuất khẩu của Việt Nam trong 10 tháng đầu năm đạt 315 tỷ USD, tăng 14.2% so với cùng kỳ. Điện thoại, dệt may và giày dép dẫn đầu về kim ngạch.",
                economyCategory, admin);

        createSampleNews("VN-Index tăng điểm mạnh trong phiên giao dịch",
                "Chứng khoán Việt Nam có phiên tăng điểm ấn tượng",
                "Thị trường chứng khoán Việt Nam đã có một phiên giao dịch khởi sắc với VN-Index tăng hơn 20 điểm. Các cổ phiếu ngân hàng và bất động sản dẫn dắt thị trường tăng điểm.",
                stockCategory, admin);

        createSampleNews("Vinhomes niêm yết thêm 1.2 tỷ cổ phiếu",
                "Đợt phát hành lớn nhất thị trường năm 2024",
                "Vinhomes (VHM) chính thức niêm yết bổ sung 1.2 tỷ cổ phiếu từ việc trả cổ tức. Đây là đợt niêm yết bổ sung lớn nhất trên thị trường chứng khoán Việt Nam trong năm 2024.",
                stockCategory, admin);

// 💰 Tin thuộc category con "Tiền điện tử"
        createSampleNews("Bitcoin vượt mốc 70.000 USD",
                "Thị trường tiền điện tử sôi động trở lại",
                "Bitcoin đã chính thức vượt qua mốc 70.000 USD sau một thời gian dài giảm giá. Các chuyên gia dự đoán thị trường tiền điện tử sẽ tiếp tục tăng trưởng mạnh trong quý này.",
                cryptoCategory, admin);

        createSampleNews("Ethereum cập nhật giao thức Dencun",
                "Phí giao dịch giảm đáng kể",
                "Ethereum đã hoàn tất việc cập nhật giao thức Dencun, giúp giảm phí giao dịch xuống mức thấp nhất trong 2 năm qua. Việc này được kỳ vọng sẽ thu hút nhiều người dùng mới tham gia hệ sinh thái.",
                cryptoCategory, admin);

    }

    private Category findOrCreateCategory(String name, String description, Category parent) {
        String slugName = helperService.toSlug(name);
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setDescription(description);
                    category.setParent(parent); // 🔗 Set parent category
                    category.setLevel(parent == null ? 0 : parent.getLevel() + 1); // 📊 Set level
                    category.setSlug(slugName);
                    category.setSortOrder(0);
                    category.setIsActive(true);
                    return categoryRepository.save(category);
                });
    }


    private void createSampleNews(String title, String summary, String content,
                                  Category category, User author) {
        News news = new News();
            String slugName = helperService.toSlug(title);
        int number = ThreadLocalRandom.current().nextInt(1, 2001); 
        String numImg = String.valueOf(number);
        news.setTitle(title);
        news.setSummary(summary);
        news.setContent(content);
        news.setCategory(category);
        news.setAuthor(author);
        news.setImageUrl("https://yavuzceliker.github.io/sample-images/image-"+numImg+".jpg");
        news.setSlug(slugName);
        news.setPublished(true);
        news.setFeatured(false);
        news.setStatus(News.Status.PUBLISHED);
        news.setCreatedAt(LocalDateTime.now());
        news.setUpdatedAt(LocalDateTime.now());
        newsRepository.save(news);
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