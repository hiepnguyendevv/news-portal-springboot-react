# 📡 GIẢI THÍCH CHI TIẾT HỆ THỐNG LIVE NEWS (REAL-TIME)

## 🎯 **TỔNG QUAN**

Hệ thống Live News cho phép admin cập nhật tin tức theo thời gian thực (real-time). Khi admin thêm/sửa/xóa một entry, tất cả người dùng đang xem tin tức đó sẽ tự động nhận được cập nhật ngay lập tức mà **không cần refresh trang**.

**Ví dụ thực tế:** Giống như BBC Live, VnExpress Live Blog - khi có sự kiện đang diễn ra, phóng viên cập nhật từng mốc thời gian, người dùng xem sẽ thấy tin mới xuất hiện tự động.

---

## 🏗️ **KIẾN TRÚC HỆ THỐNG**

Hệ thống sử dụng **3 lớp** để truyền dữ liệu real-time:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │    Backend   │         │    Redis    │
│  (React)    │◄───────►│  (Spring)    │◄───────►│   Pub/Sub   │
│             │ WebSocket│             │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
  ┌─────────────────────────────────────────────────────────┐
  │              MySQL Database (Lưu trữ dữ liệu)           │
  └─────────────────────────────────────────────────────────┘
```

### **Các công nghệ sử dụng:**

1. **WebSocket (SockJS + STOMP)** - Giao tiếp 2 chiều real-time
2. **Redis Pub/Sub** - Message broker để phân phối sự kiện
3. **SimpMessagingTemplate** - Spring component gửi message qua WebSocket
4. **Cloudinary** - Lưu trữ ảnh/video

---

## 🔄 **LUỒNG HOẠT ĐỘNG CHI TIẾT**

### **Scenario 1: Admin thêm Entry mới**

```
Bước 1: Admin nhập nội dung và nhấn "Đăng tin"
   │
   ▼
Bước 2: Frontend (EntryForm.js)
   - Upload ảnh/video lên Cloudinary (nếu có)
   - Tạo payload JSON với nội dung
   - Gửi qua WebSocket: `/app/live/{newsId}/addEntry`
   │
   ▼
Bước 3: Backend (LiveNewsController.java)
   - Nhận message qua @MessageMapping("/live/{newsId}/addEntry")
   - Xác thực user (phải là admin)
   - Gọi LiveContentService.addContent()
   │
   ▼
Bước 4: LiveContentService.addContent()
   - Lưu entry vào MySQL database (table: live_content)
   - Sanitize HTML content (Jsoup.clean) để chống XSS
   - Tạo LiveNewsEvent object
   - Publish event lên Redis channel: "live-news-event"
   │
   ▼
Bước 5: Redis Pub/Sub
   - Redis nhận event và broadcast đến tất cả subscribers
   │
   ▼
Bước 6: RedisMessageSubscriber.onMessage()
   - Subscriber nhận event từ Redis
   - Parse JSON thành LiveNewsEvent object
   - Forward qua WebSocket topic: `/topic/live/{newsId}`
   │
   ▼
Bước 7: Tất cả Frontend clients đăng ký topic
   - LiveNews.js (người dùng xem tin)
   - LiveNewsDashboard.js (admin dashboard)
   - Nhận event và cập nhật UI tự động
```

### **Scenario 2: Admin sửa Entry**

Luồng tương tự, nhưng:
- WebSocket destination: `/app/live/{newsId}/updateEntry`
- Action: `UPDATE_ENTRY`
- Xóa ảnh cũ trên Cloudinary trước khi upload ảnh mới

### **Scenario 3: Admin xóa Entry**

Luồng tương tự:
- WebSocket destination: `/app/live/{newsId}/deleteEntry`
- Action: `REMOVE_ENTRY`
- Xóa ảnh/video trên Cloudinary
- Xóa record khỏi database

---

## 📂 **CÁC FILE QUAN TRỌNG VÀ CHỨC NĂNG**

### **1. Backend - Service Layer**

#### **`LiveContentService.java`** - Trái tim của hệ thống

**Chức năng chính:**

```java
// 1. Lấy danh sách entries (phân trang)
public Page<LiveNewsEvent> getLivedContent(Long newsId, Pageable pageable)

