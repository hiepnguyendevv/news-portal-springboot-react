package com.news.news_services.controller;


//import com.news.news_services.dto.CommentDto;
import com.news.news_services.dto.CommentWithRepliesDto;
import com.news.news_services.dto.CreateCommentRequest;
import com.news.news_services.entity.Comment;
import com.news.news_services.security.UserPrincipal;
import com.news.news_services.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping
    public List<CommentWithRepliesDto> getAllComments(@RequestParam Long newsId,Authentication auth){
        Long userId = auth != null ? ((UserPrincipal)auth.getPrincipal()).getId() : null;
        return commentService.getAllCommentsForNews(newsId, userId);
    }

    @GetMapping("/{parentId}/replies")
    public List<CommentWithRepliesDto> getReplies(@PathVariable Long parentId){
        return commentService.getReplies(parentId).stream()
                .map(reply -> CommentWithRepliesDto.from(reply, List.of()))
                .toList();
    }

    @PostMapping
    public CommentWithRepliesDto createComment(@RequestBody CreateCommentRequest request, Authentication auth){
        Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
        Comment comment = commentService.createComment(
                request.getContent(),
                userId,
                request.getNewsId(),
                request.getParentId()
        );
        return CommentWithRepliesDto.from(comment, List.of());
    }

    @DeleteMapping("/{id}")
    public void deleteComment(@PathVariable Long id, Authentication auth){
        Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
        commentService.softDeleteComment(id, userId);
    }

    @PostMapping("/{commentId}/like")
    public CommentWithRepliesDto likeComment(@PathVariable Long commentId, Authentication auth){
        Long userId = ((UserPrincipal)auth.getPrincipal()).getId();

        Comment comment = commentService.likeComment(commentId, userId);
        return CommentWithRepliesDto.from(comment, List.of());
    }

    @DeleteMapping("/{commentId}/like")
    public CommentWithRepliesDto unlikeComment(@PathVariable Long commentId, Authentication auth){
        Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
        Comment comment = commentService.unlikeComment(commentId, userId);
        return CommentWithRepliesDto.from(comment,List.of());
    }


}
