# 🔐 GIẢI THÍCH CHI TIẾT HỆ THỐNG XÁC THỰC VÀ PHÂN QUYỀN

## 🎯 **TỔNG QUAN**

Hệ thống xác thực và phân quyền sử dụng **kiến trúc 2-token**:
- **Access Token (JWT)** - Ngắn hạn (1 ngày), lưu trong memory
- **Refresh Token** - Dài hạn (7-30 ngày), HttpOnly cookie

**Các tính năng bảo mật:**
- ✅ Token rotation (refresh token tự động đổi mới)
- ✅ Token family (chống token reuse attack)
- ✅ HttpOnly cookies (chống XSS)
- ✅ Automatic token refresh (không cần đăng nhập lại)
- ✅ OAuth2 Google Login
- ✅ Role-based authorization (USER, ADMIN)

---

## 📋 **PHẦN 1: KIẾN TRÚC 2-TOKEN**

### **1.1. Access Token (JWT)**

**Đặc điểm:**
- **Thời hạn:** Ngắn (1 ngày = 86,400,000ms)
- **Lưu trữ:** Trong memory (JavaScript variable)
- **Mục đích:** Gửi kèm mỗi request để xác thực
- **Format:** JWT (JSON Web Token)

**Cấu trúc JWT:**
```
Header.Payload.Signature

Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "username", "iat": 1234567890, "exp": 1234654290 }
Signature: HMAC-SHA256(header + payload, secret)
```

**Ví dụ:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VybmFtZSIsImlhdCI6MTYwOTQ4MjQwMCwiZXhwIjoxNjA5NTY4ODAwfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Tại sao ngắn hạn?**
- ✅ Giảm thiểu thiệt hại nếu bị đánh cắp
- ✅ Token hết hạn nhanh, phải refresh thường xuyên
- ✅ Dễ revoke (chỉ cần không refresh)

---

### **1.2. Refresh Token**

**Đặc điểm:**
- **Thời hạn:** Dài (7-30 ngày)
- **Lưu trữ:** HttpOnly cookie (không thể truy cập từ JavaScript)
- **Mục đích:** Dùng để lấy Access Token mới
- **Format:** UUID (random string)
- **Lưu trong DB:** Hashed (SHA-256)

**Tại sao HttpOnly Cookie?**
- ✅ **Chống XSS:** JavaScript không thể đọc được
- ✅ **Tự động gửi:** Browser tự động gửi kèm request
- ✅ **Secure:** Chỉ gửi qua HTTPS (nếu config)

---

## 🔄 **PHẦN 2: LUỒNG XÁC THỰC**

### **2.1. Đăng nhập (Login)**

```
┌─────────────────────────────────────────────────────────┐
│  1. USER NHẬP USERNAME/PASSWORD                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  2. Frontend gửi POST /api/auth/signin                  │
│     { username: "user", password: "pass" }              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  3. Backend (AuthController.signin())                   │
│     - AuthenticationManager.authenticate()              │
│     - Kiểm tra username/password                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4. Tạo Access Token (JWT)                              │
│     - JwtUtil.generateJwtToken()                        │
│     - Chứa username, iat, exp                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  5. Tạo Refresh Token                                   │
│     - RefreshTokenService.createRefreshToken()          │
│     - UUID.randomUUID() → Hash (SHA-256)                │
│     - Lưu vào database (hashed)                         │
│     - Token family: "family-{uuid}"                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  6. Response:                                           │
│     - Body: { token: "JWT_ACCESS_TOKEN", user: {...} }  │
│     - Header: Set-Cookie: refreshToken=xxx (HttpOnly)   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  7. Frontend:                                           │
│     - Lưu Access Token vào memory (inMemoryAccessToken) │
│     - Refresh Token tự động lưu trong cookie            │
└─────────────────────────────────────────────────────────┘
```

**Code Backend:**

```java
@PostMapping("/signin")
public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
    // 1. Xác thực username/password
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            loginRequest.getUsername(),
            loginRequest.getPassword()
        )
    );
    
    // 2. Lấy thông tin user
    UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
    User user = userRepository.findById(userPrincipal.getId()).orElseThrow();
    
    // 3. Tạo Access Token
    String jwt = jwtUtil.generateJwtToken(authentication);
    
    // 4. Tạo Refresh Token
    String rawRefreshToken = refreshTokenService.createRefreshToken(user);
    
    // 5. Tạo HttpOnly Cookie
    ResponseCookie refreshCookie = cookieUtil.createRefreshCookie(rawRefreshToken);
    
    // 6. Response
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
        .body(JwtResponse.build(jwt, user));
}
```

