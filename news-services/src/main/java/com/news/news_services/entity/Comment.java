package com.news.news_services.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;      

    @Column(nullable = false,length = 10000)
    private String content;

    @ManyToOne
    @JoinColumn(name = "news_id")
    private News news;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(name = "path",length = 1000)
    private String path;

    @Column(name = "depth")
    private Integer depth;

    @Column(name = "deleted",nullable = false)
    private boolean delete = false;

    @Column(name = "deleted_at")
    private java.time.Instant deletedAt;

    @ManyToOne
    @JoinColumn(name = "deleted_by")
    private User deletedBy;




    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "created_at",nullable = false)
    private java.time.Instant createdAt;

    @PrePersist
    public void onCreated(){
        if(createdAt == null){
            createdAt = java.time.Instant.now();
        }
        if(likeCount == null){
            likeCount = 0;
        }
    }

    public boolean isDelete() {
        return delete;
    }

    public void setDelete(boolean delete) {
        this.delete = delete;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deleted_at) {
        this.deletedAt = deleted_at;
    }

    public User getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(User deletedBy) {
        this.deletedBy = deletedBy;
    }

    public Integer getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }



    public Comment() {
    }

    public long getId() {
        return id;
    }


    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public News getNews() {
        return news;
    }

    public void setNews(News news) {
        this.news = news;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Comment getParent() {
        return parent;
    }

    public void setParent(Comment parent) {
        this.parent = parent;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Integer getDepth() {
        return depth;
    }

    public void setDepth(Integer depth) {
        this.depth = depth;
    }
}