// 2. Thêm entry mới
public LiveContent addContent(Long newsId, Long userId, LiveNewsEvent dto)
   - Lưu vào database
   - Sanitize HTML (chống XSS)
   - Publish event lên Redis

// 3. Cập nhật entry
public LiveContent updateContent(Long liveContentId, LiveNewsEvent dto)
   - Xóa ảnh cũ trên Cloudinary
   - Cập nhật database
   - Publish event

// 4. Xóa entry
public void removeContent(Long newsId, Long liveContentId)
   - Xóa ảnh/video trên Cloudinary
   - Xóa khỏi database
   - Publish event
```

**Điểm quan trọng:**
- **Sanitize HTML:** Dùng `Jsoup.clean()` để loại bỏ script độc hại
- **Redis Channel:** `LIVE_NEWS_CHANNEL = "live-news-event"`
- **Auto-delete media:** Tự động xóa ảnh/video cũ khi update

---

#### **`LiveNewsController.java`** - WebSocket Message Handlers

**Chức năng:**

```java
// REST API - Lấy danh sách entries (cho initial load)
@GetMapping("/news/{newsId}")
public ResponseEntity<Page<LiveNewsEvent>> getLiveContent(...)

// WebSocket - Thêm entry
@MessageMapping("/live/{newsId}/addEntry")
public void addEntry(@DestinationVariable Long newsId, LiveNewsEvent dto, Authentication auth)
   - Lấy userId từ authentication
   - Gọi service.addContent()

// WebSocket - Sửa entry
@MessageMapping("/live/{newsId}/updateEntry")
public void updateEntry(...)

// WebSocket - Xóa entry
@MessageMapping("/live/{newsId}/deleteEntry")
public void deleteEntry(...)
```

**Lưu ý:**
- `@MessageMapping` - Spring WebSocket annotation
- `@DestinationVariable` - Lấy biến từ URL (newsId)
- Authentication được inject tự động

---

#### **`RedisMessageSubscriber.java`** - Bridge Redis → WebSocket

**Chức năng:**

```java
@Override
public void onMessage(Message message, byte[] pattern) {
    // 1. Parse JSON từ Redis message
    LiveNewsEvent event = objectMapper.readValue(message.getBody(), LiveNewsEvent.class);
    
    // 2. Tạo destination topic: /topic/live/{newsId}
    String destination = "/topic/live/" + event.getNewsId();
    
    // 3. Forward qua WebSocket
    simpMessagingTemplate.convertAndSend(destination, event);
}
```

**Giải thích:**
- Component này đăng ký lắng nghe Redis channel `"live-news-event"`
- Khi có message mới, nó forward qua WebSocket topic
- Tất cả clients đăng ký topic sẽ nhận được

---

### **2. Backend - Configuration**

#### **`WebSocketConfig.java`** - Cấu hình WebSocket

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig {
    
    // 1. Cấu hình message broker
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");  // Topics clients subscribe
        config.setApplicationDestinationPrefixes("/app");  // Prefix khi gửi từ client
    }
    
    // 2. Đăng ký WebSocket endpoint
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(...)  // CORS
                .withSockJS();  // Fallback cho browsers không hỗ trợ WebSocket
    }
}
```

**Giải thích:**
- `/topic/*` - Topics để subscribe (nhận message)
- `/app/*` - Prefix khi gửi message từ client
- `/ws` - WebSocket endpoint URL
- SockJS - Polyfill cho browsers cũ

---

#### **`RedisConfig.java`** - Cấu hình Redis Pub/Sub

