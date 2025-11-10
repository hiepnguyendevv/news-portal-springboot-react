package com.news.news_services.repository;

import com.news.news_services.entity.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findById(Long id);

    Optional<Tag> findByName(String name);

    List<Tag> findByNameContainingIgnoreCase(String name);

    @Query("SELECT t FROM Tag t JOIN t.newsTags nt WHERE nt.news.id = :newsId")
    List<Tag> findByNewsId(@Param("newsId") Long newsId);


    @Query("SELECT COUNT(nt) FROM NewsTag nt WHERE nt.tag.id = :tagId")
    Long countNewsByTagId(@Param("tagId") Long tagId);
}


