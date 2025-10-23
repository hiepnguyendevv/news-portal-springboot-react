package com.news.news_services.controller;

import com.news.news_services.dto.JwtResponse;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.JwtUtil;
import com.news.news_services.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

@RestController
@RequestMapping("/api/oauth2")
public class Oauth2Controller {

    @Autowired
    UserRepository userRepository;
    @Autowired
    JwtUtil jwtUtil;

    @GetMapping("/callback")
    public ResponseEntity<?> handleOAuth2Callback(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body("No OAuth2 authentication found");
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String name = (String) oAuth2User.getAttributes().get("name");
        String email = (String) oAuth2User.getAttributes().get("email");
        String picture = (String) oAuth2User.getAttributes().get("picture");

        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setUsername(email);
            user.setPassword("");
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRole(User.UserRole.USER);
            user.setAvatarUrl(picture);
            user = userRepository.save(user);
        }

        //tạo jwt token
        String jwtToken = jwtUtil.generateTokenFromUsername(user.getUsername());
        
        JwtResponse jwtResponse = new JwtResponse();
        jwtResponse.setToken(jwtToken);
        jwtResponse.setType("Bearer");
        jwtResponse.setUsername(user.getUsername());
        jwtResponse.setFullName(user.getFullName());
        jwtResponse.setRole(user.getRole().toString());
        jwtResponse.setEmail(user.getEmail());
        jwtResponse.setStatus(user.getStatus().toString());

        return ResponseEntity.ok(jwtResponse);
    }


}
