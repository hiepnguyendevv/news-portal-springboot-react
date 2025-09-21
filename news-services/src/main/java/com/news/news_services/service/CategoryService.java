package com.news.news_services.service;

import com.news.news_services.entity.Category;
import com.news.news_services.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
public class CategoryService {
    @Autowired
    CategoryRepository categoryRepository;

    public List<Category> getAllParentIsNull(){
        return categoryRepository.findByParentIsNullAndIsActiveTrueOrderBySortOrder();
    }


    public List<Category> getAllCategory(){
        return categoryRepository.findAll();
    }
    
    public Optional<Category> getCategoryBySlug(String slug){
        return categoryRepository.findBySlugAndIsActiveTrue(slug);
    }

    // Lấy subcategories theo parent slug
    public List<Category> getSubcategoriesByParentSlug(String parentSlug) {
        Optional<Category> parent = categoryRepository.findBySlugAndIsActiveTrue(parentSlug);
        if (parent.isPresent()) {
            return categoryRepository.findByParentAndIsActiveTrueOrderBySortOrder(parent.get());
        }
        return List.of();
    }

    public List<Category> getAllActiveCategories() {
        return categoryRepository.findAllActiveOrderBySortAndLevel();
    }
}
