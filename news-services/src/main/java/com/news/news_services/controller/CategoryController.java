package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.service.CategoryService;
import com.news.news_services.service.HelperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/category")
// @CrossOrigin(origins = "http://localhost:3000")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private HelperService helperService;

    @GetMapping
    public List<Category> getAllParent(){
        return categoryService.getAllParentIsNull();
    }

    Long getCountNewsInCategory(Long categoryId){
        return newsRepository.countByCategoryId(categoryId);
    }
    
    @GetMapping("/slug/{slug}")
    public Optional<Category> getCategoryBySlug(@PathVariable String slug){

        Optional<Category> category = categoryService.getCategoryBySlug(slug);
        System.out.println("Found category: " + category.isPresent());
        return category;
    }

    //lấy subcategories theo parent slug
    @GetMapping("/subcategories/{parentSlug}")
    public List<Category> getSubcategoriesByParent(@PathVariable String parentSlug) {
        return categoryService.getSubcategoriesByParentSlug(parentSlug);
    }

    //lấy tất cả categories
    @GetMapping("/all/active")
    public List<Category> getAllCategoriesIsActive() {
        return categoryService.getAllActiveCategories();
    }
    @GetMapping("/all")
    public List<Category> getAllCategory() {
        return categoryService.getAllCategory();
    }

    @GetMapping("/{id}")
    public Optional<Category> getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id);
    }

}
