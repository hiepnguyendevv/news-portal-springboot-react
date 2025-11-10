package com.news.news_services.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class OpenAiChatRequest {
    private String model;
    private List<OpenAiMessage> messages;
    @JsonProperty("max_tokens")
    private int maxTokens;

    public OpenAiChatRequest(String model, List<OpenAiMessage> messages, int maxTokens) {
        this.model = model;
        this.messages = messages;
        this.maxTokens = maxTokens;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public List<OpenAiMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<OpenAiMessage> messages) {
        this.messages = messages;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }
}
