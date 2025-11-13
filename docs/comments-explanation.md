# 💬 GIẢI THÍCH CHI TIẾT HỆ THỐNG COMMENT PHÂN CẤP (HIERARCHICAL)

## 🎯 **TỔNG QUAN**

Hệ thống bình luận hỗ trợ cấu trúc cây (nhiều cấp) cho từng bài viết (news) với chiến lược lưu trữ "path-based tree" để truy vấn hiệu quả, không cần đệ quy DB.

**Chức năng chính:**a
- ✅ Tạo comment gốc và reply nhiều cấp
- ✅ Tải toàn bộ cây comment cho một news (kèm trạng thái đã like)
- ✅ Like / Unlike comment
- ✅ Soft delete (xóa mềm) và khôi phục comment
- ✅ Xóa cứng (cùng descendants) cho nghiệp vụ admin
- ✅ Admin search/paging

---

## 🏗 **KIẾN TRÚC & DỮ LIỆU**

### 1) Chiến lược Path-based Tree

```
Comment (id=12)         → path = "12"       (root)
Reply (id=35) to 12     → path = "12.35"
Reply (id=48) to 35     → path = "12.35.48"
```

- Lấy descendants của node có path P: `path LIKE 'P.%'` → truy vấn nhanh bằng prefix, không đệ quy DB.
- `depth` cho biết độ sâu (root=0), hỗ trợ UI/logic.

### 2) Các entity chính

- Comment:
  - news, user, parent
  - content, depth, path
  - delete (boolean), deletedAt, deletedBy
  - likeCount (số lượt like)
- CommentLike:
  - user, comment (quan hệ many-to-one)
  - dùng để kiểm tra đã like và cập nhật likeCount

---

## 🔄 **LUỒNG HOẠT ĐỘNG CHI TIẾT**

### 2.1. Tải toàn bộ comment của một bài viết (viewer)

```
Client → GET /api/comments?newsId={id}
    ↓
Service:
  1) Lấy root comments (parent IS NULL) theo thời gian
  2) Với mỗi root: lấy replies bằng path prefix: path LIKE root.path + '.%'
  3) Map Comment → CommentWithRepliesDto
  4) Nếu có user hiện tại → set cờ 'liked' cho từng node
    ↓
Response: Danh sách root DTO, mỗi root có mảng replies
```

### 2.2. Lấy replies của một comment cụ thể

```
Client → GET /api/comments/{parentId}/replies
    ↓
Service: Tìm parent → lấy all by path LIKE parent.path + '.%'
    ↓
Response: Mảng replies (DTO)
```

### 2.3. Tạo comment / reply

```
Client → POST /api/comments { content, newsId, parentId? }
    ↓
Service:
  - Tìm News, User
  - Nếu parentId != null: set parent, depth = parent.depth + 1
    else: depth = 0
  - Lưu lần 1 để lấy id
  - Set path: root = "{id}"; reply = parent.path + "." + id
  - Lưu lần 2 cập nhật path
    ↓
Response: CommentWithRepliesDto
```

### 2.4. Like / Unlike

```
Client → POST /api/comments/{id}/like
    ↓
Service: nếu chưa like → tạo CommentLike, likeCount++ → save

Client → DELETE /api/comments/{id}/like
    ↓
Service: nếu đã like → xóa CommentLike, likeCount-- → save
```

### 2.5. Soft delete / Khôi phục / Xóa cứng

```
Soft delete (user chủ comment)
Client → DELETE /api/comments/{id}
    ↓
Service: set delete=true, set deletedAt, deletedBy; xóa all likes; likeCount=0

Khôi phục (admin)
Service: set delete=false; clear deletedAt/deletedBy

Xóa cứng (admin)
Service: lấy descendants by path prefix → xóa tất cả + xóa like liên quan
```

---

## 📦 **CODE TRÍCH YẾU (BACKEND)**

> Lưu ý: các ví dụ dưới rút gọn từ mã nguồn hiện có trong service/controller.

### 3.1. Controller (CommentController)

