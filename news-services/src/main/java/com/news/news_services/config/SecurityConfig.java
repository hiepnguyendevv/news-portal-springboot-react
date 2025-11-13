package com.news.news_services.config;

import com.news.news_services.security.AuthEntryPointJwt;
import com.news.news_services.security.JwtAuthenticationFilter;
import com.news.news_services.security.UserDetailServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import com.news.news_services.security.OAuth2LoginSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    UserDetailServiceImpl userDetailService;
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    private AuthEntryPointJwt authEntryPointJwt;


    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }



    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "https://hiepnguyen.click", 
            "https://www.hiepnguyen.click",
            "http://150.95.109.169:3000",
            "http://150.95.109.169",
            "http://hiepnguyen.click",
                "http://localhost:3001"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true); 

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(authEntryPointJwt)
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth ->
                        auth
                                .requestMatchers("/").permitAll()
                                .requestMatchers("/login").permitAll()
                                .requestMatchers("/oauth2/**").permitAll()
                                .requestMatchers("/api/oauth2/**").permitAll()
                                .requestMatchers("/api/auth/signin").permitAll()
                                .requestMatchers("/api/auth/signup").permitAll()
                                .requestMatchers("/api/auth/refresh").permitAll() // Phải đặt TRƯỚC /api/auth/**
                                .requestMatchers("/api/tags/**").permitAll()
                                .requestMatchers("/api/news/test").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/live-content/**").permitAll()
                                .requestMatchers("/api/category/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/news/create").hasRole("USER")
                                .requestMatchers(HttpMethod.POST, "/api/media/upload").authenticated() // Upload media cho TinyMCE
                                .requestMatchers(HttpMethod.POST, "/api/media/upload-news").authenticated()
                                .requestMatchers("/api/news/my-news/**").authenticated()
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .requestMatchers("/ws/**").permitAll()
//                                .requestMatchers("/api/auth/**").authenticated() // Các endpoint /api/auth khác cần auth
                                .anyRequest().authenticated()
                        )
                .oauth2Login(oauth2 -> {
                    oauth2.loginPage("/login")
                            .successHandler(oAuth2LoginSuccessHandler)
                            .failureUrl("https://hiepnguyen.click/login?error=fail");
                });

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

}