---

### **2.2. Refresh Token (Lấy Access Token mới)**

```
┌─────────────────────────────────────────────────────────┐
│  1. Access Token hết hạn (401 Unauthorized)             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  2. Frontend (api.js interceptor)                       │
│     - Phát hiện 401                                     │
│     - Gọi POST /api/auth/refresh                        │
│     - Cookie tự động gửi kèm (HttpOnly)                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  3. Backend (AuthController.refresh())                  │
│     - Lấy Refresh Token từ cookie                       │
│     - RefreshTokenService.exchangRefreshToken()         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4. RefreshTokenService.exchangRefreshToken()           │
│     a. Hash Refresh Token                               │
│     b. Tìm trong database (hashed)                      │
│     c. Kiểm tra:                                        │
│        - Token có tồn tại?                              │
│        - Token đã bị revoked?                           │
│        - Token đã hết hạn?                              │
│     d. REVOKE token cũ (set revoked = true)             │
│     e. TẠO Refresh Token MỚI (rotation)                 │
│        - Token family giữ nguyên                        │
│        - Lưu vào database                               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  5. Tạo Access Token MỚI                                │
│     - JwtUtil.generateTokenFromUsername()               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  6. Response:                                           │
│     - Body: { accessToken: "NEW_JWT_TOKEN" }            │
│     - Header: Set-Cookie: refreshToken=NEW_TOKEN        │
│                (HttpOnly)                                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  7. Frontend:                                           │
│     - Lưu Access Token mới vào memory                   │
│     - Retry request gốc với token mới                   │
└─────────────────────────────────────────────────────────┘
```

**Code Backend:**

```java
@PostMapping("/refresh")
public ResponseEntity<?> refreshToken(
    @CookieValue(name = "${app.refreshCookieName}") String oldRawToken) {
    
    // 1. Exchange Refresh Token (rotation)
    ExchangeTokenResponse response = refreshTokenService.exchangRefreshToken(oldRawToken);
    String newRawRefreshToken = response.getNewRawRefreshToken();
    User user = response.getUser();
    
    // 2. Tạo Access Token mới
    String newAccessToken = jwtUtil.generateTokenFromUsername(user.getUsername());
    
    // 3. Tạo cookie mới
    ResponseCookie newRefreshCookie = cookieUtil.createRefreshCookie(newRawRefreshToken);
    
    // 4. Response
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
        .body(Map.of("accessToken", newAccessToken));
}
```

---

### **2.3. Token Rotation (Quay vòng token)**

**Vấn đề không dùng rotation:**
```
User đăng nhập → Refresh Token: "ABC123"
User refresh → Vẫn dùng "ABC123"
Nếu token bị đánh cắp → Hacker có thể dùng mãi mãi!
```

**Giải pháp với rotation:**
```
User đăng nhập → Refresh Token: "ABC123" (Family: "family-1")
User refresh → 
  - Revoke "ABC123" (set revoked = true)
  - Tạo token MỚI: "XYZ789" (Family: "family-1" - giữ nguyên)
  - Trả về "XYZ789"
  
Nếu token bị đánh cắp:
  - Hacker dùng "ABC123" → Phát hiện đã revoked
  - Revoke CẢ FAMILY (chống reuse attack)
```

**Code:**

```java
@Transactional
public ExchangeTokenResponse exchangRefreshToken(String oldRawToken) {
    // 1. Hash token cũ
    String oldHashToken = hashToken(oldRawToken);
    
    // 2. Tìm token trong database
    Optional<RefreshToken> rf = refreshTokenRepository
        .findByTokenHashAndRevokedFalse(oldHashToken);
    
    if (rf.isEmpty()) {
        // Token không tồn tại hoặc đã revoked
        Optional<RefreshToken> revokedToken = 
            refreshTokenRepository.findByTokenHash(oldHashToken);
        
        if (revokedToken.isPresent() && revokedToken.get().isRevoked()) {
            // PHÁT HIỆN TOKEN REUSE!
            // Revoke cả family (tất cả tokens cùng family)
            refreshTokenRepository.revokeTokenFamily(
                revokedToken.get().getTokenFamily()
            );
            throw new SecurityException("Phát hiện tái sử dụng Refresh Token!");
        }
        throw new SecurityException("Refresh Token không hợp lệ!");
    }
    
    RefreshToken oldToken = rf.get();
    
    // 3. Kiểm tra hết hạn
    if (oldToken.getExpiresAt().isBefore(LocalDateTime.now())) {
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);
        throw new SecurityException("Refresh Token đã hết hạn!");
    }
    
    // 4. REVOKE token cũ
    oldToken.setRevoked(true);
    refreshTokenRepository.save(oldToken);
    
    // 5. TẠO TOKEN MỚI (cùng family)
    String newRawToken = generateNewToken(
        oldToken.getUser(), 
        oldToken.getTokenFamily()  // Giữ nguyên family
    );
    
    return new ExchangeTokenResponse(newRawToken, oldToken.getUser());
}
```

