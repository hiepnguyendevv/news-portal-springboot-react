package com.news.news_services.controller;

import com.news.news_services.dto.JwtResponse;
import com.news.news_services.dto.LoginRequest;
import com.news.news_services.dto.SignupRequest;
import com.news.news_services.entity.User;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.JwtUtil;
import com.news.news_services.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try{
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtUtil.generateJwtToken(authentication);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(JwtResponse.build(jwt, user));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Đăng nhập thất bại: ");
            return ResponseEntity.badRequest().body(error);
        }

    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try{
            if(userRepository.existsByUsername(signupRequest.getUsername())){
                Map<String, String> error = new HashMap<>();
                error.put("error", "Username đã được sử dụng!");
                return ResponseEntity.badRequest().body(error);
            }

            if(userRepository.existsByEmail(signupRequest.getEmail())){
                Map<String, String> error = new HashMap<>();
                error.put("error", "email đã được sử dụng!");
                return ResponseEntity.badRequest().body(error);
            }

            User user = new User();
            user.setUsername(signupRequest.getUsername());
            user.setEmail(signupRequest.getEmail());
            user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
            user.setFullName(signupRequest.getFullName());
            user.setPhone(signupRequest.getPhone());
            user.setRole(User.UserRole.USER);
            user.setStatus(User.UserStatus.ACTIVE);
            user.setEmailVerified(true);

            User savedUser = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng ký thành công!");
            response.put("user", Map.of(
                    "id", savedUser.getId(),
                    "username", savedUser.getUsername(),
                    "email", savedUser.getEmail(),
                    "fullName", savedUser.getFullName(),
                    "role", savedUser.getRole().name()
            ));
            return ResponseEntity.ok(response);
        }catch(Exception e){
            Map<String, String> error = new HashMap<>();
            error.put("error", "Đăng ký thất bại: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        SecurityContextHolder.clearContext();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công!");
        return ResponseEntity.ok(response);
    }

}