```java
// GET toàn bộ comments theo news (kèm liked theo user hiện tại)
@GetMapping
public List<CommentWithRepliesDto> getAllComments(@RequestParam Long newsId, Authentication auth){
    Long userId = auth != null ? ((UserPrincipal)auth.getPrincipal()).getId() : null;
    return commentService.getAllCommentsForNews(newsId, userId);
}

// GET replies theo parentId
@GetMapping("/{parentId}/replies")
public List<CommentWithRepliesDto> getReplies(@PathVariable Long parentId){
    return commentService.getReplies(parentId).stream()
        .map(reply -> CommentWithRepliesDto.from(reply, List.of()))
        .toList();
}

// POST tạo comment/reply
@PostMapping
public CommentWithRepliesDto createComment(@RequestBody CreateCommentRequest request, Authentication auth){
    Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
    Comment comment = commentService.createComment(
        request.getContent(), userId, request.getNewsId(), request.getParentId());
    return CommentWithRepliesDto.from(comment, List.of());
}

// DELETE soft delete comment của chính chủ
@DeleteMapping("/{id}")
public void deleteComment(@PathVariable Long id, Authentication auth){
    Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
    commentService.softDeleteComment(id, userId);
}

// POST/DELETE like/unlike
@PostMapping("/{commentId}/like")
public CommentWithRepliesDto likeComment(@PathVariable Long commentId, Authentication auth){
    Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
    Comment c = commentService.likeComment(commentId, userId);
    return CommentWithRepliesDto.from(c, List.of());
}

@DeleteMapping("/{commentId}/like")
public CommentWithRepliesDto unlikeComment(@PathVariable Long commentId, Authentication auth){
    Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
    Comment c = commentService.unlikeComment(commentId, userId);
    return CommentWithRepliesDto.from(c, List.of());
}
```

### 3.2. Service (CommentService)

```java
// Lấy toàn bộ cây comment cho news
@Transactional
public List<CommentWithRepliesDto> getAllCommentsForNews(Long newsId, Long userId) {
    List<Comment> rootComments = commentRepository
        .findByNewsAndParentIsNullOrderByCreatedAtDesc(
            newsRepository.findById(newsId).orElseThrow()
        );

    return rootComments.stream().map(root -> {
        String pathPrefix = root.getPath() + ".%";
        List<Comment> replies = commentRepository.findByPathStartingWith(pathPrefix);

        // Map replies + set 'liked' theo user hiện tại
        List<CommentWithRepliesDto> replyDtos = replies.stream().map(reply -> {
            CommentWithRepliesDto dto = CommentWithRepliesDto.from(reply, List.of());
            if (userId != null) {
                User u = userRepository.findById(userId).orElse(null);
                dto.setLiked(u != null && commentLikesRepository.existsByUserAndComment(u, reply));
            } else {
                dto.setLiked(false);
            }
            return dto;
        }).toList();

        CommentWithRepliesDto rootDto = CommentWithRepliesDto.from(root, replyDtos);
        if (userId != null) {
            User u = userRepository.findById(userId).orElse(null);
            rootDto.setLiked(u != null && commentLikesRepository.existsByUserAndComment(u, root));
        } else rootDto.setLiked(false);
        return rootDto;
    }).toList();
}

// Tạo comment/reply: 2 bước để thiết lập path
@Transactional
public Comment createComment(String content, Long userId, Long newsId, Long parentId) {
    News news = newsRepository.findById(newsId).orElseThrow();
    User user = userRepository.findById(userId).orElseThrow();

    Comment c = new Comment();
    c.setContent(content);
    c.setNews(news);
    c.setUser(user);

    if (parentId != null) {
        Comment parent = commentRepository.findById(parentId).orElse(null);
        c.setParent(parent);
        Integer parentDepth = parent.getDepth();
        c.setDepth(parentDepth == null ? 1 : parentDepth + 1);
    } else {
        c.setDepth(0);
    }

    c = commentRepository.save(c); // có id

    // set path theo parent
    if (c.getParent() == null) c.setPath(String.valueOf(c.getId()));
    else c.setPath(c.getParent().getPath() + "." + c.getId());

    return commentRepository.save(c);
}

// Soft delete (của chính chủ)
@Transactional
public void softDeleteComment(Long commentId, Long userId) {
    Comment c = commentRepository.findById(commentId).orElseThrow();
    if (c.getUser() == null || !c.getUser().getId().equals(userId)) {
        throw new SecurityException("Not allowed to delete this comment");
    }
    c.setDelete(true);
    c.setDeletedAt(Instant.now());
    c.setDeletedBy(userRepository.findById(userId).orElseThrow());
    commentLikesRepository.deleteByCommentId(commentId);
    c.setLikeCount(0);
    commentRepository.save(c);
}

// Xóa cứng cả cây (admin)
@Transactional
public void deleteComment(Long commentId) {
    Comment c = commentRepository.findById(commentId).orElseThrow();
    String prefix = c.getPath() + ".%";
    List<Comment> descendants = commentRepository.findByPathStartingWith(prefix);
    commentLikesRepository.deleteByCommentId(commentId);
    commentRepository.deleteAll(descendants);
    commentRepository.delete(c);
}

// Like / Unlike
@Transactional
public Comment likeComment(Long commentId, Long userId) {
    Comment c = commentRepository.findById(commentId).orElseThrow();
    User u = userRepository.findById(userId).orElseThrow();
    if (!commentLikesRepository.existsByUserAndComment(u, c)) {
        CommentLike cl = new CommentLike();
        cl.setUser(u); cl.setComment(c); cl.setCreatedAt(Instant.now());
        commentLikesRepository.save(cl);
        c.setLikeCount(c.getLikeCount() + 1);
        return commentRepository.save(c);
    }
    return c;
}

@Transactional
public Comment unlikeComment(Long commentId, Long userId) {
    Comment c = commentRepository.findById(commentId).orElseThrow();
    User u = userRepository.findById(userId).orElseThrow();
    if (commentLikesRepository.existsByUserAndComment(u, c)) {
        commentLikesRepository.deleteByUserAndComment(u, c);
        c.setLikeCount(c.getLikeCount() - 1);
        return commentRepository.save(c);
    }
    return c;
}
```

