package com.news.news_services.controller;

import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.entity.Bookmark;
import com.news.news_services.repository.BookmarkRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
 public class BookmarkController {
    @Autowired private BookmarkRepository bookmarkRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NewsRepository newsRepository;

    private User currentUser(Authentication auth){
        UserPrincipal up = (UserPrincipal) auth.getPrincipal();
        return userRepository.findById(up.getId()).orElseThrow();
    }

    @PostMapping("/news/{id}/bookmark")
    public ResponseEntity<?> addBookmark(@PathVariable long id,Authentication auth){
       User user = currentUser(auth);
       News news = newsRepository.findById(id).orElseThrow();
       if(!bookmarkRepository.existsByUserAndNews(user,news)){
           bookmarkRepository.save(new Bookmark(user,news));
       }
       return ResponseEntity.ok(Map.of("bookmarked",true));
    }

    @DeleteMapping("/news/{id}/bookmark")
    public ResponseEntity<?> deleteBookmark(@PathVariable long id,Authentication auth){
        User user = currentUser(auth);
        News news = newsRepository.findById(id).orElseThrow();
        bookmarkRepository.findByUserAndNews(user,news).ifPresent(bookmarkRepository::delete);
        return ResponseEntity.ok(Map.of("bookmarked",false));
    }

    @GetMapping("/me/bookmark")
    public ResponseEntity<?> getMyBookmark(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "12") int size,
                                             Authentication auth){
        User user = currentUser(auth);
        Page<Bookmark> result = bookmarkRepository.findByUserOrderByCreatedAtDesc(user,PageRequest.of(page,size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalPages", result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "page", result.getNumber(),
                "size", result.getSize()
        ));

    }

    @GetMapping("/news/{id}/bookmark/status")
    public ResponseEntity<?> isBookmarked(@PathVariable Long id, Authentication auth) {
        User user = currentUser(auth);
        News news = newsRepository.findById(id).orElseThrow();
        boolean bookmarked = bookmarkRepository.existsByUserAndNews(user, news);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }
}
