package com.news.news_services.service;

import com.news.news_services.entity.News;
import com.news.news_services.entity.NewsTag;
import com.news.news_services.entity.Tag;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.repository.NewsTagRepository;
import com.news.news_services.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TagService {
    @Autowired
    private TagRepository tagRepository;
    @Autowired
    private NewsTagRepository newsTagRepository;
    @Autowired
    private NewsRepository newsRepository;

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .trim();
    }

    public Tag createTag(String name, String description){
        Optional<Tag> existingTag = tagRepository.findByName(name);
        if(existingTag.isPresent()){
            return existingTag.get();
        }
        Tag tag = new Tag();
        tag.setName(name);
        tag.setSlug(generateSlug(name));
        tag.setDescription(description);
        tag.setCreateAt(Instant.now());
        return tagRepository.save(tag);
    }

    public Tag findOrCreateTag(String name){
        return tagRepository.findByName(name).orElseGet(() -> createTag(name,""));
    }

    @Transactional
    public void assignToNews(Long newsId,List<String> tagNames){
        if(tagNames == null || tagNames.isEmpty()){
            return;
        }
        
        //xóa tất cả tags cũ của news 
        newsTagRepository.deleteByNewsId(newsId);
        
        //thêm tags mới
        for(String tagName : tagNames){
            if(tagName != null && !tagName.trim().isEmpty()){
                Tag tag = findOrCreateTag(tagName);
                News news = newsRepository.findById(newsId)
                    .orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));
                
                NewsTag newsTag = new NewsTag();
                newsTag.setNews(news);
                newsTag.setTag(tag);
                newsTagRepository.save(newsTag);
            }
        }
    }
    public List<Tag> getAllTags(){
        return tagRepository.findAll();
    }

    public List<Tag> getTagByNewsId(Long newsId){
        return tagRepository.findByNewsId(newsId);
    }

    public List<Tag> searchTag(String name){
        return tagRepository.findByNameContainingIgnoreCase(name);
    }

    public void deleteTag(Long tagId){
        newsTagRepository.deleteByTagId(tagId);
        tagRepository.deleteById(tagId);
    }

    public Tag updateTag(Long tagId,String name,String description){
        Tag tag = tagRepository.findById(tagId).orElseThrow();
        tag.setName(name);
        tag.setDescription(description);
        tag.setSlug(generateSlug(name));
        tag.setUpdatedAt(Instant.now());
        return tagRepository.save(tag);
    }


}
