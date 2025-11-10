package com.news.news_services.service;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service

public class CloudinaryService {
    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);

    @Autowired
    private Cloudinary cloudinary;

    // Danh sách các kiểu MIME thông dụng cho video
    private static final List<String> VIDEO_MIME_TYPES = Arrays.asList(
            "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo", "video/x-flv"
            // Thêm các kiểu video khác nếu cần
    );

    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        try {
            // === THAY ĐỔI LOGIC Ở ĐÂY ===
            Map<String, Object> uploadOptions = new HashMap<>();
            uploadOptions.put("folder", "news_media"); // Thư mục lưu trên Cloudinary

            // Xác định resource_type dựa trên ContentType (MIME type)
            String contentType = file.getContentType();

            if (contentType != null && VIDEO_MIME_TYPES.contains(contentType.toLowerCase())) {
                uploadOptions.put("resource_type", "video"); // Báo cho Cloudinary đây là video
            } else {
                // Mặc định là 'image' nếu không phải video hoặc không xác định được
                uploadOptions.put("resource_type", "image");
            }
            // === KẾT THÚC THAY ĐỔI ===

            // Gọi API upload với options đã xác định
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

            String secureUrl = uploadResult.get("secure_url").toString();

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Could not read upload file", e);
        } catch (Exception e) { // Bắt lỗi chung từ Cloudinary
            // Ném lại lỗi gốc hoặc lỗi RuntimeException tùy bạn chọn
            // Quan trọng là phải bắt lỗi ở Controller để trả về 500
            throw new RuntimeException("Could not upload file to Cloudinary: " + e.getMessage(), e);
        }
    }
}

