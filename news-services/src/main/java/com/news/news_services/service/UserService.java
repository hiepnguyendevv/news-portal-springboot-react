package com.news.news_services.service;

import com.news.news_services.entity.User;
import com.news.news_services.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private CommentLikesRepository commentLikesRepository;
    
    @Autowired
    private BookmarkRepository bookmarkRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private NewsTagRepository newsTagRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
   
    @Transactional
    public void deleteUserWithCascade(Long userId) {
        // 1. Xóa CommentLike trước (vì có FK tới Comment)
        commentLikesRepository.deleteByUserId(userId);
        
        // 2. Xóa Bookmark
        bookmarkRepository.deleteByUserId(userId);
        
        // 3. Xóa Notification
        notificationRepository.deleteByRecipientId(userId);
        
        // 4. Xóa Comment (sau khi đã xóa CommentLike)
        commentRepository.deleteByUserId(userId);
        
        // 5. Xóa News của user (nếu cần)
        // Lưu ý: Có thể cần xử lý NewsTag trước
//        newsTagRepository(userId); // Nếu có method này
        
        // 6. Cuối cùng xóa User
        userRepository.deleteById(userId);
    }
    

    @Transactional
    public void softDeleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Đánh dấu user là INACTIVE thay vì xóa
        user.setStatus(User.UserStatus.INACTIVE);
        userRepository.save(user);
        
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User createUser(Map<String, Object> userData) {
        // Check if username already exists
        String username = (String) userData.get("username");
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }

        // Check if email already exists
        String email = (String) userData.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName((String) userData.get("fullName"));
        
        // Encode password
        String password = (String) userData.get("password");
        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        // Set role
        String role = (String) userData.get("role");
        if (role != null) {
            user.setRole(User.UserRole.valueOf(role));
        } else {
            user.setRole(User.UserRole.USER);
        }

        // Set status
        String status = (String) userData.get("status");
        if (status != null) {
            user.setStatus(User.UserStatus.valueOf(status));
        } else {
            user.setStatus(User.UserStatus.ACTIVE);
        }

        return userRepository.save(user);
    }
    
    /**
     * Cập nhật user với validation
     */
    @Transactional
    public User updateUser(Long id, Map<String, Object> userData) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update basic fields
        if (userData.containsKey("username")) {
            String newUsername = (String) userData.get("username");
            if (!user.getUsername().equals(newUsername) &&
                userRepository.findByUsername(newUsername).isPresent()) {
                throw new RuntimeException("Tên đăng nhập đã tồn tại");
            }
            user.setUsername(newUsername);
        }

        if (userData.containsKey("email")) {
            String newEmail = (String) userData.get("email");
            // Check if email is being changed and if new email already exists
            if (!user.getEmail().equals(newEmail) && 
                userRepository.findByEmail(newEmail).isPresent()) {
                throw new RuntimeException("Email đã tồn tại");
            }
            user.setEmail(newEmail);
        }

        if (userData.containsKey("fullName")) {
            user.setFullName((String) userData.get("fullName"));
        }

        // Update password if provided
        if (userData.containsKey("password")) {
            String password = (String) userData.get("password");
            if (password != null && !password.isEmpty()) {
                user.setPassword(passwordEncoder.encode(password));
            }
        }

        // Update role
        if (userData.containsKey("role")) {
            String role = (String) userData.get("role");
            user.setRole(User.UserRole.valueOf(role));
        }

        // Update status
        if (userData.containsKey("status")) {
            String status = (String) userData.get("status");
            user.setStatus(User.UserStatus.valueOf(status));
        }

        return userRepository.save(user);
    }
    

    @Transactional
    public User updateUserStatus(Long id, Map<String, Object> statusData) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (statusData.containsKey("status")) {
            String status = (String) statusData.get("status");
            user.setStatus(User.UserStatus.valueOf(status));
        }

        return userRepository.save(user);
    }
    
   
    public boolean userExists(Long id) {
        return userRepository.existsById(id);
    }
}
