package com.news.news_services.security;

import com.news.news_services.entity.User;
import com.news.news_services.entity.User;
import com.news.news_services.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;



    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (authentication == null || authentication.getPrincipal() == null) {
            response.sendRedirect("https://hiepnguyen.click/login?error=oauth2_failed");
            return;
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

        // Tạo JWT token
        String jwtToken = jwtUtil.generateTokenFromUsername(user.getUsername());
        
        // Redirect về frontend với token
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            frontendUrl = "https://hiepnguyen.click";
        }
        String redirectUrl = frontendUrl + "/oauth2/callback?token=" + URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }}


