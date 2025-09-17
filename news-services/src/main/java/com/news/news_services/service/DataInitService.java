//package com.news.news_services.service;
//
//import com.news.news_services.entity.News;
//import com.news.news_services.entity.Category;
//import com.news.news_services.entity.User;
//import com.news.news_services.entity.UserRole;
//import com.news.news_services.entity.UserStatus;
//import com.news.news_services.repository.NewsRepository;
//import com.news.news_services.repository.CategoryRepository;
//import com.news.news_services.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.HashMap;
//import java.util.Map;
//
//@Service
//public class DataInitService {
//
//    @Autowired
//    private NewsRepository newsRepository;
//
//    @Autowired
//    private CategoryRepository categoryRepository;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    /**
//     * Tạo một tin tức mẫu đơn giản
//     */
//    @Transactional
//    public News createSampleNews() {
//        // Tìm hoặc tạo category và user
//        Category category = findOrCreateCategory("Test", "Danh mục test");
//        User author = findOrCreateUser("admin", "admin@news.com", "Admin Test");
//
//        News news = new News();
//        news.setTitle("Tin tức mẫu - " + System.currentTimeMillis());
//        news.setContent("Đây là nội dung tin tức mẫu được tạo từ API lúc " + LocalDateTime.now() + ". " +
//                "Nội dung này được tạo tự động để test chức năng của hệ thống tin tức.");
//        news.setSummary("Tóm tắt tin tức mẫu");
//        news.setCategory(category);
//        news.setAuthor(author);
//        news.setImageUrl("https://via.placeholder.com/400x200?text=Sample+News");
//        news.setPublished(true);
//        news.setCreatedAt(LocalDateTime.now());
//        news.setUpdatedAt(LocalDateTime.now());
//
//        return newsRepository.save(news);
//    }
//
//    /**
//     * Tạo dữ liệu mẫu hoàn chỉnh với nhiều tin tức
//     */
//    @Transactional
//    public Map<String, Object> createFullSampleData() {
//        Map<String, Object> response = new HashMap<>();
//        try {
//            long countBefore = newsRepository.count();
//
//            // Tạo categories
//            Category techCategory = findOrCreateCategory("Công nghệ", "Tin tức về công nghệ");
//            Category economyCategory = findOrCreateCategory("Kinh tế", "Tin tức kinh tế");
//            Category sportsCategory = findOrCreateCategory("Thể thao", "Tin tức thể thao");
//            Category healthCategory = findOrCreateCategory("Sức khỏe", "Tin tức sức khỏe");
//            Category entertainmentCategory = findOrCreateCategory("Giải trí", "Tin tức giải trí");
//
//            // Tạo users
//            User admin = findOrCreateUser("admin", "admin@news.com", "Quản trị viên");
//            User editor1 = findOrCreateUser("editor1", "editor1@news.com", "Biên tập viên 1");
//            User reporter1 = findOrCreateUser("reporter1", "reporter1@news.com", "Phóng viên 1");
//
//            // Tạo tin tức mẫu
//            createNewsArticles(techCategory, economyCategory, sportsCategory,
//                    healthCategory, entertainmentCategory, admin, editor1, reporter1);
//
//            long countAfter = newsRepository.count();
//            long addedCount = countAfter - countBefore;
//
//            response.put("success", true);
//            response.put("message", "Tạo dữ liệu mẫu thành công!");
//            response.put("totalBefore", countBefore);
//            response.put("totalAfter", countAfter);
//            response.put("addedCount", addedCount);
//
//        } catch (Exception e) {
//            response.put("success", false);
//            response.put("message", "Lỗi khi tạo dữ liệu: " + e.getMessage());
//        }
//        return response;
//    }
//
//    /**
//     * Xóa tất cả dữ liệu
//     */
//    @Transactional
//    public Map<String, Object> clearAllData() {
//        Map<String, Object> response = new HashMap<>();
//        try {
//            long newsCount = newsRepository.count();
//            long categoryCount = categoryRepository.count();
//            long userCount = userRepository.count();
//
//            newsRepository.deleteAll();
//            categoryRepository.deleteAll();
//            userRepository.deleteAll();
//
//            response.put("success", true);
//            response.put("message", "Đã xóa tất cả dữ liệu!");
//            response.put("deletedNews", newsCount);
//            response.put("deletedCategories", categoryCount);
//            response.put("deletedUsers", userCount);
//
//        } catch (Exception e) {
//            response.put("success", false);
//            response.put("message", "Lỗi khi xóa: " + e.getMessage());
//        }
//        return response;
//    }
//
//    // Helper methods
//    private Category findOrCreateCategory(String name, String description) {
//        return categoryRepository.findByName(name)
//                .orElseGet(() -> {
//                    Category category = new Category();
//                    category.setName(name);
//                    category.setDescription(description);
//                    category.setLevel(0);
//                    category.setSortOrder(0);
//                    category.setActive(true);
//                    category.setCreatedAt(LocalDateTime.now());
//                    category.setUpdatedAt(LocalDateTime.now());
//                    return categoryRepository.save(category);
//                });
//    }
//
//    private User findOrCreateUser(String username, String email, String fullName) {
//        return userRepository.findByUsername(username)
//                .orElseGet(() -> {
//                    User user = new User();
//                    user.setUsername(username);
//                    user.setEmail(email);
//                    user.setPassword("password123"); // Nên mã hóa trong thực tế
//                    user.setFullName(fullName);
//                    user.setRole(UserRole.EDITOR);
//                    user.setStatus(UserStatus.ACTIVE);
//                    user.setCreatedAt(LocalDateTime.now());
//                    user.setUpdatedAt(LocalDateTime.now());
//                    return userRepository.save(user);
//                });
//    }
//
//    private void createNewsArticles(Category tech, Category economy, Category sports,
//                                    Category health, Category entertainment,
//                                    User admin, User editor1, User reporter1) {
//        String commonImage = "https://via.placeholder.com/400x200?text=News+Image";
//
//        // Tin công nghệ
//        createNews("iPhone 16 chính thức được bán tại Việt Nam từ ngày 20/9",
//                "Apple công bố iPhone 16 series mở bán tại Việt Nam",
//                "Apple vừa công bố thời gian mở bán iPhone 16 series tại thị trường Việt Nam...",
//                tech, editor1, commonImage, -5);
//
//        createNews("Samsung ra mắt Galaxy Z Fold6 với nhiều cải tiến",
//                "Galaxy Z Fold6 chính thức trình làng tại sự kiện Unpacked",
//                "Samsung vừa chính thức ra mắt mẫu điện thoại gập thế hệ mới Galaxy Z Fold6...",
//                tech, reporter1, commonImage, -48);
//
//        // Tin kinh tế
//        createNews("Chứng khoán Việt Nam tăng mạnh trong phiên giao dịch",
//                "VN-Index tăng 15.2 điểm trong phiên giao dịch ngày 15/9",
//                "Thị trường chứng khoán Việt Nam ngày 15/9 chứng kiến sự bùng nổ của dòng tiền...",
//                economy, admin, commonImage, -2);
//
//        createNews("Giá vàng trong nước tăng mạnh, vượt ngưỡng 72 triệu đồng/lượng",
//                "Giá vàng lập đỉnh mới, gây chú ý trên thị trường tài chính",
//                "Trong phiên giao dịch sáng 15/9, giá vàng trong nước bất ngờ tăng mạnh...",
//                economy, editor1, commonImage, -18);
//
//        // Tin thể thao
//        createNews("Quang Hải ghi bàn giúp CAHN thắng 2-1 trước Hà Nội FC",
//                "CAHN giành chiến thắng trong trận derby Hà Nội kịch tính",
//                "Trong khuôn khổ vòng 6 V-League 2024, CLB Công an Hà Nội đã có chiến thắng kịch tính...",
//                sports, reporter1, commonImage, -8);
//
//        createNews("ĐT Việt Nam chuẩn bị cho vòng loại World Cup 2026",
//                "Đội tuyển Việt Nam hội quân tại Hà Nội",
//                "Đội tuyển Việt Nam đã chính thức hội quân tại Trung tâm đào tạo bóng đá trẻ VFF...",
//                sports, admin, commonImage, -96);
//
//        // Tin sức khỏe
//        createNews("Bộ Y tế khuyến cáo phòng chống bệnh sốt xuất huyết",
//                "Ca mắc sốt xuất huyết tăng mạnh, Bộ Y tế phát cảnh báo",
//                "Bộ Y tế vừa đưa ra cảnh báo về tình hình dịch sốt xuất huyết đang có xu hướng gia tăng...",
//                health, editor1, commonImage, -12);
//
//        createNews("Hà Nội ghi nhận ca cúm A/H5N1 đầu tiên trong năm",
//                "Trường hợp cúm A/H5N1 tại Hà Nội gây lo ngại",
//                "Sở Y tế Hà Nội vừa xác nhận một trường hợp nhiễm cúm A/H5N1 trên địa bàn thành phố...",
//                health, reporter1, commonImage, -72);
//
//        // Tin giải trí
//        createNews("Sơn Tùng M-TP ra mắt MV mới thu hút 5 triệu view sau 24h",
//                "MV 'Making My Way' của Sơn Tùng M-TP gây sốt mạng xã hội",
//                "Nam ca sĩ Sơn Tùng M-TP chính thức phát hành MV mới mang tên 'Making My Way'...",
//                entertainment, admin, commonImage, -15);
//
//        createNews("BLACKPINK xác nhận tổ chức concert tại Hà Nội",
//                "BLACKPINK sẽ biểu diễn tại Hà Nội vào tháng 12",
//                "Nhóm nhạc nổi tiếng toàn cầu BLACKPINK vừa chính thức xác nhận sẽ tổ chức concert...",
//                entertainment, editor1, commonImage, -24);
//    }
//
//    private void createNews(String title, String summary, String content,
//                            Category category, User author, String imageUrl, int hoursAgo) {
//        News news = new News();
//        news.setTitle(title);
//        news.setSummary(summary);
//        news.setContent(content);
//        news.setCategory(category);
//        news.setAuthor(author);
//        news.setImageUrl(imageUrl);
//        news.setPublished(true);
//        news.setCreatedAt(LocalDateTime.now().plusHours(hoursAgo));
//        news.setUpdatedAt(LocalDateTime.now().plusHours(hoursAgo));
//        newsRepository.save(news);
//    }
//}