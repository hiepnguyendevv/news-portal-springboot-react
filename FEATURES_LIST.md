# DANH SÁCH CÁC CHỨC NĂNG CỦA PROJECT NEWS
## Sắp xếp theo độ phức tạp (từ khó đến dễ)

---

## 🔴 **1. HỆ THỐNG LIVE NEWS (REAL-TIME) - PHỨC TẠP NHẤT**
**Mức độ:** ⭐⭐⭐⭐⭐ (Rất phức tạp)

### Mô tả:
Hệ thống tường thuật trực tiếp (live blog) cho phép admin cập nhật tin tức theo thời gian thực. Người dùng xem tin tức sẽ tự động nhận được cập nhật mới mà không cần refresh trang.

### Các thành phần chính:
- **Backend:**
  - `LiveNewsController.java` - Xử lý WebSocket messages (STOMP)
  - `LiveContentService.java` - Business logic cho live content
  - `LiveContent.java` - Entity với các trạng thái: PUBLISHED, PINNED, CORRECTION
  - `RedisMessageSubscriber.java` - Lắng nghe Redis pub/sub và forward qua WebSocket
  - `RedisConfig.java` - Cấu hình Redis message broker
  - `WebSocketConfig.java` - Cấu hình WebSocket/STOMP

- **Frontend:**
  - `LiveNews.js` - Component hiển thị live blog cho người dùng
  - `LiveNewsDashboard.js` - Dashboard quản lý cho admin
  - `EntryForm.js`, `EntryItem.js`, `EntryList.js` - Components quản lý entries
  - `EditEntryModal.js` - Modal chỉnh sửa entry

### Công nghệ sử dụng:
- WebSocket (SockJS + STOMP)
- Redis Pub/Sub (message broker)
- Real-time synchronization
- Image/Video upload to Cloudinary

### Luồng hoạt động:
1. Admin tạo entry mới → gửi qua WebSocket
2. Backend lưu vào DB → publish event lên Redis channel
3. Redis subscriber nhận event → forward qua WebSocket topic
4. Tất cả clients đăng ký topic nhận được update real-time

---

## 🔴 **2. HỆ THỐNG XÁC THỰC VÀ PHÂN QUYỀN (JWT + REFRESH TOKEN + OAuth2)**
**Mức độ:** ⭐⭐⭐⭐⭐ (Rất phức tạp)

### Mô tả:
Hệ thống bảo mật đa lớp với JWT Access Token, Refresh Token (HttpOnly cookie), và OAuth2 login (Google).

### Các thành phần chính:
- **Backend:**
  - `AuthController.java` - Xử lý login, signup, refresh token
  - `RefreshTokenService.java` - Quản lý refresh token với token family (chống reuse attack)
  - `JwtUtil.java` - Tạo và validate JWT
  - `JwtAuthenticationFilter.java` - Filter kiểm tra JWT trên mỗi request
  - `SecurityConfig.java` - Cấu hình Spring Security
  - `OAuth2LoginSuccessHandler.java` - Xử lý OAuth2 callback
  - `CookieUtil.java` - Utility tạo HttpOnly cookies
  - `RefreshToken.java` - Entity lưu refresh token (hashed)

- **Frontend:**
  - `AuthContext.js` - Context quản lý authentication state
  - `api.js` - Axios interceptor tự động refresh token khi hết hạn
  - `OAuth2Callback.js` - Xử lý callback từ OAuth2

### Tính năng bảo mật:
- Refresh Token rotation (mỗi lần refresh tạo token mới)
- Token family để phát hiện token reuse (nếu token bị đánh cắp)
- HttpOnly cookies (chống XSS)
- Automatic token refresh với request queue
- OAuth2 integration (Google)

---

## 🟠 **3. HỆ THỐNG COMMENT PHÂN CẤP (HIERARCHICAL)**
**Mức độ:** ⭐⭐⭐⭐ (Phức tạp)

### Mô tả:
Hệ thống comment có thể reply nhiều cấp, sử dụng path-based tree structure để quản lý hierarchy.

### Các thành phần chính:
- **Backend:**
  - `CommentController.java` - API endpoints
  - `CommentService.java` - Logic xử lý comment tree
  - `Comment.java` - Entity với path field (ví dụ: "1.5.12")
  - `CommentLike.java` - Entity cho like comment
  - Depth tracking (độ sâu của comment)

- **Frontend:**
  - `CommentSection.js` - Component hiển thị comment tree
  - `CommentSearch.js`, `CommentTable.js` - Admin components

