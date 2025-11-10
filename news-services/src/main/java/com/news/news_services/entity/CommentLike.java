package com.news.news_services.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "comment_likes", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_comments",columnNames = {"user_id","comment_id"})
})
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @Column(name = "created_at",nullable = false)
    private java.time.Instant createdAt;

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }


    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
