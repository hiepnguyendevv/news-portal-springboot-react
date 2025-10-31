package com.news.news_services.dto;

import com.news.news_services.entity.News;
import com.news.news_services.entity.Tag;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public class NewsResponseDto {
    private Long id;
    private String title;
    private String summary;
    private String content;
    private String imageUrl;
    private String slug;
    private LocalDateTime createdAt;
    private String authorName;
    private String categoryName;
    private Set<String> tags;
    private News.Status status;

    public NewsResponseDto(News news) {
        this.id = news.getId();
        this.title = news.getTitle();
        this.summary = news.getSummary();
        this.content = news.getContent();
        this.imageUrl = news.getImageUrl();
        this.slug = news.getSlug();
        this.createdAt = news.getCreatedAt();
        this.status = news.getStatus();
        if (news.getAuthor() != null) {
            this.authorName = news.getAuthor().getUsername(); // Or getFullName()
        }
        if (news.getCategory() != null) {
            this.categoryName = news.getCategory().getName();
        }
        if (news.getTags() != null) {
            this.tags = news.getTags().stream().map(Tag::getName).collect(Collectors.toSet());
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public News.Status getStatus() {
        return status;
    }

    public void setStatus(News.Status status) {
        this.status = status;
    }
}