### Đặc điểm:
- Path-based tree structure (ví dụ: "1", "1.5", "1.5.12")
- Soft delete (comment bị xóa nhưng vẫn lưu trong DB)
- Like/Unlike comment
- Hiển thị số lượng replies
- Recursive loading replies

---

## 🟠 **4. HỆ THỐNG QUẢN LÝ TIN TỨC VỚI WORKFLOW**
**Mức độ:** ⭐⭐⭐⭐ (Phức tạp)

### Mô tả:
Hệ thống quản lý tin tức với workflow: DRAFT → PENDING_REVIEW → PUBLISHED. Bao gồm cả tin tức của user và admin.

### Các thành phần chính:
- **Backend:**
  - `NewsService.java` - Business logic phức tạp
  - `AdminNewsController.java` - Admin APIs
  - `NewsController.java` - Public APIs
  - `News.java` - Entity với status enum (DRAFT, PENDING_REVIEW, PUBLISHED)
  - Featured news (tin nổi bật)
  - Review notes (ghi chú từ admin)

- **Frontend:**
  - `NewsManagement.js` - Admin quản lý tin
  - `CreateNews.js`, `EditNews.js` - Tạo/sửa tin
  - `CreateMyNews.js`, `EditMyNews.js` - User tạo tin của mình
  - `MyNews.js` - Danh sách tin của user
  - `AdminRejectModal.js` - Modal từ chối tin

### Workflow:
1. User tạo tin → Status = DRAFT
2. User submit → Status = PENDING_REVIEW
3. Admin review → APPROVE (PUBLISHED) hoặc REJECT (với review note)

---

## 🟡 **5. HỆ THỐNG UPLOAD VÀ QUẢN LÝ MEDIA (CLOUDINARY)**
**Mức độ:** ⭐⭐⭐ (Khá phức tạp)

### Mô tả:
Upload ảnh/video lên Cloudinary, tự động xóa file cũ khi update/delete.

### Các thành phần chính:
- **Backend:**
  - `MediaController.java` - API upload
  - `CloudinaryService.java` - Service tích hợp Cloudinary
  - `CloudinaryConfig.java` - Cấu hình Cloudinary
  - Logic extract publicId từ URL để xóa file
  - Hỗ trợ image, video, raw files

- **Frontend:**
  - `mediaHelper.js` - Utility functions
  - TinyMCE editor tích hợp upload

### Tính năng:
- Upload image/video
- Auto-delete old files khi update
- Extract publicId từ Cloudinary URL
- Handle different resource types (image/video/raw)

---

## 🟡 **6. HỆ THỐNG ĐẾM LƯỢT XEM VỚI CACHE (REDIS)**
**Mức độ:** ⭐⭐⭐ (Khá phức tạp)

### Mô tả:
Đếm lượt xem tin tức với cơ chế chống spam (cooldown) sử dụng Redis.

### Các thành phần chính:
- **Backend:**
  - `NewsService.incrementViewCountWithCoolDown()` - Logic đếm view
  - Redis key: `view:{newsId}:{visitorKey}`
  - TTL: 1 phút (cooldown)
  - Visitor key: User ID (nếu đã login) hoặc hash(IP + UserAgent)

### Tính năng:
- Chống spam view (1 visitor chỉ tính 1 view/phút)
- Phân biệt user và guest
- Redis caching với TTL

---

## 🟡 **7. HỆ THỐNG BOOKMARK (LƯU TIN TỨC)**
**Mức độ:** ⭐⭐ (Trung bình)

### Mô tả:
Người dùng có thể lưu tin tức yêu thích vào bookmark.

### Các thành phần chính:
- **Backend:**
  - `BookmarkController.java` - CRUD operations
  - `Bookmark.java` - Entity

- **Frontend:**
  - `BookmarkButton.js` - Component nút bookmark
  - `SavedNews.js` - Trang hiển thị tin đã lưu

### Tính năng:
- Add/Remove bookmark
- Check bookmark status
- Pagination cho danh sách bookmark

---

## 🟢 **8. HỆ THỐNG TAG (THẺ)**
**Mức độ:** ⭐⭐ (Trung bình)

### Mô tả:
Gán nhiều tag cho một tin tức, tự động tạo tag nếu chưa tồn tại.

### Các thành phần chính:
- **Backend:**
  - `TagController.java`
  - `TagService.java` - Auto-create tags
  - `Tag.java`, `NewsTag.java` - Many-to-many relationship

### Tính năng:
- Auto-create tags
- Many-to-many relationship
- Search by tags

