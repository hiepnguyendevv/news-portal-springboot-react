# Project News - Website Tin Tức

Đây là một website tin tức được xây dựng với React.js (Frontend) và Spring Boot (Backend), sử dụng MySQL làm cơ sở dữ liệu.


## 🛠️ Công nghệ sử dụng

### Frontend
- **React.js 19.1.1** - UI Framework
- **React Router DOM 7.9.1** - Routing
- **Axios 1.12.2** - HTTP Client

### Backend
- **Spring Boot 3.5.5** - Java Framework
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - Data Access Layer
- **JWT (JSON Web Token)** - Token-based Authentication
- **Maven** - Build Tool

### Database
- **MySQL 8.0** - Relational Database

## 📋 Yêu cầu hệ thống

- **Java 17+**
- **Node.js 16+** và **npm**
- **MySQL 8.0+**
- **Maven 3.6+**

## 🚀 Hướng dẫn cài đặt và chạy project

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd Project-news
```

### Bước 2: Cài đặt và cấu hình MySQL

1. **Cài đặt MySQL 8.0+** trên máy của bạn

2. **Tạo database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS news_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Cập nhật cấu hình database** trong file `news-services/src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```

   **Lưu ý:** Các bảng (users, categories, news) sẽ được Spring Boot tự động tạo khi chạy backend lần đầu.

### Bước 3: Chạy Backend (Spring Boot)

1. **Mở terminal và di chuyển vào thư mục backend:**
   ```bash
   cd news-services
   ```

2. **Cài đặt dependencies và chạy ứng dụng:**
   ```bash
   # Sử dụng Maven wrapper
   ./mvnw spring-boot:run
   
   # Hoặc nếu có Maven cài đặt global
   mvn spring-boot:run
   ```

3. **Backend sẽ chạy tại:** `http://localhost:8080`

   **Lưu ý:** Spring Boot sẽ tự động tạo các bảng database (users, categories, news) khi khởi động lần đầu nhờ cấu hình `spring.jpa.hibernate.ddl-auto=update`

### Bước 4: Chạy Frontend (React.js)

1. **Mở terminal mới và di chuyển vào thư mục frontend:**
   ```bash
   cd news-frontend
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng:**
   ```bash
   npm start
   ```

4. **Frontend sẽ chạy tại:** `http://localhost:3000`

## 🐳 Chạy với Docker

Nếu bạn muốn chạy project với Docker, đây là cách đơn giản nhất:

### Yêu cầu:
- **Docker** và **Docker Compose** đã cài đặt
- Không cần cài đặt Java, Node.js hay MySQL riêng

### Cách chạy:

1. **Mở terminal tại thư mục gốc project:**
   ```bash
   cd Project-news
   ```

2. **Chạy tất cả services với Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Truy cập ứng dụng:**
   - **Frontend:** `http://localhost:3000`
   - **Backend:** `http://localhost:8080`
   - **MySQL:** `localhost:3307` (username: `root`, password: `hiep2003`)

### Các lệnh Docker hữu ích:

```bash
# Chạy ở background
docker-compose up -d

# Dừng tất cả services
docker-compose down


```

### Cấu trúc Docker:
- **MySQL 8.0** - Database (port 3307)
- **Spring Boot** - Backend API (port 8080)
- **React + Nginx** - Frontend (port 3000)
=
## 📊 Import dữ liệu mẫu

Sau khi chạy backend thành công (cả Docker và cách thông thường), bạn có thể import dữ liệu mẫu:

### Cách 1: Sử dụng Postman 

1. **Mở Postman** và tạo request mới
2. **Thiết lập request:**
   - Method: `POST`
   - URL: `http://localhost:8080/api/news/import-sample-data`
   - Headers: `Content-Type: application/json`
   - Body: `{}` (để trống)

3. **Gửi request** để import dữ liệu mẫu

### Cách 2: Sử dụng cURL

```bash
curl -X POST http://localhost:8080/api/news/import-sample-data \
  -H "Content-Type: application/json" \
  -d "{}"
```


```

**Lưu ý:** Dữ liệu mẫu bao gồm:
- 1 tài khoản admin (username: `admin`, password: `admin123`)
- Các danh mục tin tức (Công nghệ, Thể thao, Kinh tế...)
- 20+ tin tức mẫu với hình ảnh ngẫu nhiên

## 🔐 Thông tin tài khoản Admin

Sau khi import dữ liệu mẫu, bạn có thể đăng nhập với tài khoản admin:

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@news.com`
- **Quyền:** ADMIN (có thể quản lý tất cả chức năng)

**Cách đăng nhập:**
1. Truy cập `http://localhost:3000/login`
2. Nhập username: `admin`
3. Nhập password: `admin123`
4. Click "Đăng nhập"

Sau khi đăng nhập, bạn sẽ có quyền truy cập vào trang Admin để quản lý người dùng, danh mục và tin tức.


## 📱 Tính năng chính

### Cho người dùng thường:
- ✅ Xem danh sách tin tức
- ✅ Xem chi tiết tin tức
- ✅ Tìm kiếm tin tức
- ✅ Lọc tin tức theo danh mục
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập/đăng xuất
- ✅ Quản lý tin tức cá nhân (tạo, sửa, xóa)

### Cho quản trị viên:
- ✅ Quản lý người dùng
- ✅ Quản lý danh mục tin tức
- ✅ Quản lý tất cả tin tức
- ✅ Phân quyền người dùng

## 🔧 Cấu hình API

### Endpoints chính:
- `GET /api/news` - Lấy danh sách tin tức
- `GET /api/news/{id}` - Lấy chi tiết tin tức
- `POST /api/news/import-sample-data` - Import dữ liệu mẫu
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/signup` - Đăng ký
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/users` - Lấy danh sách người dùng (Admin)

### Authentication:
- Sử dụng JWT token
- Token được gửi trong header: `Authorization: Bearer <token>`

## 🗂️ Cấu trúc Database

### Bảng chính:
- **users** - Thông tin người dùng
- **categories** - Danh mục tin tức
- **news** - Tin tức

## 🐛 Troubleshooting

### Lỗi thường gặp:

#### Với Docker:

1. **Lỗi build Docker:**
   ```bash
   # Xóa images cũ và build lại
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

2. **Lỗi kết nối database trong Docker:**
   ```bash
   # Kiểm tra logs
   docker-compose logs mysql
   docker-compose logs news-services
   
   # Restart services
   docker-compose restart
   ```

3. **Lỗi port đã được sử dụng:**
   - MySQL: port 3307 (Docker) vs 3306 (thông thường)
   - Kiểm tra port: `netstat -tulpn | grep :3307`

#### Với cách thông thường:

1. **Lỗi kết nối database:**
   - Kiểm tra MySQL đã chạy chưa
   - Kiểm tra username/password trong `application.properties`
   - Kiểm tra port 3306 có bị chiếm không

2. **Lỗi CORS:**
   - Backend đã cấu hình CORS cho frontend
   - Kiểm tra URL frontend trong SecurityConfig

3. **Lỗi JWT:**
   - Kiểm tra JWT secret trong `application.properties`
   - Đảm bảo token được gửi đúng format

4. **Lỗi port đã được sử dụng:**
   - Backend: port 8080
   - Frontend: port 3000
   - MySQL: port 3306 (thông thường) / 3307 (Docker)

## 📝 Ghi chú

- Project sử dụng Hibernate để tự động tạo bảng database
- JWT token có thời hạn 24 giờ
- Mật khẩu được mã hóa bằng BCrypt
- Có phân quyền USER và ADMIN


