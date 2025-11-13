package com.news.news_services.config;

import com.news.news_services.security.JwtUtil;
import com.news.news_services.security.UserDetailServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            // Xử lý cho CONNECT, SEND, SUBSCRIBE commands
            if (StompCommand.CONNECT.equals(accessor.getCommand()) || 
                StompCommand.SEND.equals(accessor.getCommand()) ||
                StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                
                // Lấy JWT token từ headers
                String authToken = accessor.getFirstNativeHeader("Authorization");
                
                if (authToken != null && authToken.startsWith("Bearer ")) {
                    String token = authToken.substring(7);
                    
                    if (jwtUtil.validationJwtToken(token)) {
                        try {
                            String username = jwtUtil.getUserNameFromToken(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            accessor.setUser(authentication);
                        } catch (Exception e) {
                            System.err.println("Error setting WebSocket authentication: " + e.getMessage());
                        }
                    }
                }
            }
        }
        
        return message;
    }
}


