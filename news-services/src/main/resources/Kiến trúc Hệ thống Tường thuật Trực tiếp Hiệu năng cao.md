**Kiến trúc Hệ thống Tường thuật Trực tiếp Hiệu năng cao: Một Thiết kế
Kỹ thuật với Spring Boot, React và WebSocket**

1.  **Phần 1: Phân tích Quy trình Nghiệp vụ và Chức năng của Live Blog**

Để xây dựng một hệ thống kỹ thuật vững chắc, trước tiên cần phải phân
tích và định hình rõ ràng các yêu cầu về mặt chức năng và nghiệp vụ.
Việc chuyển đổi khái niệm \"tường thuật trực tiếp\" (live blog) thành
một tập hợp các yêu cầu cụ thể sẽ là kim chỉ nam cho toàn bộ quá trình
thiết kế kiến trúc và lập trình. Phân tích này sẽ đi sâu vào cả hai góc
độ: quy trình làm việc của tòa soạn và trải nghiệm của độc giả.

**1.1. Cấu trúc của một Bài tường thuật Trực tiếp**

Một bài tường thuật trực tiếp không phải là một thực thể đơn lẻ mà là
một tập hợp các thành phần dữ liệu có cấu trúc. Về cơ bản, một LiveBlog
đóng vai trò như một container chính cho một sự kiện (ví dụ: \"Tường
thuật Đêm bầu cử 2024\"). Mỗi cập nhật bên trong container này là một
LiveBlogEntry.

**Các thuộc tính chính của một LiveBlogEntry**: Mỗi bản tin cập nhật cần
có các trường dữ liệu thiết yếu: một định danh duy nhất (ID), dấu thời
gian (timestamp) ghi nhận thời điểm đăng, thông tin tác giả, và nội dung
chính. Đặc biệt, trường nội dung phải có cấu trúc linh hoạt để hỗ trợ
nhiều định dạng khác nhau. Các tòa soạn hiện đại không chỉ đăng tải văn
bản thuần túy mà còn làm phong phú nội dung bằng văn bản có định dạng
(HTML), hình ảnh, video nhúng (từ YouTube, Vimeo), các bài đăng từ mạng
xã hội (Twitter, Instagram), và các yếu tố tương tác như thăm dò ý kiến
(poll). Việc tích hợp đa phương tiện này là yếu tố then chốt để thu hút
và giữ chân độc giả.  

**Các loại bản tin đặc biệt**: Để cải thiện trải nghiệm người dùng, đặc
biệt là với những độc giả tham gia muộn, hệ thống cần hỗ trợ các loại
bản tin đặc biệt. Ví dụ, một bản tin có thể được đánh dấu là \"sự kiện
chính\" (key event) hoặc \"ghim\" (pinned) để luôn hiển thị ở đầu trang.
Chức năng này cung cấp một bản tóm tắt nhanh chóng các diễn biến quan
trọng nhất, giúp độc giả mới dễ dàng nắm bắt bối cảnh của sự kiện.  

**1.2. Quy trình làm việc của Tòa soạn và các Trạng thái Hệ thống**

Quy trình làm việc của nhà báo trong một sự kiện trực tiếp cần được ánh
xạ vào một mô hình vòng đời (state machine) của thực thể LiveBlog. Các
trạng thái này là công cụ quản lý cốt lõi cho toàn bộ quá trình đưa tin.
 

-   SCHEDULED (Đã lên lịch): Bài tường thuật đã được chuẩn bị trước
    nhưng chưa hiển thị công khai. Điều này phù hợp với quy trình nghiệp
    vụ chuẩn, nơi các nhà báo chuẩn bị sẵn tài nguyên, dàn ý và các
    thông tin nền trước khi sự kiện bắt đầu.  

-   LIVE (Đang trực tiếp): Bài tường thuật đang hoạt động. Các nhà báo
    liên tục đẩy các cập nhật mới theo thời gian thực.

-   PAUSED (Tạm dừng): Việc đưa tin tạm thời bị gián đoạn (ví dụ, qua
    đêm). Hệ thống nên hiển thị một thông báo cho biết khi nào chương
    trình sẽ tiếp tục.

-   CONCLUDED (Đã kết thúc): Sự kiện đã kết thúc. Tại thời điểm này, bài
    tường thuật chuyển thành một kho lưu trữ tĩnh, trình bày các diễn
    biến theo thứ tự thời gian đảo ngược, trở thành một tài liệu tham
    khảo về sự kiện đã qua.  

**Vai trò người dùng và Phân quyền**: Hệ thống quản trị nội dung (CMS)
cần định nghĩa các vai trò rõ ràng để đảm bảo quy trình làm việc trơn
tru:

-   **Biên tập viên (Editor)**: Có quyền tạo, lên lịch, và thay đổi
    trạng thái của một LiveBlog.

-   **Phóng viên (Journalist)**: Có quyền đăng và chỉnh sửa các
    LiveBlogEntry của chính mình vào một bài tường thuật đang ở trạng
    thái LIVE.

-   **Người kiểm duyệt (Moderator)**: Quản lý các bình luận của người
    dùng và các yếu tố tương tác. Vai trò này rất quan trọng để xây dựng
    cộng đồng độc giả trong khi vẫn kiểm soát được các rủi ro về nội
    dung.  

**1.3. Trải nghiệm của Độc giả: Tiếp nhận và Tương tác**

Trải nghiệm của người dùng cuối là mục tiêu chính của tính năng này. Hệ
thống phải đảm bảo việc tiếp nhận thông tin liền mạch và khuyến khích sự
tương tác.

-   **Luồng tin Thời gian thực**: Trải nghiệm cốt lõi của độc giả là một
    luồng tin tự động cập nhật. Các bản tin mới nhất sẽ xuất hiện ở đầu
    trang (thứ tự thời gian đảo ngược) mà không cần người dùng phải tải
    lại trang.  

-   **Tương tác và Gắn kết**: Các trang tường thuật trực tiếp hiện đại
    không còn là kênh truyền thông một chiều. Chúng đã trở thành nền
    tảng để độc giả tham gia thông qua các phần bình luận, hỏi-đáp
    (Q&A), và các cuộc thăm dò ý kiến. Sự tương tác này giúp tăng thời
    gian người dùng ở lại trang (dwell time) và xây dựng lòng trung
    thành của độc giả.  

-   **Minh bạch và Tin cậy**: Một khía cạnh độc đáo của live blog là
    tính minh bạch. Trong dòng chảy tin tức nhanh, các nhà báo có thể
    đăng tải những thông tin chưa được kiểm chứng nhưng sẽ ghi chú rõ
    ràng về điều đó, và thực hiện các đính chính ngay trong luồng tin.
    Quy trình này, mặc dù có rủi ro, lại xây dựng niềm tin với độc giả
    bằng cách mở ra quy trình làm báo. Hệ thống của chúng ta phải hỗ trợ
    được sự tinh tế này, ví dụ bằng cách cho phép các bản tin được gắn
    thẻ trạng thái kiểm chứng.  

Từ việc phân tích các yêu cầu nghiệp vụ, một điểm cốt lõi trong kiến
trúc hệ thống đã lộ rõ: tính hai mặt của một bài tường thuật trực tiếp.
Trong khi sự kiện diễn ra, nó là một luồng dữ liệu động, thời gian thực.
Sau khi kết thúc, nó trở thành một bản ghi lịch sử tĩnh, có thể truy vấn
được. \"Sự sống\" của một bài tường thuật được định nghĩa bởi dòng cập
nhật liên tục , điều này rõ ràng hướng tới một công nghệ đẩy
(push-based) thời gian thực như WebSocket. Tuy nhiên, khi sự kiện kết
thúc, nó lại đóng vai trò như một kho lưu trữ , cần được các công cụ tìm
kiếm lập chỉ mục để có giá trị SEO lâu dài.  

Sự hai mặt này ngụ ý rằng kiến trúc không thể chỉ tập trung vào việc
truyền tin thời gian thực. Nó phải bao gồm một lớp lưu trữ bền vững
(MySQL) và một API REST tiêu chuẩn để truy xuất toàn bộ lịch sử của một
bài tường thuật. Do đó, hệ thống phải được thiết kế với hai mẫu truy cập
dữ liệu chính: một mẫu \"trực tiếp\" được phục vụ bởi WebSocket và một
mẫu \"lịch sử\" được phục vụ bởi một API REST có phân trang. Cách tiếp
cận này giúp tránh sai lầm kiến trúc là cố gắng tải toàn bộ lịch sử bài
viết thông qua kết nối WebSocket, một việc làm không hiệu quả và không
có khả năng mở rộng.

2.  **Phần 2: Thiết kế Kiến trúc Tổng thể cho Hệ thống Thời gian thực**

Phần này trình bày thiết kế kỹ thuật ở mức cao, đưa ra các quyết định
kiến trúc quan trọng và cung cấp một lộ trình rõ ràng cho việc triển
khai chi tiết sẽ được trình bày ở các phần sau.

**2.1. Sơ đồ Kiến trúc Hệ thống Cấp cao**

Sơ đồ dưới đây minh họa các thành phần chính và luồng dữ liệu trong hệ
thống:

1.  **ReactJS Frontend**: Ứng dụng client chạy trên trình duyệt của
    người dùng, chịu trách nhiệm hiển thị giao diện và quản lý kết nối
    thời gian thực.

2.  **Nginx Reverse Proxy**: Điểm vào duy nhất cho mọi lưu lượng truy
    cập. Nginx sẽ xử lý việc chấm dứt SSL (SSL termination) và định
    tuyến cho cả các yêu cầu HTTP thông thường và các kết nối WebSocket.

3.  **Cụm máy chủ Spring Boot Backend**: Một nhóm các máy chủ ứng dụng
    có khả năng mở rộng theo chiều ngang (horizontally scalable) và được
    thiết kế để không lưu trạng thái (stateless).

4.  **Cơ sở dữ liệu MySQL**: Hệ thống lưu trữ bền vững cho toàn bộ dữ
    liệu của các bài tường thuật trực tiếp.

5.  **Redis Pub/Sub**: Một message broker bên ngoài, đóng vai trò trung
    gian để các máy chủ backend có thể giao tiếp với nhau, đảm bảo khả
    năng mở rộng.

Sơ đồ sẽ mô tả hai luồng dữ liệu chính:

-   **Luồng RESTful**: Dành cho các hoạt động quản trị (tạo/chỉnh sửa
    bài tường thuật) và truy xuất dữ liệu lịch sử.

-   **Luồng WebSocket**: Dành cho việc phát sóng (broadcast) các bản tin
    cập nhật trực tiếp đến hàng loạt độc giả.

**2.2. Lựa chọn Giao thức Thời gian thực Phù hợp: WebSocket, SSE, và
Long Polling**

Việc lựa chọn giao thức truyền thông thời gian thực là một quyết định
kiến trúc nền tảng. Một phân tích so sánh chi tiết sẽ chứng minh tại sao
WebSocket là lựa chọn tối ưu cho ứng dụng này.

-   **Long Polling**: Đây là một kỹ thuật cũ, trong đó client gửi một
    yêu cầu HTTP và server giữ kết nối đó mở cho đến khi có dữ liệu mới
    để trả về. Mặc dù đơn giản và tương thích rộng rãi, Long Polling rất
    không hiệu quả do chi phí (overhead) của việc thiết lập lại kết nối
    và gửi lại toàn bộ header HTTP cho mỗi thông điệp.  

-   **Server-Sent Events (SSE)**: Là một giải pháp hiện đại và đơn giản
    hơn cho việc giao tiếp *một chiều* (từ server đến client) qua một
    kết nối HTTP tiêu chuẩn. SSE có những ưu điểm như cơ chế tự động kết
    nối lại khi mất mạng. Tuy nhiên, bản chất một chiều của nó lại là
    một hạn chế lớn. Các tính năng tương tác như thăm dò ý kiến,
    hỏi-đáp, hoặc cộng tác soạn thảo giữa nhiều nhà báo đòi hỏi client
    phải gửi dữ liệu lên server. Với SSE, việc này phải thực hiện qua
    một kênh HTTP riêng biệt, làm tăng độ phức tạp và độ trễ.  

-   **WebSockets**: Đây là lựa chọn tối ưu nhất. WebSocket cung cấp một
    kênh giao tiếp *hai chiều* (bidirectional), song công toàn phần
    (full-duplex) trên một kết nối TCP duy nhất và bền vững. Điều này
    mang lại độ trễ thấp nhất và chi phí overhead tối thiểu cho các
    thông điệp tần suất cao. Mặc dù việc thiết lập có phần phức tạp hơn
    , sự linh hoạt của WebSocket là một lợi thế chiến lược, giúp nền
    tảng sẵn sàng cho các tính năng tương tác trong tương lai mà không
    cần thay đổi kiến trúc.  

  ----------------------------------------------------------------------------
  Tính năng       Long Polling       Server-Sent Events    WebSockets
                                     (SSE)                 
  --------------- ------------------ --------------------- -------------------
  **Loại giao     Một chiều (Mô      Một chiều             Hai chiều
  tiếp**          phỏng)             (Server-tới-Client)   (Full-Duplex)

  **Giao thức**   HTTP/1.1 tiêu      HTTP/1.1 tiêu chuẩn   Nâng cấp từ HTTP
                  chuẩn                                    lên WS/WSS

  **Kiểu kết      Yêu cầu HTTP lặp   Một kết nối HTTP duy  Một kết nối TCP duy
  nối**           đi lặp lại         nhất, bền vững        nhất, bền vững

  **Độ trễ**      Cao                Thấp                  Rất thấp

  **Overhead**    Cao (Toàn bộ       Thấp (Chỉ thiết lập   Tối thiểu (Frame
                  header HTTP mỗi    kết nối HTTP một lần) header nhỏ)
                  tin)                                     

  **Kết nối lại** Tự triển khai      Tự động (Tích hợp     Tự triển khai
                                     sẵn)                  

  **Định dạng dữ  Bất kỳ (Text,      Chỉ văn bản UTF-8     Văn bản (UTF-8) và
  liệu**          JSON)                                    Nhị phân

  **Hỗ trợ trình  Toàn bộ            Các trình duyệt hiện  Các trình duyệt
  duyệt**                            đại (Không có IE)     hiện đại

  **Proxy/Tường   Hoạt động trơn tru Thường hoạt động tốt  Có thể gặp vấn đề
  lửa**                                                    
  ----------------------------------------------------------------------------

 

Việc lựa chọn giao thức thời gian thực không chỉ là một chi tiết kỹ
thuật mà còn là một quyết định chiến lược định hình khả năng phát triển
của sản phẩm trong tương lai. Yêu cầu trước mắt là đẩy cập nhật đến độc
giả, và về bề ngoài, SSE có vẻ đủ dùng và đơn giản hơn. Tuy nhiên, phân
tích nghiệp vụ ở Phần 1 đã chỉ ra rằng các live blog hiện đại có tính
tương tác rất cao. Các tính năng như thăm dò ý kiến, hỏi-đáp, và nhắn
tin nội bộ giữa các nhà báo đang trở thành tiêu chuẩn. Việc triển khai
các tính năng này với SSE sẽ đòi hỏi một kênh giao tiếp riêng biệt (HTTP
POST) cho dữ liệu từ client lên server, làm tăng độ phức tạp và độ trễ.
Ngược lại, WebSocket, với khả năng giao tiếp hai chiều tự nhiên , cung
cấp một kênh thống nhất duy nhất cho tất cả các tương tác thời gian
thực. Bằng cách chọn WebSocket ngay từ đầu, chúng ta đang xây dựng một
kiến trúc không chỉ để *đưa tin* mà còn để *tương tác*. Đây là một sự
đầu tư vào một nền tảng phức tạp hơn nhưng linh hoạt hơn rất nhiều, có
thể hỗ trợ một lộ trình các tính năng tương tác mà không cần phải tái
cấu trúc hệ thống trong tương lai.  

3.  **Phần 3: Triển khai Backend với Spring Boot và WebSocket**

Phần này đi sâu vào các chi tiết triển khai phía máy chủ, bao gồm các ví
dụ mã nguồn và hướng dẫn cấu hình cụ thể.

**3.1. Thiết kế Lược đồ Cơ sở dữ liệu cho Độ bền và Hiệu năng**

Một thiết kế cơ sở dữ liệu tốt là nền tảng cho sự ổn định và hiệu năng
của toàn hệ thống. Lược đồ được thiết kế ưu tiên tính chuẩn hóa, toàn
vẹn dữ liệu và hiệu suất truy vấn.

**Các bảng chính**:

-   users: Bảng người dùng tiêu chuẩn cho phóng viên và biên tập viên.

-   live_blogs: Bảng chính chứa thông tin về các bài tường thuật, bao
    gồm các cột như id, title, slug, status (ENUM(\'SCHEDULED\',
    \'LIVE\', \'PAUSED\', \'CONCLUDED\')), created_at, updated_at.

-   live_blog_entries: Bảng quan trọng nhất, lưu trữ từng bản tin cập
    nhật riêng lẻ.

  ----------------------------------------------------------------------------
  Tên cột        Kiểu dữ liệu  Ràng buộc / Ghi chú
  -------------- ------------- -----------------------------------------------
  id             BIGINT        PRIMARY KEY, AUTO_INCREMENT

  live_blog_id   BIGINT        FOREIGN KEY tới live_blogs(id), NOT NULL

  user_id        INT           FOREIGN KEY tới users(id) (Tác giả), NULLABLE

  content        TEXT hoặc     Lưu nội dung bản tin. Kiểu JSON linh hoạt cho
                 JSON          nhiều cấu trúc nội dung.

  entry_type     VARCHAR(50)   Ví dụ: \'TEXT\', \'IMAGE\', \'VIDEO_EMBED\',
                               \'TWEET_EMBED\'.

  entry_status   VARCHAR(50)   Ví dụ: \'PUBLISHED\', \'PINNED\',
                               \'CORRECTION\'. Để đảm bảo tính minh bạch.

  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP. Quan trọng cho việc
                               sắp xếp.

  updated_at     TIMESTAMP     ON UPDATE CURRENT_TIMESTAMP. Để theo dõi các
                               chỉnh sửa.
  ----------------------------------------------------------------------------

Xuất sang Trang tính

**3.2. Cấu hình WebSocket và STOMP Message Broker**

Để tích hợp WebSocket vào Spring Boot, chúng ta cần một lớp cấu hình
chuyên dụng. STOMP (Simple Text Oriented Messaging Protocol) được sử
dụng như một giao thức con trên WebSocket để đơn giản hóa việc giao tiếp
dựa trên thông điệp.  

Lớp WebSocketConfig sẽ triển khai giao diện
WebSocketMessageBrokerConfigurer.

-   **registerStompEndpoints**: Phương thức này đăng ký một endpoint mà
    các client sẽ kết nối tới. Chúng ta sẽ cấu hình endpoint /ws và kích
    hoạt SockJS. SockJS là một thư viện JavaScript cung cấp một API
    tương tự WebSocket nhưng sẽ tự động chuyển sang các phương thức thay
    thế (như long polling) nếu trình duyệt không hỗ trợ WebSocket hoặc
    bị chặn bởi proxy, đảm bảo khả năng tương thích tối đa.  

-   **configureMessageBroker**:

    -   enableSimpleBroker(\"/topic\"): Kích hoạt một message broker đơn
        giản trong bộ nhớ. Các đích đến (destination) có tiền tố /topic
        sẽ được broker này xử lý, dùng để phát sóng thông điệp tới tất
        cả các client đã đăng ký. Ban đầu, broker trong bộ nhớ là đủ cho
        môi trường phát triển, nhưng nó sẽ được thay thế bằng Redis để
        có thể mở rộng trong môi trường production.  

    -   setApplicationDestinationPrefixes(\"/app\"): Định nghĩa tiền tố
        /app cho các thông điệp sẽ được định tuyến đến các phương thức
        xử lý trong controller (được đánh dấu bằng \@MessageMapping). Ví
        dụ, một thông điệp từ nhà báo gửi đến
        /app/liveblog/{blogId}/addEntry sẽ được xử lý bởi một phương
        thức tương ứng trong controller.  

**3.3. Phát triển Controller Xử lý Thông điệp Thời gian thực**

LiveBlogController sẽ chứa logic để nhận và phát sóng các thông điệp
STOMP.

-   **Nhận bản tin mới**: Một phương thức được đánh dấu với
    \@MessageMapping(\"/liveblog/{blogId}/addEntry\") sẽ xử lý các yêu
    cầu gửi bản tin mới từ các nhà báo đã được xác thực. Dữ liệu gửi lên
    sẽ là một đối tượng DTO (Data Transfer Object), ví dụ
    LiveBlogEntryDto.

-   **Phát sóng tới Clients**: Bên trong phương thức này, sau khi lưu
    bản tin mới vào cơ sở dữ liệu MySQL, chúng ta sẽ sử dụng
    SimpMessagingTemplate.convertAndSend() để phát sóng bản tin đó tới
    topic /topic/liveblog/{blogId}. Tất cả các độc giả đang đăng ký
    (subscribe) vào topic này sẽ nhận được thông điệp ngay lập tức.  

**3.4. Xây dựng API REST Hỗ trợ**

Bên cạnh kênh WebSocket, một bộ các endpoint REST tiêu chuẩn sử dụng
\@RestController là cần thiết để quản lý vòng đời của bài tường thuật.

-   POST /api/liveblogs: Tạo một bài tường thuật mới (yêu cầu vai trò
    Editor).

-   PUT /api/liveblogs/{blogId}/status: Thay đổi trạng thái của bài
    tường thuật (ví dụ, từ SCHEDULED sang LIVE) (yêu cầu vai trò
    Editor).

-   GET /api/liveblogs/{blogId}/entries: Một endpoint có phân trang để
    lấy các bản tin lịch sử. Đây là một endpoint cực kỳ quan trọng, cho
    phép các client mới tải nội dung đã có trước khi kết nối WebSocket
    để nhận các cập nhật trực tiếp.

Thiết kế backend cần phải tách biệt rõ ràng kênh giao tiếp thời gian
thực khỏi logic nghiệp vụ và lớp lưu trữ. Một cách tiếp cận đơn giản có
thể xử lý tất cả logic ngay trong controller WebSocket. Tuy nhiên, điều
này sẽ tạo ra sự耦合 chặt chẽ giữa giao thức nhắn tin (STOMP/WebSocket)
và logic nghiệp vụ cốt lõi. Một mẫu kiến trúc tốt hơn là để controller
\@MessageMapping hoạt động như một lớp adapter mỏng. Nhiệm vụ chính của
nó là nhận thông điệp, chuyển tiếp đến một lớp \@Service chuyên dụng, và
sau đó phát sóng kết quả. Lớp \@Service sẽ chứa logic nghiệp vụ thực sự:
xác thực dữ liệu, tương tác với JpaRepository để lưu vào MySQL, và xử lý
các tác vụ phụ khác. Sự tách biệt này làm cho hệ thống trở nên mạnh mẽ
và dễ bảo trì hơn. Logic nghiệp vụ không phụ thuộc vào cơ chế truyền
tải. Chúng ta có thể thay thế WebSocket bằng SSE, hoặc thêm một endpoint
gRPC, mà không cần viết lại logic cốt lõi trong lớp service. Điều này
cũng giúp việc kiểm thử trở nên dễ dàng hơn, vì lớp service có thể được
unit test một cách độc lập khỏi hạ tầng WebSocket.

4.  **Phần 4: Triển khai Frontend với ReactJS**

Phần này tập trung vào việc xây dựng một giao diện người dùng linh hoạt
và hiệu năng cao cho cả độc giả và nhà báo.

**4.1. Quản lý Vòng đời WebSocket với một Hook Tái sử dụng**

Để quản lý kết nối WebSocket một cách gọn gàng và có thể tái sử dụng,
chúng ta sẽ tạo một custom hook tên là useLiveBlogFeed. Cách tiếp cận
này giúp tách biệt logic kết nối khỏi các component giao diện, làm cho
mã nguồn sạch sẽ và dễ bảo trì hơn.  

**Chức năng của Hook**:

-   Nhận một blogId làm tham số.

-   Sử dụng useEffect để thiết lập kết nối khi component được mount và
    ngắt kết nối khi component bị unmount.

-   Sử dụng các thư viện \@stomp/stompjs và sockjs-client để xử lý giao
    tiếp.  

-   Đăng ký vào topic /topic/liveblog/{blogId}.

-   Quản lý một mảng các entries trong state của nó. Khi nhận được thông
    điệp mới từ subscription, nó sẽ thêm thông điệp đó vào mảng.

-   Cung cấp mảng entries và trạng thái kết nối cho component sử dụng
    nó.

Dưới đây là một ví dụ hoàn chỉnh về hook này, lấy cảm hứng từ các thực
tiễn tốt nhất hiện nay.  

**4.2. Quản lý State và Kiến trúc Component**

Kiến trúc frontend cần phải xử lý cả việc tải dữ liệu ban đầu và cập
nhật thời gian thực một cách hiệu quả.

-   **Tải dữ liệu ban đầu**: Khi người dùng truy cập trang, component
    LiveBlogFeed sẽ thực hiện một yêu cầu fetch đến endpoint REST
    (/api/liveblogs/{blogId}/entries) để tải khoảng 50 bản tin gần nhất.
    Điều này đảm bảo rằng người dùng thấy nội dung ngay lập tức mà không
    phải chờ kết nối WebSocket được thiết lập.

-   **Cập nhật thời gian thực**: Sau khi dữ liệu ban đầu được tải, hook
    useLiveBlogFeed sẽ kết nối tới WebSocket. Khi một thông điệp mới
    đến, nó sẽ được thêm vào đầu mảng entries trong state của component,
    kích hoạt một lần render lại để hiển thị cập nhật mới.

-   **Phân rã Component**:

    -   LiveBlogPage: Component cấp cao nhất, chịu trách nhiệm lấy dữ
        liệu ban đầu và sử dụng hook useLiveBlogFeed.

    -   LiveBlogFeed: Component chịu trách nhiệm hiển thị danh sách các
        bản tin. Đây là nơi chúng ta sẽ áp dụng kỹ thuật ảo hóa danh
        sách (list virtualization) để tối ưu hiệu năng.

    -   LiveBlogEntry: Một component linh hoạt, hiển thị một bản tin duy
        nhất. Nó sẽ sử dụng logic điều kiện để render các loại nội dung
        khác nhau dựa trên entry_type (văn bản, hình ảnh, tweet, v.v.).

Một chiến lược tìm nạp dữ liệu kết hợp (hybrid) --- tải ban đầu qua REST
và cập nhật sau đó qua WebSocket --- là rất cần thiết để có trải nghiệm
người dùng tốt. Nếu chỉ dựa vào WebSocket để lấy tất cả dữ liệu, trang
sẽ trống trơn cho đến khi kết nối được thiết lập. Hơn nữa, không có cơ
chế tiêu chuẩn nào để \"yêu cầu\" toàn bộ lịch sử tin nhắn qua một
subscription WebSocket; subscription là để nhận các tin nhắn *trong
tương lai*. Mặc dù backend có thể được thiết kế để gửi toàn bộ lịch sử
ngay khi kết nối, cách làm này không hiệu quả, tạo ra trạng thái trên
server (stateful) và khó mở rộng. Mẫu hình tối ưu là coi trang web như
bất kỳ trang web nào khác lúc ban đầu: sử dụng một API REST tiêu chuẩn,
có thể cache, và có phân trang để lấy \"khung nhìn\" ban đầu của dữ
liệu. Điều này nhanh chóng và tận dụng được hạ tầng web tiêu chuẩn (HTTP
caching, CDN). *Sau khi* trạng thái ban đầu này được render, kết nối
WebSocket mới được thiết lập để \"làm sống động\" trang bằng các cập
nhật trực tiếp. Cách tiếp cận này mang lại những gì tốt nhất của cả hai
thế giới: tải trang ban đầu nhanh và hiệu suất cảm nhận được (qua REST)
cùng với các cập nhật tức thời (qua WebSocket). Nó tách biệt một cách
chính xác mối quan tâm giữa việc tìm nạp trạng thái của một tài nguyên
và việc đăng ký nhận các thay đổi trong tương lai của tài nguyên đó.

5.  **Phần 5: Tối ưu hóa Nâng cao cho Hiệu năng và Khả năng Mở rộng Cấp
    Production**

Phần cuối cùng và quan trọng nhất này giải quyết yêu cầu chính thứ hai
của người dùng: đảm bảo hệ thống có thể xử lý lưu lượng truy cập cao và
đồng thời lớn trong một sự kiện tin tức thực tế.

**5.1. Khả năng Mở rộng Backend: Mở rộng Ngang với Redis Pub/Sub**

-   **Vấn đề**: Với simple in-memory broker, nếu chúng ta chạy nhiều
    phiên bản (instance) của ứng dụng Spring Boot sau một bộ cân bằng
    tải (load balancer), một người dùng kết nối với Server A sẽ không
    nhận được các thông điệp do Server B phát hành. Hệ thống lúc này là
    stateful và không thể mở rộng theo chiều ngang.  

-   **Giải pháp**: Chúng ta sẽ thay thế simple broker bằng một STOMP
    broker relay bên ngoài được cấu hình để sử dụng Redis Pub/Sub.

-   **Kiến trúc**:

    1.  Một bản tin mới từ nhà báo được Server A tiếp nhận.

    2.  Thay vì phát sóng cho các client của chính nó, Server A sẽ
        publish thông điệp này đến một channel của Redis (ví dụ:
        liveblog:updates).  

    3.  Tất cả các instance của server (A, B, C\...) đều subscribe vào
        channel Redis này.

    4.  Redis phát sóng thông điệp đến tất cả các server đã subscribe.

    5.  Mỗi server, khi nhận được thông điệp từ Redis, sẽ đẩy nó đến tập
        hợp các client WebSocket đang kết nối với mình thông qua hạ tầng
        STOMP cục bộ.

-   **Triển khai**: Cần sửa đổi lớp WebSocketConfig để sử dụng STOMP
    broker relay và cấu hình các thành phần cần thiết cho Redis
    (RedisMessageListenerContainer). Điều này làm cho các instance
    backend trở nên stateless, cho phép mở rộng theo chiều ngang một
    cách thực sự.  

**5.2. Hiệu năng Cơ sở dữ liệu: Đánh chỉ mục Chiến lược**

-   **Điểm nghẽn**: Truy vấn thường xuyên nhất sẽ là lấy các bản tin
    lịch sử cho một bài tường thuật cụ thể, được sắp xếp theo thời gian
    tạo (SELECT \* FROM live_blog_entries WHERE live_blog_id =? ORDER BY
    created_at DESC LIMIT? OFFSET?). Khi số lượng bản tin lên đến hàng
    nghìn, nếu không có chỉ mục (index) phù hợp, truy vấn này sẽ phải
    quét toàn bộ bảng (full table scan), làm tê liệt hiệu năng.

-   **Giải pháp**: Tạo một **chỉ mục phức hợp (composite index)** trên
    bảng live_blog_entries.

-   **Triển khai**: CREATE INDEX idx_liveblog_created ON
    live_blog_entries (live_blog_id, created_at DESC);

-   **Giải thích**: MySQL có thể sử dụng chỉ mục phức hợp này để thực
    hiện truy vấn một cách cực kỳ hiệu quả. Nó sẽ tìm đến live_blog_id
    một cách nhanh chóng, sau đó đọc các bản ghi theo thứ tự đã được sắp
    xếp sẵn của created_at DESC trực tiếp từ chỉ mục. Điều này giúp
    tránh được một thao tác sắp xếp tốn kém (filesort). Thứ tự của các
    cột trong chỉ mục là rất quan trọng để đạt được hiệu quả này.  

**5.3. Hiệu năng Render Frontend: Ảo hóa Danh sách (\"Windowing\")**

-   **Vấn đề**: Khi một sự kiện kéo dài, số lượng bản tin trong mảng
    state của React có thể lên đến hàng trăm hoặc hàng nghìn. Việc
    render tất cả các mục này thành các nút DOM sẽ gây ra sự suy giảm
    hiệu năng nghiêm trọng, làm cho việc cuộn trang trở nên giật, lag,
    đặc biệt là trên thiết bị di động.

-   **Giải pháp**: Triển khai kỹ thuật ảo hóa danh sách bằng thư viện
    react-window. Kỹ thuật này chỉ render các mục hiện đang hiển thị
    trong khung nhìn (viewport) của người dùng, cộng với một vùng đệm
    nhỏ.  

-   **Triển khai**: Tái cấu trúc component LiveBlogFeed để sử dụng
    FixedSizeList từ react-window. Một ví dụ mã nguồn sẽ được cung cấp
    để minh họa cách bọc component LiveBlogEntry và truyền các props
    index và style cần thiết. Điều này đảm bảo rằng ngay cả khi có hàng
    nghìn mục trong bộ nhớ, chỉ có một số lượng nhỏ (khoảng 10-20) thực
    sự tồn tại trong DOM tại một thời điểm.

**5.4. Hạ tầng và Triển khai: Nginx làm Reverse Proxy cho WebSocket**

-   **Thách thức**: Nginx cần cấu hình đặc biệt để xử lý việc nâng cấp
    giao thức từ HTTP lên WebSocket. Một cấu hình proxy HTTP tiêu chuẩn
    sẽ thất bại.

-   **Giải pháp**: Cung cấp một khối cấu hình location hoàn chỉnh và có
    chú thích cho Nginx để triển khai trong môi trường production.

-   **Ví dụ Cấu hình**:

> Nginx
>
> location /ws/ {
>
> proxy_pass http://backend_servers;
>
> proxy_http_version 1.1;
>
> proxy_set_header Upgrade \$http_upgrade;
>
> proxy_set_header Connection \"upgrade\";
>
> proxy_set_header Host \$host;
>
> proxy_read_timeout 86400s; // Giữ kết nối mở
>
> }

-   **Giải thích**: Mỗi chỉ thị sẽ được giải thích cặn kẽ :  

    -   proxy_http_version 1.1: Việc nâng cấp lên WebSocket là một phần
        của giao thức HTTP/1.1.

    -   proxy_set_header Upgrade \$http_upgrade: Chuyển tiếp header
        \"Upgrade\" từ client đến backend.

    -   proxy_set_header Connection \"upgrade\": Chuyển tiếp header
        \"Connection\", báo hiệu ý định chuyển đổi giao thức. Hai header
        này là loại \"hop-by-hop\" và phải được chuyển tiếp một cách
        tường minh.

Tối ưu hóa hiệu năng trong một hệ thống thời gian thực không phải là một
nhiệm vụ đơn lẻ mà là một chiến lược toàn diện, đa tầng. Một điểm nghẽn
ở bất kỳ lớp nào---cơ sở dữ liệu, ứng dụng, mạng, hay client---đều có
thể làm ảnh hưởng đến khả năng phản hồi của toàn bộ hệ thống. Một nhà
phát triển có thể giải quyết vấn đề mở rộng backend bằng Redis nhưng lại
bỏ qua cơ sở dữ liệu. Hệ thống vẫn sẽ thất bại dưới tải trọng cao vì
truy vấn REST ban đầu để lấy lịch sử sẽ quá chậm do thiếu chỉ mục. Một
nhà phát triển khác có thể tối ưu hóa backend và cơ sở dữ liệu nhưng lại
phớt lờ frontend. Hệ thống sẽ có vẻ chậm đối với người dùng vì trình
duyệt của họ đang vật lộn để render hàng nghìn nút DOM, mặc dù dữ liệu
đang được gửi đến rất nhanh. Một đội ngũ full-stack có thể tối ưu hóa
tất cả những điều trên nhưng lại sử dụng một bộ cân bằng tải (Nginx)
được cấu hình sai, làm rớt các kết nối WebSocket, khiến toàn bộ tính
năng thời gian thực trở nên không đáng tin cậy. Điều này cho thấy yêu
cầu về \"hiệu năng\" không thể được xử lý một cách riêng lẻ. Nó đòi hỏi
một góc nhìn toàn diện trên toàn bộ stack công nghệ. Báo cáo này phải
giải quyết việc tối ưu hóa ở mọi lớp---từ kế hoạch thực thi truy vấn
SQL, đến kiến trúc nhắn tin phân tán, chiến lược render DOM phía client,
và cuối cùng là hạ tầng mạng---để cung cấp một giải pháp thực sự hiệu
năng cao. Mỗi tối ưu hóa đều xây dựng trên các tối ưu hóa khác để tạo ra
một hệ thống bền bỉ, có khả năng mở rộng và mang lại trải nghiệm người
dùng mượt mà.  
