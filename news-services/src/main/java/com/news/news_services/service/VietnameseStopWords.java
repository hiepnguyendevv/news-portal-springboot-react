// Đặt trong package com.news.news_services.service
package com.news.news_services.service;

import java.util.Set;

public class VietnameseStopWords {

    // --- DANH SÁCH ĐÃ SỬA: ĐÃ XÓA CÁC TỪ BỊ TRÙNG LẶP ---
    // (Đã xóa "là" và "bị" ở dòng thứ 5)
    public static final Set<String> STOP_WORDS = Set.of(
            "và", "là", "của", "cho", "có", "các", "như", "này", "khi", "để", "ở", "tại",
            "trong", "ra", "vào", "với", "đã", "đang", "sẽ", "được", "bị", "một", "hai",
            "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "anh", "chị", "em",
            "ông", "bà", "nó", "họ", "tôi", "bạn", "chúng", "ta", "chúng_tôi", "mình",
            "đây", "đó", "kia", "ấy", "nào", "đâu", "khi_nào", "bao_lâu", "bao_giờ",
            "thì", "mà", "về", "lên", "xuống", "qua", "lại", "tới", "lui", // <-- Đã xóa "là", "bị" khỏi đây
            "trên", "dưới", "trước", "sau", "cùng", "những", "nhiều", "ít", "khác",
            "cũng", "vẫn", "chỉ", "hay", "hoặc", "nếu", "vì", "nên", "do",
            "bài viết", "nội dung", "tin tức", "thông tin", "tác giả", "bình luận",
            "hình ảnh", "video", "đọc giả", "người", "việc", "theo", "tuy nhiên"
    );
}