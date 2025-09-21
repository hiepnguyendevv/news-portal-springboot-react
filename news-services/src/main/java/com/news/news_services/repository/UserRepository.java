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


    // Kiểm tra username có tồn tại không
    boolean existsByUsername(String username);

    // Kiểm tra email có tồn tại không
    boolean existsByEmail(String email);


    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);


}