---

### **2.4. Token Family (Chống Reuse Attack)**

**Vấn đề:**
- Hacker đánh cắp Refresh Token
- Hacker và User cùng dùng token
- Server phát hiện: Token được dùng 2 lần → **TOKEN REUSE!**

**Giải pháp Token Family:**
```
User đăng nhập:
  - Refresh Token: "ABC123"
  - Family: "family-uuid-1"

User refresh:
  - Revoke "ABC123"
  - Tạo mới: "XYZ789"
  - Family: "family-uuid-1" (giữ nguyên)

Nếu hacker dùng "ABC123" (đã revoked):
  - Phát hiện: Token đã revoked
  - Revoke CẢ FAMILY "family-uuid-1"
  - Tất cả tokens cùng family bị revoked
  - User phải đăng nhập lại
```

**Code:**

```java
// Khi tạo token mới
private String generateNewToken(User user, String tokenFamily) {
    String rawToken = UUID.randomUUID().toString();
    String tokenHash = hashToken(rawToken);
    
    RefreshToken newToken = new RefreshToken();
    newToken.setUser(user);
    newToken.setTokenHash(tokenHash);
    newToken.setTokenFamily(tokenFamily);  // ← Giữ nguyên family
    newToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000L));
    newToken.setRevoked(false);
    newToken.setCreatedAt(LocalDateTime.now());
    
    refreshTokenRepository.save(newToken);
    return rawToken;
}

// Khi phát hiện reuse
if (revokedToken.isPresent() && revokedToken.get().isRevoked()) {
    // Revoke cả family
    refreshTokenRepository.revokeTokenFamily(
        revokedToken.get().getTokenFamily()
    );
    throw new SecurityException("Phát hiện tái sử dụng Refresh Token!");
}
```

---

## 🛡️ **PHẦN 3: JWT AUTHENTICATION FILTER**

### **3.1. Spring Security Filter Chain**

```
Request → Filter 1 → Filter 2 → ... → JwtAuthenticationFilter → Controller
```

**JwtAuthenticationFilter** được thêm vào filter chain:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    // ... config khác
    
    // Thêm JWT filter TRƯỚC UsernamePasswordAuthenticationFilter
    http.addFilterBefore(
        jwtAuthenticationFilter, 
        UsernamePasswordAuthenticationFilter.class
    );
    
    return http.build();
}
```

---

### **3.2. JwtAuthenticationFilter Logic**

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserDetailServiceImpl userDetailsService;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            // 1. Parse JWT từ header "Authorization: Bearer {token}"
            String jwt = parseJwt(request);
            
            // 2. Validate JWT
            if (jwt != null && jwtUtil.validationJwtToken(jwt)) {
                // 3. Lấy username từ JWT
                String username = jwtUtil.getUserNameFromToken(jwt);
                
                // 4. Load user details từ database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                // 5. Tạo Authentication object
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, 
                        null, 
                        userDetails.getAuthorities()  // ROLE_USER, ROLE_ADMIN
                    );
                
                // 6. Set vào SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.err.println("Cannot set user authentication: " + e.getMessage());
        }
        
        // 7. Tiếp tục filter chain
        filterChain.doFilter(request, response);
    }
    
    private String parseJwt(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);  // Bỏ "Bearer "
        }
        return null;
    }
}
```

**Luồng hoạt động:**
1. Request đến → JwtAuthenticationFilter chặn
2. Parse JWT từ header `Authorization: Bearer {token}`
3. Validate JWT (signature, expiration)
4. Lấy username từ JWT payload
5. Load user từ database
6. Set Authentication vào SecurityContext
7. Controller có thể dùng: `SecurityContextHolder.getContext().getAuthentication()`

---

## 🔒 **PHẦN 4: PHÂN QUYỀN (AUTHORIZATION)**

### **4.1. Role-based Access Control**

**User Entity:**

