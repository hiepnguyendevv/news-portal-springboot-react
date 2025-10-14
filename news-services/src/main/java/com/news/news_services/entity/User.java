package com.news.news_services.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

//    @NotBlank(message = "Password không được để trống")
//    @Size(min = 6, message = "Password phải ít nhất 6 ký tự")
    @Column(nullable = false, length = 255)
    private String password;

    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

   @Enumerated(EnumType.STRING)
   @Column(name = "role", length = 20, nullable = false)
   private UserRole role = UserRole.USER;

   @Enumerated(EnumType.STRING)
   @Column(name = "status", length = 20, nullable = false)
   private UserStatus status = UserStatus.ACTIVE;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<News> newsList = new ArrayList<>();

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enum cho Role
    public enum UserRole {
        ADMIN,      
        USER        
    }

    // Enum cho Status
    public enum UserStatus {
        ACTIVE,     
        INACTIVE,   
    }

    public User(){
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String username,String email,String password, String fullName){
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}

    public String getUsername() {return username;}
    public void setUsername(String username) {this.username = username;}

    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}

    public String getPassword() {return password;}
    public void setPassword(String password) {this.password = password;}

    public String getFullName() {return fullName;}
    public void setFullName(String fullName) {this.fullName = fullName;}

    public String getPhone() {return phone;}
    public void setPhone(String phone) {this.phone = phone;}

    public String getAvatarUrl() {return avatarUrl;}
    public void setAvatarUrl(String avatarUrl) {this.avatarUrl = avatarUrl;}

    public UserRole getRole() {return role;}
    public void setRole(UserRole role) {this.role = role;}

    public UserStatus getStatus() {return status;}
    public void setStatus(UserStatus status) {this.status = status;}

    public List<News> getNewsList() {return newsList;}
    public void setNewsList(List<News> newsList) {this.newsList = newsList;}

    public Boolean getEmailVerified() {return emailVerified;}
    public void setEmailVerified(Boolean emailVerified){this.emailVerified = emailVerified;}

    public LocalDateTime getLastLogin() {return lastLogin;}
    public void setLastLogin(LocalDateTime lastLogin) {this.lastLogin = lastLogin;}

    public LocalDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt = createdAt;}

    public LocalDateTime getUpdatedAt() {return updatedAt;}
    public void setUpdatedAt(LocalDateTime updatedAt) {this.updatedAt = updatedAt;}

    @PreUpdate
    public void setLoadUpdate(){
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAdmin(){
        return role == UserRole.ADMIN;
    }




}
