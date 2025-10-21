package com.news.news_services.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "news")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class News {

    public enum Status {
        DRAFT,
        PENDING_REVIEW,
        PUBLISHED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    @Column(nullable = false, length = 255)
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    @Column(columnDefinition = "TEXT")
    private String content;

    @Size(max = 500, message = "Mô tả ngắn không được vượt quá 500 ký tự")
    @Column(length = 500)
    private String summary;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "slug", length = 255, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id",nullable = false)
    private Category category;

    public Set<NewsTag> getNewsTags() {
        return newsTags;
    }

    public void setNewsTags(Set<NewsTag> newsTags) {
        this.newsTags = newsTags;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id",nullable = false)
    private User author;

    @Column(name = "view_count")
    private Long viewCount = 0L;

    @Column(name = "published")
    private Boolean published = false;


    @Column(name = "featured")
    private Boolean featured = false; // Tin nổi bật

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32)
    private Status status = Status.DRAFT;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;


    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "news",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    @JsonManagedReference
    private Set<NewsTag> newsTags = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_realtime")
    private boolean isRealtime = false;

    @Column (name = "live_start_time")
    private LocalDateTime liveStartTime;

    @Column(name = "live_end_time")
    private LocalDateTime liveEndTime;

    @OneToMany(mappedBy = "news",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<LiveContent> liveContents = new ArrayList<>();



    public News() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }



    public News(String title, String summary, String content, Category category, User author) {
        this();
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.category = category;
        this.author = author;
    }



    // Getters and Setters

    public Set<Tag> getTags() {
        return newsTags.stream()
                .map(NewsTag::getTag)
                .collect(Collectors.toSet());
    }

    public LocalDateTime getLiveEndTime() {
        return liveEndTime;
    }

    public void setLiveEndTime(LocalDateTime liveEndTime) {
        this.liveEndTime = liveEndTime;
    }

    public LocalDateTime getLiveStartTime() {
        return liveStartTime;
    }

    public void setLiveStartTime(LocalDateTime liveStartTime) {
        this.liveStartTime = liveStartTime;
    }

    public boolean isRealtime() {
        return isRealtime;
    }

    public void setRealtime(boolean realtime) {
        this.isRealtime = realtime;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) {
        this.published = published;
        if(published && publishedAt == null) {
            this.publishedAt = LocalDateTime.now();

        }
    }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<LiveContent> getLiveContents() {
        return liveContents;
    }

    public void setLiveContents(List<LiveContent> liveContents) {
        this.liveContents = liveContents;
    }

    @PreUpdate
    public void setLastUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}