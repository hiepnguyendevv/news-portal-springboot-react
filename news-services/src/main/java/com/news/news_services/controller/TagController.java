package com.news.news_services.controller;

import com.news.news_services.entity.Tag;
import com.news.news_services.repository.TagRepository;
import com.news.news_services.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    @Autowired
    private TagService tagService;
    @Autowired
    private TagRepository tagRepository;
    @GetMapping
    public ResponseEntity<List<Tag>> getAllTags(){
        try{
            List<Tag> tags = tagService.getAllTags();
            return ResponseEntity.ok(tags);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }

    }

    @PostMapping
    public ResponseEntity<?> createTag(@RequestBody Map<String,String> request){
        try{
            String name = request.get("name");
            String description = request.get("description");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tag name is required"));
            }
            tagService.createTag(name,description);
            return ResponseEntity.ok(Map.of("message", "tag created"));

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTag(@PathVariable Long id){
        try{
            tagService.deleteTag(id);
            return ResponseEntity.ok(Map.of("message", "tag deleted"));
        }catch(Exception e){
            return ResponseEntity.badRequest().build();

        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTag(@PathVariable Long id, @RequestBody Map<String,String> request){
        try{
            tagService.updateTag(id, request.get("name"), request.get("description"));
            return ResponseEntity.ok(Map.of("message",   "tag updated"));
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }



}
