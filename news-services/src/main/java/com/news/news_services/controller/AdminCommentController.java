package com.news.news_services.controller;


import com.news.news_services.dto.CommentAdminDto;
import com.news.news_services.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/admin/comment")
public class AdminCommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping
    public ResponseEntity<?> getAllComment(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size){

        try{
            Pageable pageable = PageRequest.of(page,size);
            Page<CommentAdminDto> result = commentService.getAllCommentForAdmin(pageable);

            return ResponseEntity.ok(Map.of(
                    "content",result.getContent(),
                    "totalPages",result.getTotalPages(),
                    "totalElements",result.getTotalElements(),
                    "page",result.getNumber(),
                    "size",result.getSize()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }


    @GetMapping("/search")
    public ResponseEntity<?> searchComment(@RequestParam(required = false) String content,
                                           @RequestParam(required = false) String author,
                                           @RequestParam(required = false) String news,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size){
        try{
            Pageable pageable = PageRequest.of(page,size);
            Page<CommentAdminDto> result = commentService.SearchComment(content,author,news,status,pageable);
            return ResponseEntity.ok(Map.of(
                    "content", result.getContent(),
                    "totalPages", result.getTotalPages(),
                    "totalElements", result.getTotalElements(),
                    "page", result.getNumber(),
                    "size", result.getSize()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> getCommentById(@PathVariable Long id, @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size){
        try{
            Pageable pageable = PageRequest.of(page,size);
            Page<CommentAdminDto> result = commentService.getCommentById(id, pageable);
            return ResponseEntity.ok(Map.of(
                    "content",result.getContent(),
                    "totalPages",result.getTotalPages(),
                    "totalElements",result.getTotalElements(),
                    "page",result.getNumber(),
                    "size",result.getSize()
            ));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> hardDeleteComment(@PathVariable Long id){
        try{
            commentService.deleteComment(id);
            return ResponseEntity.ok(Map.of("message", "Successfully deleted comment"));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(Map.of("error","error delete"));
        }
    }

    @DeleteMapping("{id}/soft-delete")
    public ResponseEntity<?> softDeleteComment(@PathVariable Long id){
        try{
            commentService.softDeleteComment(id);
            return ResponseEntity.ok(Map.of("message", "Successfully deleted comment"));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(Map.of("error","error delete"));
        }
    }
    @PutMapping("/{id}/restore")
        public ResponseEntity<?> restoreComment(@PathVariable Long id){
            try{
                commentService.restoreComment(id);
                return ResponseEntity.ok(Map.of("message","Success restore comment"));
            }catch (Exception e){
                return ResponseEntity.badRequest().body(Map.of("error","error restore"));
            }
        }
}
