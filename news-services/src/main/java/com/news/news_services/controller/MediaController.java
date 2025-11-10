package com.news.news_services.controller;

import com.news.news_services.entity.Media;
import com.news.news_services.entity.User;
import com.news.news_services.repository.MediaRepository;
import com.news.news_services.repository.UserRepository;
import com.news.news_services.security.UserPrincipal;
import com.news.news_services.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Security;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
public class MediaController {
    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {

        try{
            String mediaUrl = cloudinaryService.uploadFile(file);
            Map<String,Object> response = new HashMap<>();
            response.put("url",mediaUrl);
            response.put("success",true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    @PostMapping("/upload-news")
    public ResponseEntity<?> uploadNews(@RequestParam("file") MultipartFile file) {
        try{
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
            User user = userRepository.findById(userPrincipal.getId()).orElseThrow();

            String mediaUrl = cloudinaryService.uploadFile(file);

            Media media = new Media();
            media.setUrl(mediaUrl);
            media.setUploader(user);
            media.setNews(null);
            media.setCreatedAt(Instant.now());

            Media savedMedia = mediaRepository.save(media);

            Map<String, Object> response = new HashMap<>();
            response.put("location",mediaUrl);
            response.put("mediaId",savedMedia.getId());
            response.put("url",mediaUrl);
            response.put("success",true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }



    }
}
