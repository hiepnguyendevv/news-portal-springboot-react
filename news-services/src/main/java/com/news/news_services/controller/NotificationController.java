package com.news.news_services.controller;

import com.news.news_services.entity.Notification;
import com.news.news_services.security.UserPrincipal;
import com.news.news_services.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getMyNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        List<Notification> list = notificationService.getUserNotifications(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        long count = notificationService.countUnread(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "marked as read"));
    }
}