---

## 🟢 **9. HỆ THỐNG QUẢN LÝ DANH MỤC (CATEGORY)**
**Mức độ:** ⭐⭐ (Trung bình)

### Mô tả:
Quản lý danh mục tin tức, hỗ trợ danh mục con (subcategories).

### Các thành phần chính:
- **Backend:**
  - `CategoryController.java`, `AdminCategoryController.java`
  - `CategoryService.java`
  - `Category.java` - Entity với parent-child relationship

- **Frontend:**
  - `CategoryManagement.js`, `CreateCategory.js`, `EditCategory.js`
  - `Category.js` - Trang hiển thị tin theo danh mục

### Tính năng:
- CRUD categories
- Parent-child relationship
- Slug-based routing

---

## 🟢 **10. HỆ THỐNG QUẢN LÝ NGƯỜI DÙNG**
**Mức độ:** ⭐⭐ (Trung bình)

### Mô tả:
Admin quản lý người dùng, phân quyền (USER, ADMIN), kích hoạt/khóa tài khoản.

### Các thành phần chính:
- **Backend:**
  - `UserController.java`, `AdminNewsController` (user management)
  - `UserService.java`
  - `User.java` - Entity với role enum (USER, ADMIN) và status (ACTIVE, INACTIVE)

- **Frontend:**
  - `UserManagement.js`, `CreateUser.js`, `EditUser.js`
  - `UserTable.js`

### Tính năng:
- CRUD users
- Role management
- Status management (active/inactive)
- Profile management

---

## 🟢 **11. HỆ THỐNG TÌM KIẾM VÀ PHÂN TRANG**
**Mức độ:** ⭐ (Đơn giản)

### Mô tả:
Tìm kiếm tin tức, phân trang, sắp xếp.

### Các thành phần chính:
- **Backend:**
  - `NewsService.searchNews()` - Full-text search
  - `NewsService.adminSearchNews()` - Advanced search với filters
  - Pagination với Spring Data JPA

- **Frontend:**
  - `Search.js` - Trang tìm kiếm
  - `Pagination.js` - Component phân trang
  - `AdminNewsFilters.js` - Filters cho admin

### Tính năng:
- Full-text search
- Filter by category, status, featured
- Sort by view count, date
- Pagination

---

## 🟢 **12. HỆ THỐNG NOTIFICATION (THÔNG BÁO)**
**Mức độ:** ⭐ (Đơn giản)

### Mô tả:
Hệ thống thông báo cho người dùng (có thể chưa hoàn thiện).

### Các thành phần chính:
- **Backend:**
  - `NotificationController.java`
  - `NotificationService.java`
  - `Notification.java` - Entity

### Tính năng:
- Get notifications
- Mark as read
- Unread count

---

## 🔵 **13. CÁC CHỨC NĂNG CƠ BẢN (CRUD)**
**Mức độ:** ⭐ (Đơn giản)

### Mô tả:
Các chức năng CRUD cơ bản cho các entity.

### Bao gồm:
- Home page (hiển thị tin mới nhất)
- News detail page
- Category page
- Profile page
- Update profile

---

## 📊 **TÓM TẮT THEO ĐỘ PHỨC TẠP:**

### ⭐⭐⭐⭐⭐ (Rất phức tạp):
1. Live News System (WebSocket + Redis Pub/Sub)
2. Authentication System (JWT + Refresh Token + OAuth2)

### ⭐⭐⭐⭐ (Phức tạp):
3. Comment System (Hierarchical)
4. News Management Workflow

### ⭐⭐⭐ (Khá phức tạp):
5. Media Upload (Cloudinary)
6. View Count System (Redis cache)

### ⭐⭐ (Trung bình):
7. Bookmark System
8. Tag System
9. Category Management
10. User Management

### ⭐ (Đơn giản):
11. Search & Pagination
12. Notification System
13. Basic CRUD

---

## 🛠️ **CÔNG NGHỆ CHÍNH SỬ DỤNG:**

**Backend:**
- Spring Boot 3.5.5
- Spring Security
- Spring Data JPA
- Spring WebSocket (STOMP)
- Redis (Pub/Sub + Cache)
- MySQL
- Cloudinary
- JWT (jjwt)
- OAuth2 Client

**Frontend:**
- React 19
- React Router
- Axios
- SockJS + STOMP.js
- TinyMCE
- React Toastify

---

**Ghi chú:** File này được tạo tự động để liệt kê các chức năng. Bạn có thể hỏi chi tiết về bất kỳ chức năng nào ở trên.




