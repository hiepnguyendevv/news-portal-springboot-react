package com.news.news_services.repository;

import com.news.news_services.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);
    List<RefreshToken> findAllByUserId(Long userId);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.tokenFamily = ?1")
    void revokeTokenFamily(String tokenFamily);
}
