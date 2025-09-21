package com.news.news_services.controller;

import com.news.news_services.entity.Category;
import com.news.news_services.repository.CategoryRepository;
import com.news.news_services.repository.NewsRepository;
import com.news.news_services.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/category")
@CrossOrigin(origins = "http://localhost:3000")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NewsRepository newsRepository;

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

    // Lấy subcategories theo parent slug
    @GetMapping("/subcategories/{parentSlug}")
    public List<Category> getSubcategoriesByParent(@PathVariable String parentSlug) {
        return categoryService.getSubcategoriesByParentSlug(parentSlug);
    }

    // Lấy tất cả categories
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
    // 🔧 Add CREATE endpoint
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> categoryData) {
        try {

            Category category = new Category();
            category.setName((String) categoryData.get("name"));
            category.setDescription((String) categoryData.get("description"));
            category.setSortOrder( Integer.valueOf(categoryData.get("sortOrder").toString()));
            category.setIsActive((Boolean) categoryData.get("isActive"));

            // Handle parent if provided
            Object parentIdObj = categoryData.get("parentId");
            if (parentIdObj != null && !parentIdObj.toString().isEmpty()) {
                Long parentId = Long.parseLong(parentIdObj.toString());
                Category parent = categoryRepository.findById(parentId)
                        .orElseThrow(() -> new RuntimeException("Parent category not found"));
                category.setParent(parent);
            }

            Category saved = categoryRepository.save(category);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi tạo danh mục: " + e.getMessage()));
        }
    }

    // 🔧 Add UPDATE endpoint
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> categoryData) {
        try {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            category.setName((String) categoryData.get("name"));
            category.setDescription((String) categoryData.get("description"));
            category.setSortOrder(Integer.valueOf(categoryData.get("sortOrder").toString()));
            category.setIsActive((Boolean) categoryData.get("isActive"));

            // Handle parent update
            Object parentIdObj = categoryData.get("parentId");
            if (parentIdObj != null && !parentIdObj.toString().isEmpty()) {
                Long parentId = Long.parseLong(parentIdObj.toString());
                Category parent = categoryRepository.findById(parentId)
                        .orElseThrow(() -> new RuntimeException("Parent category not found"));
                category.setParent(parent);
            } else {
                category.setParent(null);
            }

            Category updated = categoryRepository.save(category);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lỗi khi cập nhật danh mục: " + e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    String deleteCategory(@PathVariable Long id) {

//        Long categoryId = Long.parseLong(id);

        if(!categoryRepository.existsById(id)){
            throw new RuntimeException("Category not found with id: " + id);
        }
        System.out.println(id);
        categoryRepository.deleteById(id);
        return "Category deleted successfully";
    }
}
