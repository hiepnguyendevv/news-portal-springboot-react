package com.news.news_services.service;

import com.news.news_services.entity.Notification;
import com.news.news_services.entity.User;
import com.news.news_services.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification create(User recipient, String title, String message, String link) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setTitle(title);
        n.setMessage(message);
        n.setLink(link);
        n.setRead(false);
        return notificationRepository.save(n);
    }

    public List<Notification> getUserNotifications(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    public long countUnread(Long recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}