---

## 🖥 **FRONTEND (REACT) – LUỒNG, STATE, TÍCH HỢP API**

### 4.1. Thành phần & Trách nhiệm
- `CommentSection.js` (chính):
  - Nạp toàn bộ comments cho `newsId` khi mount.
  - Lưu `comments` (mảng root DTO, mỗi root có `replies`).
  - Quản lý `likedComments` (Set các comment id user đã like).
  - Submit comment mới, reply, delete, like/unlike, rồi reload hoặc cập nhật cục bộ.
- `services/api.js`:
  - `getComments(newsId)`, `addComment(newsId, content, parentId)`, `deleteComment(id)`, `likeComment(id)`, `unlikeComment(id)`.
  - Axios interceptor tự gắn JWT và tự refresh khi 401.

### 4.2. Mô hình state
```js
const [comments, setComments] = useState([]);     // Mảng root DTO (mỗi root có replies)
const [likedComments, setLikedComments] = useState(new Set());
const [newComment, setNewComment] = useState('');
const [replyingTo, setReplyingTo] = useState(null);  // commentId đang reply
const [replyContent, setReplyContent] = useState('');
```

### 4.3. Nạp dữ liệu & dựng liked set
```js
useEffect(() => { loadComments(); }, [newsId]);

async function loadComments(){
  const res = await newsAPI.getComments(newsId);
  const commentsData = res.data || [];
  setComments(commentsData);

  // Duyệt cây để gom các id đã liked vào Set
  const likedSet = new Set();
  (function collectLiked(nodes){
    nodes.forEach(n => {
      if (n.liked) likedSet.add(n.id);
      if (n.replies?.length) collectLiked(n.replies);
    })
  })(commentsData);
  setLikedComments(likedSet);
}
```

### 4.4. Tạo comment gốc
```js
async function handleSubmitComment(e){
  e.preventDefault();
  if (!user) return (window.location.href = '/login');
  await newsAPI.addComment(newsId, newComment); // parentId = undefined
  setNewComment('');
  await loadComments();
}
```

### 4.5. Tạo reply (nhiều cấp)
```js
async function handleSubmitReply(parentId){
  await newsAPI.addComment(newsId, replyContent, parentId);
  setReplyContent('');
  setReplyingTo(null);
  await loadComments();
}
```

### 4.6. Xóa (soft delete)
```js
async function handleDeleteComment(commentId){
  await newsAPI.deleteComment(commentId);
  await loadComments();
}
```

### 4.7. Like / Unlike (có thể tối ưu optimistic update)
```js
async function handleLikeComment(commentId){
  if (!user) return (window.location.href = '/login');
  const isLiked = likedComments.has(commentId);
  if (isLiked){
    await newsAPI.unlikeComment(commentId);
    setLikedComments(prev => { const ns = new Set(prev); ns.delete(commentId); return ns; });
  } else {
    await newsAPI.likeComment(commentId);
    setLikedComments(prev => { const ns = new Set(prev); ns.add(commentId); return ns; });
  }
  // Tùy chiến lược: có thể cập nhật likeCount cục bộ thay vì reload toàn bộ
}
```

