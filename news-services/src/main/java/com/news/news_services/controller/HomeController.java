package com.news.news_services.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.security.Principal;

@RestController
public class HomeController {
    @RequestMapping
    public String home(){
        return "welcome";
    }
    @RequestMapping("/user")
    public Principal user(Principal user){
        return user;
    }

    @RequestMapping("/profile")
    public String  profile(Authentication authentication){
        OAuth2User auth2User = (OAuth2User) authentication.getPrincipal();
        String name = (String) auth2User.getAttributes().get("name");
        String email = (String) auth2User.getAttributes().get("email");
//        Map<String, Object> attributes = token.getPrincipal().getAttributes();

//        String name = (String) attributes.get("name");
//        String email =  (String) attributes.get("email");


        return "name - " + name +"----email: "+email+ "token";
    }

}
