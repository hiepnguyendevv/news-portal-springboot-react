package com.news.news_services.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.news.news_services.dto.OpenAiMessage;

import java.util.List;

// Bỏ qua tất cả các trường không cần thiết
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenAiChatResponse {
    private List<Choice> choices;

    // Getters và Setters
    public List<Choice> getChoices() { return choices; }
    public void setChoices(List<Choice> choices) { this.choices = choices; }
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {
        private OpenAiMessage message;

        // Getters và Setters
        public OpenAiMessage getMessage() { return message; }
        public void setMessage(OpenAiMessage message) { this.message = message; }
    }
}

