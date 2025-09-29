package com.news.news_services.controller;

import com.news.news_services.entity.User;
import com.news.news_services.repository.NotificationRepository;
import com.news.news_services.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationRepository notificationRepository;

    // Lấy tất cả users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("Error fetching users: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Lấy user theo ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userRepository.findById(id);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error fetching user: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Tạo user mới
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userData) {
        try {
            System.out.println("=== CREATE USER DEBUG ===");
            System.out.println("User data: " + userData);

            // Check if username already exists
            String username = (String) userData.get("username");
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tên đăng nhập đã tồn tại"));
            }

            // Check if email already exists
            String email = (String) userData.get("email");
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email đã tồn tại"));
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

            User savedUser = userRepository.save(user);
            System.out.println("✅ User created with ID: " + savedUser.getId());
            return ResponseEntity.ok(savedUser);

        } catch (Exception e) {
            System.err.println("❌ Error creating user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi tạo người dùng: " + e.getMessage()));
        }
    }

    // Cập nhật user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userData) {
        try {
            System.out.println("=== UPDATE USER DEBUG ===");
            System.out.println("User ID: " + id);
            System.out.println("Update data: " + userData);

            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

            // Update basic fields
            if (userData.containsKey("username")) {
                String newUsername = (String) userData.get("username");
                // Check if username is being changed and if new username already exists
                if (!user.getUsername().equals(newUsername) && 
                    userRepository.findByUsername(newUsername).isPresent()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Tên đăng nhập đã tồn tại"));
                }
                user.setUsername(newUsername);
            }

            if (userData.containsKey("email")) {
                String newEmail = (String) userData.get("email");
                // Check if email is being changed and if new email already exists
                if (!user.getEmail().equals(newEmail) && 
                    userRepository.findByEmail(newEmail).isPresent()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email đã tồn tại"));
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

            User updatedUser = userRepository.save(user);
            System.out.println("✅ User updated successfully");
            return ResponseEntity.ok(updatedUser);

        } catch (Exception e) {
            System.err.println("❌ Error updating user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật người dùng: " + e.getMessage()));
        }
    }

    // Xóa user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }


            notificationRepository.deleteByRecipientId(id);
            userRepository.deleteById(id);
            System.out.println("✅ User deleted: " + id);
            return ResponseEntity.ok()
                .body(Map.of("message", "Xóa người dùng thành công", "deletedId", id));

        } catch (Exception e) {
            System.err.println("❌ Error deleting user: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa người dùng: " + e.getMessage()));
        }
    }

    // Cập nhật trạng thái user
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> statusData) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

            if (statusData.containsKey("status")) {
                String status = (String) statusData.get("status");
                user.setStatus(User.UserStatus.valueOf(status));
            }

            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(updatedUser);

        } catch (Exception e) {
            System.err.println("❌ Error updating user status: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }
}