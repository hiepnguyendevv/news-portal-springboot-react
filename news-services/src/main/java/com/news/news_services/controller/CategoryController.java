package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/category")
@CrossOrigin(origins = "http://localhost:3000")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<Category> getAllParent(){
        return categoryService.getAllParentIsNull();
    }

    
    @GetMapping("/slug/{slug}")
    public Optional<Category> getCategoryBySlug(@PathVariable String slug){

        Optional<Category> category = categoryService.getCategoryBySlug(slug);
        System.out.println("Found category: " + category.isPresent());
        return category;
    }
}
