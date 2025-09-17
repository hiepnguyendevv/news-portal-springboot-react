package com.news.news_services.service;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Category;
import com.news.news_services.entity.User;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.news.news_services.service.HelperService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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

    // Import dữ liệu mẫu đơn giản
    public Map<String, Object> importSampleData() {
        Map<String, Object> response = new HashMap<>();
        try {
            long countBefore = newsRepository.count();
            
            // Tạo dữ liệu mẫu đơn giản
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
        //user
        User admin = userRepository.findByUsername("admin")
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername("admin");
                    user.setEmail("admin@news.com");
                    user.setPassword("admin123");
                    user.setFullName("Quản trị viên");
                    user.setRole(User.UserRole.ADMIN);
                    user.setStatus(User.UserStatus.ACTIVE);
                    return userRepository.save(user);
                });

        //category
        Category techCategory = findOrCreateCategory("Công nghệ", "Tin tức công nghệ");
        Category economyCategory = findOrCreateCategory("Kinh tế", "Tin tức kinh tế");
        Category sportsCategory = findOrCreateCategory("Thể thao", "Tin tức thể thao");



        // news
        createSampleNews("iPhone 16 ra mắt với nhiều tính năng mới", 
                        "Apple vừa công bố iPhone 16 series với chip A18 mạnh mẽ",
                        "Apple đã chính thức ra mắt iPhone 16 series tại sự kiện đặc biệt. Điện thoại được trang bị chip A18 mới nhất, camera được nâng cấp đáng kể và thời lượng pin cải thiện. Giá khởi điểm từ 999 USD.",
                        techCategory, admin);

        createSampleNews("VN-Index tăng điểm mạnh trong phiên giao dịch", 
                        "Chứng khoán Việt Nam có phiên tăng điểm ấn tượng",
                        "Thị trường chứng khoán Việt Nam đã có một phiên giao dịch khởi sắc với VN-Index tăng hơn 20 điểm. Các cổ phiếu ngân hàng và bất động sản dẫn dắt thị trường tăng điểm.",
                        economyCategory, admin);

        createSampleNews("Quang Hải ghi bàn thắng đẹp trong trận đấu", 
                        "Quang Hải tiếp tục tỏa sáng trên sân cỏ",
                        "Trong trận đấu tối qua, Quang Hải đã có một bàn thắng đẹp mắt giúp đội nhà giành chiến thắng 2-1. Đây là bàn thắng thứ 5 của anh trong mùa giải này.",
                        sportsCategory, admin);
    }

    private Category findOrCreateCategory(String name, String description) {
        String slugName = helperService.toSlug(name);   
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setDescription(description);
                    category.setLevel(0);
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

        news.setTitle(title);
        news.setSummary(summary);
        news.setContent(content);
        news.setCategory(category);
        news.setAuthor(author);
        news.setImageUrl("https://yavuzceliker.github.io/sample-images/image-1021.jpg");
        news.setSlug(slugName);
        news.setPublished(true);
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