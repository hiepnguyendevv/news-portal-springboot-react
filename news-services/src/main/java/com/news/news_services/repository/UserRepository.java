package com.news.news_services.repository;

import com.news.news_services.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm theo username
    Optional<User> findByUsernameAndStatus(String username, User.UserStatus status);

    // Tìm theo email
    Optional<User> findByEmailAndStatus(String email, User.UserStatus status);

    // Tìm theo username hoặc email
    @Query("SELECT u FROM User u WHERE (u.username = :usernameOrEmail OR u.email = :usernameOrEmail) AND u.status = :status")
    Optional<User> findByUsernameOrEmailAndStatus(String usernameOrEmail, User.UserStatus status);

    // Kiểm tra username có tồn tại không
    boolean existsByUsername(String username);

    // Kiểm tra email có tồn tại không
    boolean existsByEmail(String email);

    // Tìm theo role
    List<User> findByRoleAndStatus(User.UserRole role, User.UserStatus status);

    // Tìm các tác giả có thể viết bài
    @Query("SELECT u FROM User u WHERE u.role IN ('ADMIN', 'EDITOR', 'AUTHOR') AND u.status = 'ACTIVE'")
    List<User> findAllActiveAuthors();

    // Tìm theo status
    List<User> findByStatus(User.UserStatus status);

    // Tìm theo tên
    List<User> findByFullNameContainingIgnoreCaseAndStatus(String fullName, User.UserStatus status);
    
    // Tìm theo username đơn giản
    Optional<User> findByUsername(String username);
}