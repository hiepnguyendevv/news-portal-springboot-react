package com.news.news_services.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.news.news_services.dto.LiveNewsEvent;
import com.news.news_services.entity.LiveContent;
import com.news.news_services.entity.News;
import com.news.news_services.entity.User;
import com.news.news_services.repository.LiveContentRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.UserRepository;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LiveContentService {

    public static final String LIVE_NEWS_CHANNEL= "live-news-event";
    @Autowired
    private LiveContentRepository liveContentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NewsRepository newsRepository;
    @Autowired
    private RedisTemplate<String,Object> redisTemplate;
    @Autowired
    private Cloudinary cloudinary;

    public Page<LiveNewsEvent> getLivedContent(Long newsId, Pageable pageable) {
        Page<LiveContent> liveContents = liveContentRepository.findByNewsId(newsId,pageable);
        return liveContents.map(this::convertToLiveEvent);
    }

    public LiveContent addContent(Long newsId, Long userId,LiveNewsEvent dto){
        News news = newsRepository.findById(newsId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        String rawHtmlContent = dto.getContent();
        String content = Jsoup.clean(rawHtmlContent, Safelist.basicWithImages());

        LiveContent liveContent = new LiveContent();
        liveContent.setNews(news);
        liveContent.setUser(user);
        liveContent.setContent(content);
        liveContent.setContentType(LiveContent.ContentType.valueOf(dto.getContentType()));
        liveContent.setEntryStatus(LiveContent.EntryStatus.valueOf(dto.getEntryStatus()));
        liveContent.setMediaUrl(dto.getMediaUrl());
        liveContent.setSortOrder(dto.getSortOrder());
        liveContent.setCreatedAt(LocalDateTime.now());
        liveContent.setUpdatedAt(LocalDateTime.now());

        LiveContent saved = liveContentRepository.save(liveContent);

        LiveNewsEvent event = new LiveNewsEvent();

        event.setId(saved.getId());
        event.setNewsId(saved.getNews().getId());
        event.setUserId(saved.getUser().getId());
        event.setContent((saved.getContent()));
        event.setContentType(saved.getContentType().name());
        event.setEntryStatus(saved.getEntryStatus().name());
        event.setMediaUrl(saved.getMediaUrl());
        event.setCreatedAt(LocalDateTime.now());
        System.out.println("Publishing event to Redis channel: " + LIVE_NEWS_CHANNEL);
        event.setAction("ADD_ENTRY");
        redisTemplate.convertAndSend(LIVE_NEWS_CHANNEL, event);


        return saved;

    }

    @Transactional
    public LiveContent updateContent(Long liveContentId, LiveNewsEvent dto) {
        try {


            LiveContent liveContent = liveContentRepository.findById(liveContentId)
                    .orElseThrow(() -> new RuntimeException("LỖI: Không tìm thấy entry: " + liveContentId));

            try{
                String url = liveContent.getMediaUrl();
                if (url != null && !url.isEmpty()) {
                    String resourceType = "image";
                    if (url.contains("/video/")) resourceType = "video";
                    else if (url.contains("/raw/")) resourceType = "raw";
                    String publicId = extractPublicIdFromUrl(url);
                    if (publicId != null) {
                        cloudinary.uploader().destroy(
                                publicId,
                                ObjectUtils.asMap("resource_type", resourceType, "invalidate", true)
                        );
                        System.out.println("Xóa ảnh live content thành công");
                    }
                    System.out.println("Có ảnh");
                } else {
                    System.out.println("Không ảnh");
                }


            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            String rawHtmlContent = dto.getContent();
            String content = Jsoup.clean(rawHtmlContent, Safelist.basicWithImages());

            liveContent.setContent(content);
            liveContent.setMediaUrl(dto.getMediaUrl());
            liveContent.setEntryStatus(LiveContent.EntryStatus.valueOf(dto.getEntryStatus()));
            liveContent.setContentType(LiveContent.ContentType.valueOf(dto.getContentType()));
            liveContent.setSortOrder(dto.getSortOrder());
            liveContent.setUpdatedAt(LocalDateTime.now());

            LiveContent updated = liveContentRepository.save(liveContent);

            LiveNewsEvent event = new LiveNewsEvent();
            event.setAction("UPDATE_ENTRY");
            event.setId(updated.getId());
            event.setNewsId(updated.getNews().getId());
            event.setUserId(updated.getUser().getId());
            event.setContent(updated.getContent());
            event.setContentType(updated.getContentType().name());
            event.setEntryStatus(updated.getEntryStatus().name());
            event.setMediaUrl(updated.getMediaUrl());
            event.setSortOrder(updated.getSortOrder());
            event.setCreatedAt(updated.getCreatedAt());
            event.setUpdatedAt(updated.getUpdatedAt());

            redisTemplate.convertAndSend(LIVE_NEWS_CHANNEL, event);

            return updated;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi đang update", e);
        }
    }



    @Transactional
    public void removeContent(Long newsId, Long liveContentId) {

        // 1. Tìm và kiểm tra bảo mật
        LiveContent liveContent = liveContentRepository.findById(liveContentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy LiveContent ID: " + liveContentId));

        if (!liveContent.getNews().getId().equals(newsId)) {
            throw new SecurityException("Hành động không được phép.");
        }
        try{
            String url = liveContent.getMediaUrl();
            if (url != null && !url.isEmpty()) {
                String resourceType = "image";
                if (url.contains("/video/")) resourceType = "video";
                else if (url.contains("/raw/")) resourceType = "raw";

                String publicId = extractPublicIdFromUrl(url); // đảm bảo trả về không kèm đuôi
                if (publicId != null) {
                    cloudinary.uploader().destroy(
                            publicId,
                            ObjectUtils.asMap("resource_type", resourceType, "invalidate", true)
                    );
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        liveContentRepository.delete(liveContent);

        LiveNewsEvent event = new LiveNewsEvent();
        event.setAction("REMOVE_ENTRY");
        event.setId(liveContentId);
        event.setNewsId(newsId);

        redisTemplate.convertAndSend(LIVE_NEWS_CHANNEL, event);
    }

    public LiveNewsEvent convertToLiveEvent(LiveContent liveContent){
        LiveNewsEvent newsEvent = new LiveNewsEvent();
        newsEvent.setId(liveContent.getId());
        newsEvent.setNewsId(liveContent.getNews().getId());
        newsEvent.setUserId(liveContent.getUser().getId());
        newsEvent.setContent(liveContent.getContent());
        newsEvent.setContentType(liveContent.getContentType().name());
        newsEvent.setEntryStatus(liveContent.getEntryStatus().name());
        newsEvent.setMediaUrl(liveContent.getMediaUrl());
        newsEvent.setSortOrder(liveContent.getSortOrder());
        newsEvent.setCreatedAt(liveContent.getCreatedAt());
        return newsEvent;
    }

    private String extractPublicIdFromUrl(String imageUrl) {
        Pattern pattern = Pattern.compile("/upload/(?:v\\d+/)?([^.]+?)(\\.\\w+)?$");
        Matcher matcher = pattern.matcher(imageUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }



}