### 4.8. Render cây
- Dữ liệu từ backend đã trả về root + replies → có thể render theo dạng lặp trong React.
- Với cây nặng nề: cân nhắc lazy-load replies (gọi `GET /api/comments/{parentId}/replies`) khi expand.

### 4.9. UX/Validation
- Không cho gửi comment trống (trim).
- Khi chưa đăng nhập: chuyển hướng `/login`.
- Hiển thị placeholder "Bình luận đã bị xóa" nếu `delete=true` (tuỳ UI), nhưng vẫn giữ chỗ trong cây.

### 4.10. Performance tips
- Tránh reload toàn bộ sau mỗi hành động: cập nhật cục bộ mảng `comments` nếu dễ xử lý.
- Nếu dữ liệu lớn:
  - Phân trang root comments (server-side)
  - Collapse/expand replies, lazy-load theo parentId
- Memo hóa component list items để tránh re-render nhiều.

---

## 🔐 **BẢO MẬT & PHÂN QUYỀN**

- Các thao tác cần đăng nhập (tạo, like/unlike, soft delete của chính chủ) lấy `userId` từ `Authentication` (`UserPrincipal`).
- Admin endpoints (search, xóa cứng, khôi phục, soft delete bởi admin) nằm dưới `/api/admin/comment/**` và bị hạn chế bởi `hasRole('ADMIN')` (qua `SecurityConfig` hoặc `@PreAuthorize`).

---

## ⚙️ **TỐI ƯU HIỆU NĂNG & INDEX**

- Tạo index trên các cột:
  - `news_id` (lọc theo bài viết)
  - `path` (truy vấn prefix `LIKE 'prefix.%'`)
  - `created_at` (sắp xếp thời gian)
- Phân trang khi lấy root comments và/hoặc replies nếu khối lượng lớn.
- `LIKE 'prefix.%'` tận dụng index tốt vì có tiền tố cố định (không bắt đầu wildcard).

---

## ⚠️ **EDGE-CASES & LƯU Ý**

- Soft delete: UI nên hiển thị placeholder ("Bình luận đã bị xóa") thay vì xóa khỏi cây để không đứt mạch hội thoại.
- `path` là bất biến sau khi tạo; nếu cần di chuyển node giữa các nhánh → không phù hợp path-based, cân nhắc nested set/closure table hoặc rebuild path.
- Khi xóa một bài viết, dọn `Comment`/`CommentLike` theo `newsId` để tránh orphan data.
- Có thể giới hạn độ sâu `depth` ở UI hoặc service nếu cần.

---

## 📚 **ENDPOINTS TÓM TẮT**

- Viewer:
  - `GET    /api/comments?newsId={id}` → Cây comment của news (root + replies)
  - `GET    /api/comments/{parentId}/replies` → Replies của 1 comment
- User:
  - `POST   /api/comments` (content, newsId, parentId?)
  - `DELETE /api/comments/{id}` (soft delete của chính chủ)
  - `POST   /api/comments/{commentId}/like`
  - `DELETE /api/comments/{commentId}/like`
- Admin (ví dụ):
  - `GET    /api/admin/comment?page=&size=`
  - `DELETE /api/admin/comment/{id}` (xóa cứng)
  - `PUT    /api/admin/comment/{id}/restore` (khôi phục)
  - `DELETE /api/admin/comment/{id}/soft-delete` (xóa mềm bởi admin)

---

## 📝 **TÓM TẮT**

- Sử dụng path-based tree để lưu comment nhiều cấp, cho phép truy vấn descendants nhanh bằng prefix.
- Luồng nghiệp vụ đầy đủ: load cây, lấy replies, create, like/unlike, soft delete/restore, xóa cứng.
- Frontend quản lý state (comments, liked set), gọi API nhất quán, có thể tối ưu bằng optimistic update và lazy-load replies.
- Bảo mật theo role: user (hành động cá nhân), admin (quản trị, tìm kiếm, dọn dẹp).
- Tối ưu bằng index phù hợp và phân trang.

**Hệ thống comment phân cấp này hiệu quả, dễ mở rộng và thân thiện với UI. 🚀**