```java
@Configuration
public class RedisConfig {
    
    // 1. Cấu hình RedisTemplate
    @Bean
    public RedisTemplate<String, Object> redisTemplate(...)
    
    // 2. Tạo MessageListenerAdapter
    @Bean
    public MessageListenerAdapter messageListenerAdapter(RedisMessageSubscriber subscriber)
    
    // 3. Đăng ký subscriber lắng nghe channel
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(...) {
        container.addMessageListener(messageListenerAdapter, 
                                     new ChannelTopic("live-news-event"));
    }
}
```

---

### **3. Frontend - Components**

#### **`LiveNewsDashboard.js`** - Admin Dashboard

**Chức năng:**

```javascript
// 1. Kết nối WebSocket
useEffect(() => {
    const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 5000,
    });
    
    client.onConnect = () => {
        // Subscribe vào topic
        client.subscribe(`/topic/live/${newsId}`, (frame) => {
            const eventData = JSON.parse(frame.body);
            
            // Xử lý theo action
            switch(eventData.action) {
                case 'ADD_ENTRY':
                    setEntries(prev => [eventData, ...prev]);
                    break;
                case 'UPDATE_ENTRY':
                    setEntries(prev => prev.map(e => e.id === eventData.id ? eventData : e));
                    break;
                case 'REMOVE_ENTRY':
                    setEntries(prev => prev.filter(e => e.id !== eventData.id));
                    break;
            }
        });
    };
    
    client.activate();
}, [newsId]);

// 2. Gửi entry mới
const sendEntry = (payload) => {
    client.publish({
        destination: `/app/live/${newsId}/addEntry`,
        body: JSON.stringify(payload),
    });
};

// 3. Gửi update
const onSaveEdit = (updatedEntry) => {
    client.publish({
        destination: `/app/live/${newsId}/updateEntry`,
        body: JSON.stringify(payload),
    });
};

// 4. Gửi delete
const onDelete = (entry) => {
    client.publish({
        destination: `/app/live/${newsId}/deleteEntry`,
        body: JSON.stringify({ id: entry.id }),
    });
};
```

**Lưu ý:**
- Sử dụng `@stomp/stompjs` library
- SockJS là fallback transport
- Auto-reconnect khi mất kết nối

---

#### **`LiveNews.js`** - Trang hiển thị cho người dùng

**Chức năng:**

```javascript
// 1. Load initial data (entries đã có)
useEffect(() => {
    const loadInitialData = async () => {
        const res = await fetch(`/api/live-content/news/${newsId}?page=0&size=50`);
        const page = await res.json();
        // Phân loại: PINNED vs PUBLISHED
        const pinned = page.content.find(e => e.entryStatus === 'PINNED');
        const regular = page.content.filter(e => e.entryStatus !== 'PINNED').reverse();
        setPinnedEntry(pinned);
        setEntries(regular);
    };
    loadInitialData();
}, [newsId]);

// 2. Kết nối WebSocket (tương tự LiveNewsDashboard)
// 3. Hiển thị entries real-time
```

**Khác biệt với Dashboard:**
- Chỉ hiển thị (read-only)
- Không có form để thêm/sửa/xóa
- Hiển thị pinned entry ở đầu trang

---

#### **`EntryForm.js`** - Form tạo entry mới

**Chức năng:**

```javascript
const handleSubmit = async () => {
    // 1. Upload media (nếu có)
    let finalUrl = null;
    if (imageFile) {
        finalUrl = await newsAPI.uploadMedia(imageFile);
    }
    
    // 2. Tạo payload
    const payload = {
        action: 'ADD_ENTRY',
        content: editorRef.current.getContent(),  // HTML từ TinyMCE
        contentType: 'TEXT',
        entryStatus: pin ? 'PINNED' : 'PUBLISHED',
        mediaUrl: finalUrl,
        sortOrder: sortOrder ? Number(sortOrder) : null,
    };
    
    // 3. Gửi qua WebSocket (gọi callback từ parent)
    onSubmit(payload);
};
```

**Tính năng:**
- TinyMCE rich text editor
- Upload ảnh/video
- Pin entry (PINNED status)
- Sort order

---

#### **`EditEntryModal.js`** - Modal chỉnh sửa entry

