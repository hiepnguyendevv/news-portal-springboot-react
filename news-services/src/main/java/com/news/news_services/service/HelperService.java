package com.news.news_services.service;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class HelperService {
    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public String toSlug(String input) {
        // Handle null or empty input
        if (input == null || input.trim().isEmpty()) {
            return "";
        }

        String noWhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