```java
public enum UserRole {
    ADMIN,      // Quản trị viên
    USER        // Người dùng thường
}

public enum UserStatus {
    ACTIVE,     // Tài khoản hoạt động
    INACTIVE    // Tài khoản bị khóa
}
```

**UserPrincipal:**

```java
public class UserPrincipal implements UserDetails {
    private Long id;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;
    
    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
            // ROLE_ADMIN hoặc ROLE_USER
        );
        return new UserPrincipal(...);
    }
    
    @Override
    public boolean isEnabled() {
        return status == User.UserStatus.ACTIVE;
    }
}
```

---

### **4.2. SecurityConfig - URL Authorization**

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http.authorizeHttpRequests(auth ->
        auth
            // Public endpoints
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/oauth2/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
            
            // User endpoints
            .requestMatchers(HttpMethod.POST, "/api/news/create").hasRole("USER")
            .requestMatchers("/api/news/my-news/**").authenticated()
            
            // Admin endpoints
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            
            // Tất cả request khác cần authenticated
            .anyRequest().authenticated()
    );
    
    return http.build();
}
```

**Giải thích:**
- `.permitAll()` - Không cần authentication
- `.authenticated()` - Cần authentication (bất kỳ role nào)
- `.hasRole("USER")` - Cần role USER
- `.hasRole("ADMIN")` - Cần role ADMIN

---

### **4.3. Method-level Security**

```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/admin/users")
public ResponseEntity<?> createUser(...) {
    // Chỉ ADMIN mới được gọi
}
```

---

## 🔄 **PHẦN 5: AUTOMATIC TOKEN REFRESH (FRONTEND)**

### **5.1. Request Interceptor**

**Lưu Access Token trong memory:**

```javascript
// api.js
let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
    inMemoryAccessToken = token;
};

// Request interceptor - Thêm token vào header
api.interceptors.request.use((config) => {
    if (inMemoryAccessToken) {
        config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
});
```

**Tại sao lưu trong memory?**
- ✅ An toàn hơn localStorage (không thể truy cập từ script khác)
- ✅ Tự động xóa khi refresh trang
- ✅ Không bị XSS attack

---

### **5.2. Response Interceptor - Auto Refresh**

**Logic xử lý 401:**

```javascript
let isRefreshing = false;
let failedQueue = [];  // Hàng đợi các request bị lỗi 401

api.interceptors.response.use(
    (response) => response,  // Success
    async (error) => {
        const originalRequest = error.config;
        
        // Chỉ xử lý 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Nếu đang refresh, đưa vào hàng đợi
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);  // Retry
                });
            }
            
            // Bắt đầu refresh
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                // Gọi /refresh (cookie tự động gửi kèm)
                const rs = await api.post('/auth/refresh');
                const { accessToken } = rs.data;
                
                // Lưu token mới
                setAccessToken(accessToken);
                
                // Cập nhật token cho request gốc và các request trong queue
                originalRequest.headers.Authorization = 'Bearer ' + accessToken;
                processQueue(null, accessToken);  // Giải quyết hàng đợi
                
                isRefreshing = false;
                return api(originalRequest);  // Retry request gốc
                
            } catch (_error) {
                // Refresh thất bại → Logout
                isRefreshing = false;
                processQueue(_error, null);
                setAccessToken(null);
                window.dispatchEvent(new Event("auth-failed"));
                return Promise.reject(_error);
            }
        }
        
        return Promise.reject(error);
    }
);
```

**Tại sao cần queue?**
- Nếu nhiều request cùng lúc bị 401
- Chỉ cần 1 request gọi `/refresh`
- Các request khác chờ và retry với token mới

**Ví dụ:**
```
Request 1 → 401 → Bắt đầu refresh
Request 2 → 401 → Vào queue
Request 3 → 401 → Vào queue

Refresh thành công → Token mới
Request 1 → Retry với token mới ✅
Request 2 → Retry với token mới ✅
Request 3 → Retry với token mới ✅
```

---

### **5.3. Check Auth Status khi App Start**

```javascript
// AuthContext.js
useEffect(() => {
    checkAuthStatus();
}, []);

const checkAuthStatus = async () => {
    try {
        // Thử refresh token
        const response = await newsAPI.refreshToken();
        const { accessToken } = response.data;
        
        // Lưu token
        setAccessToken(accessToken);
        
        // Lấy thông tin user
        await refreshUser();
    } catch (error) {
        // Refresh thất bại → Chưa đăng nhập
        setUser(null);
        setIsAuthenticated(false);
    }
};
```

---

## 🔐 **PHẦN 6: OAUTH2 GOOGLE LOGIN**

### **6.1. Luồng OAuth2**

```
1. User click "Đăng nhập với Google"
   ↓
