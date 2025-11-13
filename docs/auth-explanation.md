# Authentication & Authorization Architecture

## Tổng quan
- Sử dụng kiến trúc 2-token: Access Token (JWT, ngắn hạn, lưu memory) + Refresh Token (dài hạn, HttpOnly cookie).
- Thành phần chính: Spring Security, JWT (jjwt), RefreshToken rotation + token family, OAuth2 Google, React Axios interceptor.

## Luồng đăng nhập (username/password)
1. Frontend gửi POST `/api/auth/signin` với { username, password }.
2. `AuthenticationManager.authenticate` xác thực.
3. Tạo Access Token: `JwtUtil.generateJwtToken(authentication)`.
4. Tạo Refresh Token: `RefreshTokenService.createRefreshToken(user)` → UUID → hash SHA-256 → lưu DB (kèm `tokenFamily`).
5. Trả về:
   - Body: JWT + thông tin user (`JwtResponse`).
   - Header: `Set-Cookie` refresh token (HttpOnly, SameSite, Path theo config `CookieUtil`).
6. Frontend lưu Access Token vào RAM (biến JS), cookie HttpOnly tự trình duyệt gửi kèm.

## Luồng refresh token (tự động)
1. Access Token hết hạn → API 401.
2. Axios interceptor gọi POST `/api/auth/refresh` (cookie gửi kèm tự động).
3. `RefreshTokenService.exchangRefreshToken(oldRawToken)`:
   - Hash, tra DB; nếu token invalid hoặc đã revoked → 401 và clear cookie.
   - Kiểm tra hết hạn → revoke token cũ.
   - Rotation: tạo Refresh Token mới cùng `tokenFamily`, revoke token cũ.
   - Trả về user.
4. Tạo Access Token mới từ username, set cookie refresh mới.
5. Frontend cập nhật Access Token RAM, retry request gốc.

## Token rotation & token family
- Mỗi lần refresh, token cũ bị revoke, sinh token mới cùng `tokenFamily`.
- Nếu phát hiện token đã bị revoke vẫn được sử dụng → coi là reuse → `revokeTokenFamily(family)` để vô hiệu toàn bộ family → buộc đăng nhập lại.

## JWT Authentication Filter
- `JwtAuthenticationFilter` đọc header `Authorization: Bearer <JWT>` trên mỗi request:
  - Validate chữ ký + hạn dùng (JwtUtil).
  - Lấy username từ token → `UserDetailServiceImpl.loadUserByUsername` → tạo `UsernamePasswordAuthenticationToken` và set vào `SecurityContextHolder`.
- Cấu hình filter:
  ```java
  http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
  ```

## Phân quyền theo URL (SecurityConfig)
- Public:
  - `/api/auth/signin`, `/api/auth/signup`, `/api/auth/refresh`, `/oauth2/**`
  - `GET /api/news/**`, `GET /api/live-content/**`, `/api/category/**`, `/ws/**`
- Yêu cầu đăng nhập: `/api/news/my-news/**`, POST `/api/media/upload*`
- Chỉ ADMIN: `/api/admin/**`
- Mặc định: `anyRequest().authenticated()`

## OAuth2 Google
1. Người dùng đăng nhập Google → backend nhận callback.
2. `OAuth2LoginSuccessHandler` lấy email, tên, ảnh; tạo/lấy user DB.
3. Phát JWT từ username, redirect về frontend `/oauth2/callback?token=<jwt>`.
4. Frontend set Access Token RAM, gọi `/api/auth/me` lấy profile, điều hướng theo vai trò.

## WebSocket authentication (cho Live News)
- `WebSocketAuthInterceptor` chạy trên inbound channel:
  - Đọc `Authorization` từ STOMP native headers.
  - Validate JWT, load user và gắn `Authentication` vào `SecurityContextHolder` + `StompHeaderAccessor`.
  - Nhờ đó `LiveNewsController` đọc được `Authentication` trong `@MessageMapping` (ví dụ lấy `UserPrincipal.id`).

## Frontend (axios) – automatic refresh
- Lưu Access Token trong biến RAM (`setAccessToken`).
- Interceptor request: đính kèm `Authorization: Bearer <token>`.
- Interceptor response:
  - Nếu 401 và chưa retry: gọi `/auth/refresh`, xếp hàng (queue) các request khác để tránh gọi refresh song song.
  - Khi refresh thành công: cập nhật token, retry các request trong queue.

## Bảo mật chính
- Refresh Token lưu HttpOnly cookie → chống XSS.
- Refresh Token lưu dưới dạng hash trong DB → không lộ raw token.
- Rotation + token family → giảm thiểu rủi ro reuse.
- Tài khoản bị khóa (`UserStatus.INACTIVE`) → `UserPrincipal.isEnabled()` trả về false.

## Tóm tắt endpoints lõi
- Auth: 
  - POST `/api/auth/signin`, `/api/auth/signup`, `/api/auth/refresh`, `/api/auth/logout`, GET/PUT `/api/auth/me`
- Media: 
  - POST `/api/media/upload` (yêu cầu authenticated)
- Live News (WebSocket):
  - SEND: `/app/live/{newsId}/addEntry|updateEntry|deleteEntry`
  - SUBSCRIBE: `/topic/live/{newsId}`
- News public: 
  - GET `/api/news/**`, GET `/api/live-content/news/{newsId}`


