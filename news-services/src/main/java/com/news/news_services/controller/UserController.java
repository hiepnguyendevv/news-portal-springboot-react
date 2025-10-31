package com.news.news_services.controller;

import com.news.news_services.entity.User;
import com.news.news_services.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
 public class UserController {

    @Autowired
    private UserService userService;
    //lấy tất cả users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //lấy user theo id
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userService.getUserById(id);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //tạo user mới
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userData) {
        try {
            System.out.println("=== CREATE USER DEBUG ===");
            System.out.println("User data: " + userData);

            User savedUser = userService.createUser(userData);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
        
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi tạo người dùng: " + e.getMessage()));
        }
    }

    //cập nhật user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userData) {
        try {
            System.out.println("=== UPDATE USER DEBUG ===");
            System.out.println("User ID: " + id);
            System.out.println("Update data: " + userData);

            User updatedUser = userService.updateUser(id, userData);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật người dùng: " + e.getMessage()));
        }
    }



    //xóa user với cascade delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            if (!userService.userExists(id)) {
                return ResponseEntity.notFound().build();
            }

            userService.deleteUserWithCascade(id);
            
            return ResponseEntity.ok()
                .body(Map.of("message", "Xóa người dùng và tất cả dữ liệu liên quan thành công"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa người dùng: " + e.getMessage()));
        }
    }
    
    //soft delete user 
    @DeleteMapping("/{id}/soft")
    public ResponseEntity<?> softDeleteUser(@PathVariable Long id) {
        try {
            if (!userService.userExists(id)) {
                return ResponseEntity.notFound().build();
            }

            //sử dụng soft delete   
            userService.softDeleteUser(id);
            
            return ResponseEntity.ok()
                .body(Map.of("message", "Vô hiệu hóa người dùng thành công"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi vô hiệu hóa người dùng: " + e.getMessage()));
        }
    }

    //cập nhật trạng thái user
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> statusData) {
        try {
            User updatedUser = userService.updateUserStatus(id, statusData);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }

    //bulk delete users
    @DeleteMapping("/bulk")
    public ResponseEntity<?> bulkDeleteUsers(@RequestParam List<Long> userIds) {
        try {
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID người dùng không được để trống"));
            }

            int deletedCount = 0;
            for (Long id : userIds) {
                if (userService.userExists(id)) {
                    userService.deleteUserWithCascade(id);
                    deletedCount++;
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa " + deletedCount + " người dùng thành công",
                "deletedCount", deletedCount
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa người dùng: " + e.getMessage()));
        }
    }

    //bulk update user status
    @PatchMapping("/bulk/status")
    public ResponseEntity<?> bulkUpdateUserStatus(@RequestParam List<Long> userIds, @RequestParam String status) {
        try {
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID người dùng không được để trống"));
            }

            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Trạng thái không được để trống"));
            }

            int updatedCount = 0;
            for (Long id : userIds) {
                if (userService.userExists(id)) {
                    userService.updateUserStatus(id, Map.of("status", status));
                    updatedCount++;
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật trạng thái " + updatedCount + " người dùng thành công",
                "updatedCount", updatedCount
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }
}