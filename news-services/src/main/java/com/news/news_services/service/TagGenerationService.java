package com.news.news_services.service;

import com.news.news_services.dto.OpenAiChatRequest;
import com.news.news_services.dto.OpenAiChatResponse;
import com.news.news_services.dto.OpenAiMessage;

import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagGenerationService {

    @Value("${openai.api.key}")
    private String openAiApiKey; // 1. Lấy API Key từ properties

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private final RestTemplate restTemplate;

    public TagGenerationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Trích xuất tags từ title và content (Phương án C: OpenAI)
     */
    public List<String> generateTagsFromContent(String title, String contentHtml) {

        // 1. Làm sạch HTML
        String cleanContent = Jsoup.parse(contentHtml).text();
        // Giới hạn độ dài nội dung để tiết kiệm chi phí
        if (cleanContent.length() > 1000) {
            cleanContent = cleanContent.substring(0, 1000);
        }

        // 2. Tạo câu "prompt"
        String prompt = String.format(
                "Phân tích tiêu đề và nội dung bài báo sau đây. Trích xuất 5 từ khóa (tags) quan trọng nhất." +
                        "Chỉ trả về 5 từ khóa đó, cách nhau bằng dấu phẩy (,), không giải thích gì thêm.\n" +
                        "Tiêu đề: %s\n" +
                        "Nội dung: %s",
                title, cleanContent
        );

        // 3. Chuẩn bị request
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey); // Đặt Authorization header

        // Sử dụng DTOs đã tạo
        List<OpenAiMessage> messages = List.of(new OpenAiMessage("user", prompt));
        OpenAiChatRequest requestBody = new OpenAiChatRequest(
                "gpt-4o-mini", // (hoặc "gpt-4o-mini" để nhanh và rẻ hơn)
                messages,
                5 // Giới hạn token trả về
        );

        HttpEntity<OpenAiChatRequest> entity = new HttpEntity<>(requestBody, headers);

        try {
            // 4. Gọi API
            OpenAiChatResponse response = restTemplate.postForObject(
                    OPENAI_API_URL,
                    entity,
                    OpenAiChatResponse.class
            );

            // 5. Xử lý kết quả
            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String rawResult = response.getChoices().get(0).getMessage().getContent();
                return parseTags(rawResult);
            }

        } catch (Exception e) {
            System.err.println("Lỗi khi gọi API OpenAI: " + e.getMessage());
        }

        return Collections.emptyList(); // Trả về rỗng nếu có lỗi
    }

    /**
     * Xử lý chuỗi trả về từ AI (ví dụ: "Thành phố Hồ Chí Minh, Thể thao, Kinh tế")
     */
    private List<String> parseTags(String rawResult) {
        if (rawResult == null || rawResult.isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(rawResult.split(",")) // Tách bằng dấu phẩy
                .map(String::trim)                 // Xóa khoảng trắng
                .filter(tag -> !tag.isEmpty())     // Lọc bỏ tag rỗng
                .collect(Collectors.toList());
    }
}