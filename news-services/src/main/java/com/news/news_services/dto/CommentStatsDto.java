package com.news.news_services.dto;

public class CommentStatsDto {
    private Long totalComments;
    private Long aciveComments;
    private Long deletedComments;
    private Long commentsToday;
    private Long commentsThisWeek;
    private Long commentsThisMonth;

    public CommentStatsDto() {
    }

    public Long getTotalComments() {
        return totalComments;
    }

    public void setTotalComments(Long totalComments) {
        this.totalComments = totalComments;
    }

    public Long getAciveComments() {
        return aciveComments;
    }

    public void setAciveComments(Long aciveComments) {
        this.aciveComments = aciveComments;
    }

    public Long getDeletedComments() {
        return deletedComments;
    }

    public void setDeletedComments(Long deletedComments) {
        this.deletedComments = deletedComments;
    }

    public Long getCommentsToday() {
        return commentsToday;
    }

    public void setCommentsToday(Long commentsToday) {
        this.commentsToday = commentsToday;
    }

    public Long getCommentsThisWeek() {
        return commentsThisWeek;
    }

    public void setCommentsThisWeek(Long commentsThisWeek) {
        this.commentsThisWeek = commentsThisWeek;
    }

    public Long getCommentsThisMonth() {
        return commentsThisMonth;
    }

    public void setCommentsThisMonth(Long commentsThisMonth) {
        this.commentsThisMonth = commentsThisMonth;
    }
}
