package com.news.news_services.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="bookmarks", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_news", columnNames = {"user_id","news_id"})
})
public class Bookmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "news_id",nullable = false)
    private News news;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Bookmark() {
    }

    public Bookmark(User user, News news) {
        this.user = user;
        this.news = news;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public News getNews() {
        return news;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
