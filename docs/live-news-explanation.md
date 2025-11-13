# 📡 GIẢI THÍCH CHI TIẾT HỆ THỐNG LIVE NEWS (REAL-TIME)

## 🎯 Mục tiêu
- Cho phép admin đăng/tùy chỉnh các entry tường thuật theo thời gian thực cho một bài viết có `isRealtime = true`.
- Mọi client đang xem bài viết đó nhận cập nhật ngay lập tức, không cần reload.

---

## 🏗 Kiến trúc tổng quan

```
┌───────────────────────┐      SEND (/app/...)        ┌─────────────────────┐
│  React (Dashboard)    │ ───────────────────────────> │  Spring WebSocket   │
│  React (Viewer)       │ <─────────────────────────── │  STOMP Broker (/topic)
└──────────┬────────────┘        SUBSCRIBE (/topic)    └──────────┬──────────┘
           │                                              convertAndSend │
           │ SockJS/STOMP                                  (Broadcast)  │
           ▼                                                           ▼
     Persistent WS                                             Redis Pub/Sub
           ▲                                                           │
           │                                                           │ onMessage
           │         convertAndSend("live-news-event", event)          ▼
           │                                                           
           │               ┌───────────────────────────┐
           └────────────── │ RedisMessageSubscriber    │
                           │  route → /topic/live/{id} │
                           └───────────────────────────┘
```

- WebSocket (SockJS + STOMP) dùng cho kết nối 2 chiều và subscribe/publish topics.
- Redis Pub/Sub dùng làm message bus để scale nhiều instance backend và decouple service với WS.
- Cloudinary lưu ảnh/video; service tự xóa media cũ khi cập nhật/xóa entry.

---

## 🔐 Xác thực WebSocket

### Luồng xác thực
1. Client kết nối `/ws` (SockJS) và SUBSCRIBE/PUBLISH kèm header `Authorization: Bearer <JWT>` (STOMP native header).
2. `WebSocketAuthInterceptor` bắt inbound frames (CONNECT/SEND/SUBSCRIBE), lấy token, validate bằng `JwtUtil`, load user, set `Authentication` vào `SecurityContextHolder` và `StompHeaderAccessor`.
3. Trong `LiveNewsController`, các handler `@MessageMapping` nhận được `Authentication` để biết `userId`/role.

### Code trích yếu
```java
// WebSocketConfig
@Override
public void configureClientInboundChannel(ChannelRegistration reg) {
    reg.interceptors(webSocketAuthInterceptor);
}

// WebSocketAuthInterceptor
if (CONNECT/SEND/SUBSCRIBE) {
  String auth = accessor.getFirstNativeHeader("Authorization");
  if (auth != null && auth.startsWith("Bearer ")) {
    String token = auth.substring(7);
    if (jwtUtil.validationJwtToken(token)) {
      String username = jwtUtil.getUserNameFromToken(token);
      UserDetails ud = userDetailsService.loadUserByUsername(username);
      var authn = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
      SecurityContextHolder.getContext().setAuthentication(authn);
      accessor.setUser(authn);
    }
  }
}
```

---

## 🧩 Thành phần backend chính

### 1) WebSocket broker
- Endpoint: `/ws` (có SockJS, whitelist origin theo config).
- Application destination prefix: `/app` (client gửi lên).
- Broker prefix: `/topic` (server publish xuống).

```java
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
  config.enableSimpleBroker("/topic");
  config.setApplicationDestinationPrefixes("/app");
}
```

### 2) Controller (LiveNewsController)
- REST lấy dữ liệu ban đầu (phân trang): `GET /api/live-content/news/{newsId}`.
- WS handlers:
  - `@MessageMapping("/live/{newsId}/addEntry")`
  - `@MessageMapping("/live/{newsId}/updateEntry")`
  - `@MessageMapping("/live/{newsId}/deleteEntry")`

