package com.news.news_services.service;

//import com.news.news_services.dto.CommentDto;

import com.news.news_services.dto.CommentAdminDto;
import com.news.news_services.dto.CommentWithRepliesDto;
import com.news.news_services.entity.Comment;
import com.news.news_services.entity.CommentLike;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.CommentLikesRepository;
import com.news.news_services.repository.CommentRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.Instant;
import java.util.List;

@Service
public class CommentService {

    @Autowired private CommentRepository commentRepository;
    @Autowired private NewsRepository newsRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CommentLikesRepository commentLikesRepository;


    @Transactional
    public List<CommentWithRepliesDto> getAllCommentsForNews(Long newsId, Long userId) {
        //lấy tất cả comments của news (bao gồm cả replies) theo path
        List<Comment> allComments = commentRepository.findByNews(newsId);
        
        //lấy root comments
        List<Comment> rootComments = commentRepository.findByNewsAndParentIsNullOrderByCreatedAtDesc(
            newsRepository.findById(newsId).orElseThrow()
        );
        
        //xử lý từng root comment và replies của nó
        return rootComments.stream().map(rootComment -> {
            //lấy tất cả replies của root comment này
            String pathPrefix = rootComment.getPath() + ".%";
            List<Comment> replies = commentRepository.findByPathStartingWith(pathPrefix);

            //convert replies thành DTO
            List<CommentWithRepliesDto> replyDtos = replies.stream()
                .map(reply -> {
                            CommentWithRepliesDto dto = CommentWithRepliesDto.from(reply,List.of());
                            if(userId != null){
                                User user = userRepository.findById(userId).orElse(null);
                                if(user != null){
                                    dto.setLiked(commentLikesRepository.existsByUserAndComment(user,reply));
                                } else {
                                    dto.setLiked(false);
                                }
                            }else{
                                dto.setLiked(false);
                            }
                            return dto;
                        }).toList();


            CommentWithRepliesDto rootDto = CommentWithRepliesDto.from(rootComment,replyDtos);
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    rootDto.setLiked(commentLikesRepository.existsByUserAndComment(user, rootComment));
                } else {
                    rootDto.setLiked(false);
                }
            } else {
                rootDto.setLiked(false); //user chưa đăng nhập
            }
            //tạo DTO cho root comment với replies
            return rootDto;
        }).toList();
    }


    @Transactional
    public List<Comment> getRootComments(Long newsId) {
        News news = newsRepository.findById(newsId).orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));
        return commentRepository.findByNewsAndParentIsNullOrderByCreatedAtDesc(news);
    }

    @Transactional
    public List<Comment> getReplies(Long parentId){
        //lấy comment gốc để có path
        Comment parentComment = commentRepository.findById(parentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + parentId));
        String pathPrefix = parentComment.getPath() + ".%";
        
        //lấy tất cả replies theo 
        return commentRepository.findByPathStartingWith(pathPrefix);
    }


    @Transactional
    public Comment createComment(String content,Long userId, Long newsId, Long parentId){
        News news = newsRepository.findById(newsId).orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Comment comment = new Comment();
        comment.setContent(content);
        comment.setNews(news);
        comment.setUser(user);

        if(parentId != null){
            Comment parent = commentRepository.findById(parentId).orElse(null);
            comment.setParent(parent);
            Integer parentDepth =  parent.getDepth();
            comment.setDepth(parentDepth == null ? 1 : parentDepth + 1);
        }else{
            comment.setDepth(0);
        }

        comment = commentRepository.save(comment);
        
        //set path dựa trên parent
        if(comment.getParent() == null){
            //root comment
            comment.setPath(String.valueOf(comment.getId()));
        } else {
            //reply comment
            comment.setPath(comment.getParent().getPath() + "." + comment.getId());
        }

        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));


        String pathPrefix = comment.getPath() +".%";
        List<Comment> descendants = commentRepository.findByPathStartingWith(pathPrefix);
        commentLikesRepository.deleteByCommentId(commentId);
        commentRepository.deleteAll(descendants);
        commentRepository.delete(comment);
    }

    @Transactional
    public void softDeleteComment(Long commentId,Long userId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        if (comment.getUser() == null || comment.getUser().getId() != userId) {
        throw new SecurityException("Not allowed to delete this comment");
    }
        comment.setDelete(true);
        comment.setDeletedAt(Instant.now());
        comment.setDeletedBy(userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId)));
        commentLikesRepository.deleteByCommentId(commentId);
        comment.setLikeCount(0);
        commentRepository.save(comment);
    }

    @Transactional
    public void softDeleteComment(Long commentId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        comment.setDelete(true);
        comment.setDeletedAt(Instant.now());
        commentLikesRepository.deleteByCommentId(commentId);
        comment.setLikeCount(0);
        commentRepository.save(comment);
    }

    @Transactional
    public Comment likeComment(Long commentId,Long userId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if(commentLikesRepository.existsByUserAndComment(user,comment)){
            return comment;

        }else{
            CommentLike commentLike = new CommentLike();
            commentLike.setUser(user);
            commentLike.setComment(comment);
            commentLike.setCreatedAt(Instant.now());
            commentLikesRepository.save(commentLike);
            comment.setLikeCount(comment.getLikeCount() + 1);
        }
        return commentRepository.save(comment);

    }

    @Transactional
    public Comment unlikeComment(Long commentId,Long userId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if(commentLikesRepository.existsByUserAndComment(user,comment)){
            commentLikesRepository.deleteByUserAndComment(user,comment);
            comment.setLikeCount(comment.getLikeCount() - 1);
            return  commentRepository.save(comment);
        }
        return comment;

    }

    @Transactional
    public Page<CommentAdminDto> SearchComment(String content,String author,String news,String status,Pageable pageable){
        Page<Comment> comments = commentRepository.searchComment(content,author,news,status,pageable);
        return comments.map(this::convertToAdminDto);
    }

    @Transactional
    public Page<CommentAdminDto> getAllCommentForAdmin(Pageable pageable){
        Page<Comment> comments = commentRepository.getAllCommentForAdmin(pageable);
        return comments.map(this::convertToAdminDto);
    }

    @Transactional
    public Page<CommentAdminDto> getCommentById(Long id, Pageable pageable){
        Page<Comment> comments = commentRepository.findByUserId(id, pageable);
        return comments.map(this::convertToAdminDto);
    }



    public void restoreComment(Long commentId){
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("comment not found"));
        comment.setDelete(false);
        comment.setDeletedAt(null);
        comment.setDeletedBy(null);
        commentRepository.save(comment);
    }

    public CommentAdminDto convertToAdminDto(Comment comment){
        CommentAdminDto dto = new CommentAdminDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAuthorName(comment.getUser().getFullName());
        dto.setAuthorEmail(comment.getUser().getEmail());
        dto.setNewsTitle(comment.getNews().getTitle());
        dto.setNewsSlug(comment.getNews().getSlug());
        dto.setDeleted(comment.isDelete());
        dto.setDeletedByName(comment.getUser().getFullName());
        dto.setLikeCount(comment.getLikeCount());
        dto.setDepth(comment.getDepth());
        dto.setPath(comment.getPath());
        dto.setNewsId(comment.getNews().getId());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setDeletedAt(comment.getDeletedAt());

        if(comment.getPath() != null){
            String pathPrefix  = comment.getPath()+".%";
            List<Comment> replies = commentRepository.findByPathStartingWith(pathPrefix);
            dto.setReplyCount(replies.size());
        }else{
            dto.setReplyCount(0);
        }

        return  dto;

    }

    public void deleteCommentByNewsId(Long newsId){
        commentRepository.deleteByNewsId(newsId);

    }

}


