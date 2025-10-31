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
@RequestMapping("/api/admin/category")

public class AdminCategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private HelperService helperService;

    @GetMapping("/all")
    public List<Category> getAllCategory() {
        return categoryService.getAllCategory();
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> categoryData) {
        try {

            Category category = new Category();
            category.setName((String) categoryData.get("name"));
            category.setDescription((String) categoryData.get("description"));
            category.setSortOrder( Integer.valueOf(categoryData.get("sortOrder").toString()));
            category.setIsActive((Boolean) categoryData.get("isActive"));
            category.setSlug(helperService.toSlug(categoryData.get("name").toString()));

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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> categoryData) {
        try {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            category.setName((String) categoryData.get("name"));
            category.setDescription((String) categoryData.get("description"));
            category.setSortOrder(Integer.valueOf(categoryData.get("sortOrder").toString()));
            category.setIsActive((Boolean) categoryData.get("isActive"));

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


        if(!categoryRepository.existsById(id)){
            throw new RuntimeException("Category not found with id: " + id);
        }
        System.out.println(id);
        categoryRepository.deleteById(id);
        return "Category deleted successfully";
    }

    //bulk delete categories
    @DeleteMapping("/bulk")
    public ResponseEntity<?> bulkDeleteCategories(@RequestParam List<Long> categoryIds) {
        try {
            if (categoryIds == null || categoryIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Danh sách ID danh mục không được để trống"));
            }

            for (Long id : categoryIds) {
                if (categoryRepository.existsById(id)) {
                    categoryRepository.deleteById(id);
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa  danh mục thành công"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Lỗi khi xóa danh mục: " + e.getMessage()));
        }
    }
}
