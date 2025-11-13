package com.news.news_services.dto;

import java.util.List;

public class NewsCreateDto {
    private String title;
    private String summary;
    private String content;
    private Long categoryId;
    private Boolean published;
    private Boolean featured;
    private Boolean isRealtime;
    private List<String> tags;
    private List<Long> mediaIds;


    public NewsCreateDto() {
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    public Boolean isRealTime() {
        return isRealtime;
    }

    public void setIsRealtime(Boolean isRealtime) {
        this.isRealtime = isRealtime;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<Long> getMediaIds() {
        return mediaIds;
    }

    public void setMediaIds(List<Long> mediaIds) {
        this.mediaIds = mediaIds;
    }
}
