package com.news.news_services.service;

import com.news.news_services.dto.ExchangeTokenResponse;
import com.news.news_services.entity.RefreshToken;
import com.news.news_services.entity.User;
import com.news.news_services.repository.RefreshTokenRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${app.refreshExpirationMs}")
    private Long refreshExpirationMs;

    private String hashToken(String token){
        try{
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String generateNewToken(User user, String tokenFamily){
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        RefreshToken newToken = new RefreshToken();
        newToken.setUser(user);
        newToken.setTokenHash(tokenHash);
        newToken.setTokenFamily(tokenFamily);
        newToken.setExpiresAt(Instant.now().plusSeconds(refreshExpirationMs/1000));
        newToken.setRevoked(false);
        newToken.setCreatedAt(Instant.now());

        refreshTokenRepository.save(newToken);
        return rawToken;
    }

    @Transactional
    public void revokedRefreshToken(String rawToken){
        if(rawToken == null){
            return;
        }
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .ifPresent(
                        token ->{
                            token.setRevoked(true);
                            refreshTokenRepository.save(token);
                        }
                );
    }

    @Transactional(noRollbackFor = SecurityException.class)
    public ExchangeTokenResponse exchangRefreshToken(String oldRawToken){
        String oldHashToken = hashToken(oldRawToken);

        Optional<RefreshToken> rf = refreshTokenRepository.findByTokenHashAndRevokedFalse(oldHashToken);
        if(rf.isEmpty()){
            Optional<RefreshToken> revokedToken = refreshTokenRepository.findByTokenHash(oldHashToken);
            if(revokedToken.isPresent() && revokedToken.get().isRevoked()){
                System.out.println("Phát hiện tái sử dùng refresh token");
                refreshTokenRepository.revokeTokenFamily(revokedToken.get().getTokenFamily());

//                throw new SecurityException("Phát hiện tái sử dụng Refresh Token!");
            }
            System.out.println("Token không hợp lệ");
            throw new SecurityException("Refresh Token không hợp lệ!");

        }
        RefreshToken oldToken = rf.get();

        if(oldToken.getExpiresAt().isBefore(Instant.now())){
            oldToken.setRevoked(true);
            refreshTokenRepository.save(oldToken);
            throw new SecurityException("Refresh Token đã hết hạn!");
        }

        long secondsSinceCreation = Duration.between(oldToken.getCreatedAt(), Instant.now()).getSeconds();

        if (secondsSinceCreation < 15) {
            return new ExchangeTokenResponse(oldRawToken, oldToken.getUser());
        }

        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        User user = oldToken.getUser();

        String newRawToken = generateNewToken(oldToken.getUser(), oldToken.getTokenFamily());

        return new ExchangeTokenResponse(newRawToken,user);

    }

    public String createRefreshToken(User user){
        String tokenFamily = "family-" + UUID.randomUUID().toString();
        return generateNewToken(user,tokenFamily);
    }




}