2. Redirect đến Google OAuth
   ↓
3. User xác nhận
   ↓
4. Google redirect về: /oauth2/callback?code=xxx
   ↓
5. Backend exchange code → Access Token
   ↓
6. Backend lấy thông tin user từ Google
   ↓
7. Tạo/lấy user trong database
   ↓
8. Tạo JWT token
   ↓
9. Redirect về frontend với token
   ↓
10. Frontend lưu token và đăng nhập
```

---

### **6.2. OAuth2LoginSuccessHandler**

```java
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public void onAuthenticationSuccess(...) {
        // 1. Lấy thông tin từ Google
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");
        String name = (String) oAuth2User.getAttributes().get("name");
        String picture = (String) oAuth2User.getAttributes().get("picture");
        
        // 2. Tìm user trong database
        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            // Tạo user mới
            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setUsername(email);
            user.setPassword("");  // OAuth2 không có password
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRole(User.UserRole.USER);
            user.setAvatarUrl(picture);
            user = userRepository.save(user);
        }
        
        // 3. Tạo JWT token
        String jwtToken = jwtUtil.generateTokenFromUsername(user.getUsername());
        
        // 4. Redirect về frontend với token
        String redirectUrl = frontendUrl + "/oauth2/callback?token=" + 
            URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
```

---

### **6.3. Frontend OAuth2 Callback**

```javascript
// OAuth2Callback.js
const handleOAuth2Callback = async () => {
    // 1. Lấy token từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // 2. Lưu token
        localStorage.setItem('token', token);
        setAccessToken(token);  // Lưu vào memory
        
        // 3. Lấy thông tin user
        const me = await newsAPI.getCurrentUser();
        
        // 4. Set user state
        await oauth2Login(token, me.data);
        
        // 5. Redirect
        if (me.data.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    }
};
```

---

## 📊 **PHẦN 7: TỔNG HỢP LUỒNG HOẠT ĐỘNG**

### **7.1. Đăng nhập và Sử dụng**

```
1. Login → Nhận Access Token + Refresh Token (cookie)
2. Lưu Access Token vào memory
3. Gửi request với header: Authorization: Bearer {token}
4. JwtAuthenticationFilter validate token
5. Set Authentication vào SecurityContext
6. Controller xử lý request
```

### **7.2. Token Refresh**

```
1. Access Token hết hạn → 401
2. Interceptor phát hiện → Gọi /refresh
3. Backend:
   - Revoke Refresh Token cũ
   - Tạo Refresh Token mới (cùng family)
   - Tạo Access Token mới
4. Response: Access Token mới + Refresh Token mới (cookie)
5. Frontend lưu token mới
6. Retry request gốc với token mới
```

### **7.3. Đăng xuất**

```
1. User click logout
2. Frontend gọi POST /api/auth/logout
3. Backend:
   - Revoke Refresh Token
   - Clear cookie
4. Frontend xóa Access Token (memory)
5. Redirect về login
```

---

## 🔒 **BẢO MẬT**

### **1. HttpOnly Cookie**
- ✅ JavaScript không thể đọc Refresh Token
- ✅ Chống XSS attack

### **2. Token Rotation**
- ✅ Mỗi lần refresh tạo token mới
- ✅ Token cũ bị revoked
- ✅ Giảm thiểu thiệt hại nếu bị đánh cắp

### **3. Token Family**
- ✅ Phát hiện token reuse
- ✅ Revoke cả family nếu phát hiện reuse

### **4. Short-lived Access Token**
- ✅ Token hết hạn nhanh (1 ngày)
- ✅ Dễ revoke

### **5. Hashed Refresh Token**
- ✅ Lưu hash trong database (SHA-256)
- ✅ Không lưu raw token

---

## 📝 **TÓM TẮT**

### **Access Token (JWT):**
- Ngắn hạn (1 ngày)
- Lưu trong memory
- Gửi kèm mỗi request

### **Refresh Token:**
- Dài hạn (7-30 ngày)
- HttpOnly cookie
- Dùng để lấy Access Token mới

### **Token Rotation:**
- Mỗi lần refresh tạo token mới
- Token cũ bị revoked

### **Token Family:**
- Chống token reuse attack
- Phát hiện và revoke cả family

### **Automatic Refresh:**
- Frontend tự động refresh khi 401
- Request queue để tránh nhiều request refresh

---

**Hệ thống xác thực và phân quyền này rất an toàn và hiện đại! 🚀**



