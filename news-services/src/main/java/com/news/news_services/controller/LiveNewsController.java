    package com.news.news_services.controller;
    
    import com.news.news_services.dto.LiveNewsEvent;
    import com.news.news_services.entity.LiveContent;
    import com.news.news_services.security.UserPrincipal;
    import com.news.news_services.service.LiveContentService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.data.domain.Page;    
    import org.springframework.data.domain.PageRequest;
    import org.springframework.data.domain.Pageable;
    import org.springframework.http.ResponseEntity;
    import org.springframework.messaging.handler.annotation.DestinationVariable;
    import org.springframework.messaging.handler.annotation.MessageMapping;
    import org.springframework.security.core.Authentication;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.stereotype.Controller;
    import org.springframework.web.bind.annotation.*;

    import java.util.Map;

    @RestController
    @RequestMapping("/api/live-content")
    public class        LiveNewsController {
        @Autowired
        LiveContentService liveContentService;
    
        @GetMapping("/news/{newsId}")
        public ResponseEntity<Page<LiveNewsEvent>> getLiveContent(@PathVariable Long newsId,
                                                @RequestParam(defaultValue = "0")int page,
                                                @RequestParam(defaultValue = "20")int size){
            Pageable pageable = PageRequest.of(page,size);
            Page<LiveNewsEvent> result = liveContentService.getLivedContent(newsId,pageable);
    
            return ResponseEntity.ok(result);
        }

        @MessageMapping("/live/{newsId}/deleteEntry")
        public void deleteEntry(@DestinationVariable Long newsId, LiveNewsEvent dto ) {


            try {
                liveContentService.removeContent(newsId, dto.getId());

            } catch (Exception e) {
                System.err.println("Lỗi khi xử lý REMOVE_ENTRY: " + e.getMessage());
                e.printStackTrace();
            }
        }
    
        @MessageMapping("/live/{newsId}/addEntry")
        public void addEntry(@DestinationVariable Long newsId, LiveNewsEvent dto,Authentication auth) {

            System.out.println("=== RECEIVED MESSAGE ===");
            System.out.println("NewsId: " + newsId);
            System.out.println("DTO: " + dto.getContent());
            System.out.println("mediaUrl: " + dto.getMediaUrl());


            try {
                Long userId = ((UserPrincipal)auth.getPrincipal()).getId();
                liveContentService.addContent(newsId, userId, dto);
                System.out.println("successfully processed message");
            } catch (Exception e) {
                System.err.println("Error processing message: " + e.getMessage());
                e.printStackTrace();
            }

        }

        @MessageMapping("/live/{newsId}/updateEntry")
        public void updateEntry(@DestinationVariable Long newsId, LiveNewsEvent dto) {
            Long liveContentId = dto.getId();



            try {

                liveContentService.updateContent(liveContentId, dto);

                System.out.println("Successfully update message");
            } catch (Exception e) {
                System.err.println("Error processing message: " + e.getMessage());
                e.printStackTrace();
            }
        }


    }
