package com.news.news_services.dto;

import com.news.news_services.entity.User;

public class ExchangeTokenResponse {

    private String newRawRefreshToken; // Token mới để set vào cookie
    private User user; // User để tạo Access Token mới

    public ExchangeTokenResponse(String newRawRefreshToken, User user) {
        this.newRawRefreshToken = newRawRefreshToken;
        this.user = user;
    }

    // Getters
    public String getNewRawRefreshToken() {
        return newRawRefreshToken;
    }

    public User getUser() {
        return user;
    }
}