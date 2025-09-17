package com.news.news_services.repository;

import com.news.news_services.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{


    //Tìm danh mục gốc
    List<Category> findByParentIsNullAndIsActiveTrueOrderBySortOrder();

    //Tìm danh mục con theo parent
    List<Category> findByParentAndIsActiveTrueOrderBySortOrder(Category parent);

    //Tìm theo slug
    Optional<Category> findBySlugAndIsActiveTrue(String slug);

    //Tìm theo level
    List<Category> findByLevelAndIsActiveTrueOrderBySortOrder(Integer level);

    //lấy toàn bộ
    @Query("select c from Category c where c.isActive = true order by c.level, c.sortOrder")
    List<Category> findAllActiveOrderBySortAndLevel();

    //Đếm số danh mục con theo mục cha
//    Long countByParentAndIsActiveTrue(Category parent);

    //Tìm theo tên
    List<Category> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);

    Optional<Category> findByName(String name);

}