```java
@MessageMapping("/live/{newsId}/addEntry")
public void addEntry(@DestinationVariable Long newsId, LiveNewsEvent dto, Authentication auth) {
  Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
  liveContentService.addContent(newsId, userId, dto);
}
```

### 3) Service (LiveContentService)
- Làm sạch HTML: `Jsoup.clean(rawHtml, Safelist.basicWithImages())`.
- Lưu DB: entity `LiveContent` có các trường: `content`, `entryStatus` (PUBLISHED, PINNED, CORRECTION), `contentType` (TEXT, IMAGE, VIDEO_EMBED), `mediaUrl`, `sortOrder`, `createdAt/updatedAt`.
- Sau khi add/update/delete → tạo `LiveNewsEvent` và publish lên Redis channel `live-news-event`.

```java
redisTemplate.convertAndSend(LIVE_NEWS_CHANNEL, event);
```

- Update/Delete có logic xóa media cũ trên Cloudinary (suy `resource_type` từ URL; tách `publicId` bằng regex `/upload/(?:v\d+/)?([^.]+?)(\.\w+)?$`).

### 4) Redis cấu hình và subscriber
- `RedisTemplate<String,Object>` dùng `GenericJackson2JsonRedisSerializer` (đã đăng ký `JavaTimeModule` để serialize `LocalDateTime`).
- `RedisMessageListenerContainer` đăng ký `ChannelTopic("live-news-event")`.
- `RedisMessageSubscriber.onMessage()` deserialize JSON → route tới `/topic/live/{newsId}` bằng `SimpMessagingTemplate`.

```java
LiveNewsEvent event = objectMapper.readValue(message.getBody(), LiveNewsEvent.class);
String destination = "/topic/live/" + event.getNewsId();
simpMessagingTemplate.convertAndSend(destination, event);
```

---

## 🗃 Data model & DTO

### Entity: `LiveContent`
```java
@Id Long id;
@ManyToOne News news;
@ManyToOne User user;
@Column(TEXT) String content;
@Enumerated EntryStatus entryStatus; // PUBLISHED, PINNED, CORRECTION
@Enumerated ContentType contentType; // TEXT, IMAGE, VIDEO_EMBED
String mediaUrl; Integer sortOrder;
LocalDateTime createdAt, updatedAt;
```

### DTO: `LiveNewsEvent`
```java
String action; // ADD_ENTRY, UPDATE_ENTRY, REMOVE_ENTRY
Long id, newsId, userId;
String content, entryStatus, contentType, mediaUrl;
Integer sortOrder; LocalDateTime createdAt, updatedAt;
```

---

## 🌐 Frontend workflow

### 1) Kết nối & subscribe
```js
const client = new Client({
  webSocketFactory: () => new SockJS('/ws'),
  reconnectDelay: 5000,
  connectHeaders: { Authorization: `Bearer ${inMemoryAccessToken}` }
});

client.onConnect = () => {
  client.subscribe(`/topic/live/${newsId}`, frame => {
    const event = JSON.parse(frame.body);
    switch (event.action) {
      case 'ADD_ENTRY':   /* prepend/append */ break;
      case 'UPDATE_ENTRY':/* map by id */     break;
      case 'REMOVE_ENTRY':/* filter by id */  break;
    }
  });
};

client.activate();
```

### 2) Publish entry (dashboard)
```js
client.publish({
  destination: `/app/live/${newsId}/addEntry`,
  headers: { Authorization: `Bearer ${inMemoryAccessToken}` },
  body: JSON.stringify({
    action: 'ADD_ENTRY',
    content, contentType: 'TEXT',
    entryStatus: isPinned ? 'PINNED' : 'PUBLISHED',
    mediaUrl, sortOrder
  })
});
```

### 3) Initial load (viewer/dashboard)
- Gọi REST: `GET /api/live-content/news/{newsId}?page=0&size=50` để lấy danh sách entry ban đầu (phân trang).
- Phân loại hiển thị: `PINNED` (ghim) lên đầu, còn lại theo thời gian/sortOrder.

