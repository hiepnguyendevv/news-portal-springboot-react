package com.news.news_services.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

@Controller
public class WebSocketTestController { // Đã đổi tên class cho đúng với file

    /**
     * Lớp DTO để khớp với cấu trúc JSON từ frontend.
     * Spring sẽ tự động chuyển đổi JSON thành đối tượng này.
     */
    public static class MessagePayload {
        private String content;
        private String timestamp;

        // Cần có constructor mặc định cho Jackson (thư viện JSON)
        public MessagePayload() {}

        public MessagePayload(String content, String timestamp) {
            this.content = content;
            this.timestamp = timestamp;
        }

        // Getters và Setters
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        @Override
        public String toString() {
            return "MessagePayload{" +
                    "content='" + content + '\'' +
                    ", timestamp='" + timestamp + '\'' +
                    '}';
        }
    }

    /**
     * Xử lý tin nhắn tại destination "/app/test".
     * Nhận vào một MessagePayload thay vì Object.
     * Sử dụng @SendTo để tự động gửi lại, code sẽ gọn hơn.
     */
    @MessageMapping("/test")
    @SendTo("/topic/test")
    public MessagePayload handleTestMessage(MessagePayload incomingMessage) {
        System.out.println("📩 Nhận tin nhắn từ frontend: " + incomingMessage.toString());

        // Xử lý và tạo tin nhắn trả về
        String replyContent = "Server reply to: " + HtmlUtils.htmlEscape(incomingMessage.getContent());
        MessagePayload replyMessage = new MessagePayload(replyContent, new java.util.Date().toString());

        System.out.println("📤 Đã gửi lại tin nhắn: " + replyMessage.toString());
        return replyMessage;
    }
}

