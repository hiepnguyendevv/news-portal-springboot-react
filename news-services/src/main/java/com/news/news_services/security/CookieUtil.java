package com.news.news_services.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {
    @Value("${app.refreshCookieName}")
    private String refreshCookieName;

    @Value("${app.refreshCookiePath}")
    private String refreshCookiePath;

    @Value("${app.refreshCookieSecure}")
    private boolean refreshCookieSecure;

    @Value("${app.refreshExpirationMs}")
    private Long refreshExpirationMs;

    public ResponseCookie createRefreshCookie(String token){
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName,token)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .maxAge(refreshExpirationMs/1000)
                .path(refreshCookiePath)
                .sameSite("Lax")
                .build();
        System.out.println("Cookie được tạo: " + cookie.toString());
        return cookie;
    }

    public ResponseCookie clearRefreshCookie(){
        return ResponseCookie.from(refreshCookieName)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .maxAge(0)
                .path(refreshCookiePath)
                .sameSite("Lax")
                .build();
    }
}
