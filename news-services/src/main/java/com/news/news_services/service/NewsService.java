package com.news.news_services.service;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.User;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import com.news.news_services.service.HelperService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

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

    public List<News> getAllNews() {
        return newsRepository.findAll();
    }

    // Lấy tin tức theo ID
    public News getNewsById(Long id) {
        Optional<News> news = newsRepository.findById(id);
        return news.orElse(null);
    }

    // Lấy tin tức đã xuất bản
    public List<News> getPublishedNews() {
        return newsRepository.findByPublishedTrueOrderByCreatedAtDesc();
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

    // Xóa tất cả tin tức
    public Map<String, Object> clearAllNews() {
        Map<String, Object> response = new HashMap<>();
        try {
            long count = newsRepository.count();
            newsRepository.deleteAll();

            response.put("success", true);
            response.put("message", "Đã xóa tất cả dữ liệu!");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa: " + e.getMessage());
        }
        return response;
    }

    public Map<String, Object> importSampleData() {
        Map<String, Object> response = new HashMap<>();
        try {
            long countBefore = newsRepository.count();

            createSimpleSampleData();

            long countAfter = newsRepository.count();
            long addedCount = countAfter - countBefore;

            response.put("success", true);
            response.put("message", "✅ Import dữ liệu thành công!");
            response.put("totalBefore", countBefore);
            response.put("totalAfter", countAfter);
            response.put("addedCount", addedCount);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "❌ Lỗi khi import: " + e.getMessage());
        }
        return response;
    }


    @Transactional
    private void createSimpleSampleData() {
        // 🔐 Tạo user admin với mật khẩu đã mã hóa
        User admin = userRepository.findByUsername("admin")
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername("admin");
                    user.setEmail("admin@news.com");
                    user.setPassword(passwordEncoder.encode("admin123")); // 🔧 Mã hóa mật khẩu
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
        int number = ThreadLocalRandom.current().nextInt(1, 2001); // 1 → 2000
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