**Chức năng tương tự EntryForm:**
- Load nội dung hiện tại
- Chỉnh sửa content
- Upload media mới (tự động xóa media cũ)
- Gửi update qua WebSocket

---

## 📊 **DATA MODEL**

### **Entity: `LiveContent`**

```java
@Entity
@Table(name = "live_content")
public class LiveContent {
    private Long id;
    private News news;           // Tin tức chứa entry này
    private User user;           // Admin tạo entry
    private String content;      // HTML content
    private EntryStatus entryStatus;  // PUBLISHED, PINNED, CORRECTION
    private ContentType contentType;  // TEXT, IMAGE, VIDEO_EMBED
    private String mediaUrl;     // URL ảnh/video trên Cloudinary
    private Integer sortOrder;   // Thứ tự sắp xếp
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### **DTO: `LiveNewsEvent`**

```java
public class LiveNewsEvent {
    private String action;           // ADD_ENTRY, UPDATE_ENTRY, REMOVE_ENTRY
    private Long id;
    private Long newsId;
    private Long userId;
    private String content;
    private String entryStatus;
    private String contentType;
    private String mediaUrl;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 🔐 **BẢO MẬT**

1. **Authentication:**
   - WebSocket endpoints yêu cầu authentication
   - Chỉ admin mới có thể thêm/sửa/xóa entries

2. **Authorization:**
   - Kiểm tra `newsId` khi xóa (chống xóa entry của tin khác)

3. **XSS Prevention:**
   - Sanitize HTML với `Jsoup.clean()`
   - Chỉ cho phép safe HTML tags

4. **Media Security:**
   - Validate file type trước khi upload
   - Upload lên Cloudinary (CDN an toàn)

---

## 🎨 **UI/UX FEATURES**

1. **Real-time Updates:**
   - Entries xuất hiện tự động, không cần refresh

2. **Pinned Entry:**
   - Entry quan trọng được ghim ở đầu trang

3. **Media Support:**
   - Hỗ trợ ảnh và video
   - Auto-detect loại media để hiển thị đúng

4. **Scroll to Top:**
   - Button scroll lên đầu trang khi scroll xuống

5. **Timestamps:**
   - Hiển thị thời gian tạo entry

---

## 🐛 **XỬ LÝ LỖI**

1. **WebSocket Disconnect:**
   - Auto-reconnect với delay 5 giây
   - Hiển thị trạng thái kết nối

2. **Upload Failure:**
   - Hiển thị error message
   - Không gửi entry nếu upload thất bại

3. **Database Error:**
   - Try-catch trong service layer
   - Log error và throw exception

---

## 📝 **TÓM TẮT LUỒNG DỮ LIỆU**

```
Admin thêm entry:
  Frontend → WebSocket → Controller → Service → Database
                                      ↓
                                   Redis Pub/Sub
                                      ↓
  All Clients ← WebSocket ← RedisSubscriber ← Redis
```

**Ưu điểm của kiến trúc này:**
- ✅ Scalable: Có thể scale backend instances
- ✅ Real-time: Cập nhật ngay lập tức
- ✅ Reliable: Redis đảm bảo message delivery
- ✅ Flexible: Dễ thêm features mới

---

## 🔍 **CÁC ĐIỂM QUAN TRỌNG CẦN NHỚ**

1. **Redis Pub/Sub là trung tâm:**
   - Tất cả events đều đi qua Redis
   - Cho phép scale nhiều backend instances

2. **WebSocket topics:**
   - `/topic/live/{newsId}` - Clients subscribe
   - `/app/live/{newsId}/addEntry` - Clients publish

3. **Entry Status:**
   - `PUBLISHED` - Entry bình thường
   - `PINNED` - Entry được ghim (hiển thị ở đầu)
   - `CORRECTION` - Entry sửa lỗi (chưa implement đầy đủ)

4. **Media Management:**
   - Tự động xóa media cũ khi update
   - Extract publicId từ Cloudinary URL để xóa

---

**Hy vọng giải thích này giúp bạn hiểu rõ hệ thống Live News! 🚀**