---

## 🖼 Xử lý media (Cloudinary)
- Khi UPDATE/DELETE entry: nếu có `mediaUrl` cũ, service tách `publicId` và gọi `cloudinary.uploader().destroy(publicId, { resource_type, invalidate: true })`.
- `resource_type`: suy từ URL chứa `/video/`, `/raw/`, mặc định `image`.
- Khi tạo entry mới từ dashboard, file được upload qua REST `/api/media/upload` để lấy `mediaUrl` (sau đó mới publish WS).

---

## 🔄 Dòng sự kiện chi tiết

### A) Thêm entry
```
1. Dashboard chọn nội dung → upload media (tuỳ chọn) → lấy mediaUrl
2. WS PUBLISH → /app/live/{newsId}/addEntry (kèm JWT)
3. Interceptor xác thực WS → Controller → Service
4. Service sanitize HTML → lưu LiveContent → tạo LiveNewsEvent(action=ADD_ENTRY)
5. Publish Redis "live-news-event"
6. Subscriber route → /topic/live/{newsId}
7. Mọi client subscribe topic nhận ngay event và cập nhật UI
```

### B) Cập nhật entry
```
1. Dashboard mở modal edit → có thể upload media mới
2. WS PUBLISH → /app/live/{newsId}/updateEntry
3. Service xoá media cũ (nếu có) → cập nhật DB → publish UPDATE_ENTRY
4. Subscriber broadcast → clients map theo id để cập nhật hiển thị
```

### C) Xoá entry
```
1. Dashboard xác nhận xoá
2. WS PUBLISH → /app/live/{newsId}/deleteEntry (body có id)
3. Service kiểm tra newsId khớp → xoá media (nếu có) → xoá DB → publish REMOVE_ENTRY
4. Subscriber broadcast → clients filter bỏ entry theo id
```

---

## 🔒 Bảo mật & phân quyền
- WS publish bắt buộc kèm JWT hợp lệ (interceptor cưỡng chế).
- Có thể giới hạn role ở service/controller (ví dụ chỉ `ROLE_ADMIN` được add/update/delete).
- REST `GET /api/live-content/news/{id}` mở public để viewer tải initial content.
- Xoá bài realtime (`NewsService.deleteMyNews`) sẽ dọn `LiveContent` lẫn media liên quan.

---

## ⚠️ Xử lý lỗi & độ bền
- WebSocket auto-reconnect (`reconnectDelay: 5000`).
- Khi Redis/Cloudinary lỗi: try/catch tại service; log lỗi, không làm gãy kết nối WS.
- Đồng bộ thời gian: serialize `LocalDateTime` ISO (đã cấu hình serializer trong RedisTemplate).
- Chống XSS: `Jsoup.clean` với safelist cho phép ảnh.

---

## 📚 Tóm tắt endpoints & channels

### REST
- `GET  /api/live-content/news/{newsId}?page=&size=` – lấy entries ban đầu (paged)
- `POST /api/media/upload` – upload media, trả `url` (yêu cầu authenticated)

### WebSocket
- SEND (client → server):
  - `/app/live/{newsId}/addEntry`
  - `/app/live/{newsId}/updateEntry`
  - `/app/live/{newsId}/deleteEntry`
- SUBSCRIBE (server → client):
  - `/topic/live/{newsId}` – nhận sự kiện ADD/UPDATE/REMOVE

---

## ✅ Điểm mạnh kiến trúc
- Real-time mượt (push ngay lập tức, không polling).
- Dễ scale ngang (nhiều instance backend) nhờ Redis Pub/Sub.
- Decoupled: service không phụ thuộc trực tiếp vào WebSocket.
- An toàn: sanitize HTML, xác thực WS bằng JWT, quản lý media rõ ràng.

