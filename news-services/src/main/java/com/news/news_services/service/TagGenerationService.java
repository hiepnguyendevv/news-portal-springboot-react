package com.news.news_services.service;

import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TagGenerationService {

    private static final int MAX_TAGS = 3;


    private static final double NGRAM_WEIGHT_POWER = 1.5;

    public List<String> generateTagsFromContent(String title, String contentHtml) {

        String cleanContent = Jsoup.parse(contentHtml).text();
        String titleBoost = (title + " ").repeat(4);
        String fullText = (titleBoost + cleanContent).toLowerCase();

        String normalizedText = fullText.replaceAll("[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\\s]", "");

        List<String> validWords = Arrays.stream(normalizedText.split("\\s+"))
                .filter(word -> word.length() > 2 && !VietnameseStopWords.STOP_WORDS.contains(word))
                .collect(Collectors.toList());


        List<String> allTerms = new ArrayList<>(validWords); // 1-grams
        for (int i = 0; i < validWords.size() - 1; i++) {
            allTerms.add(validWords.get(i) + " " + validWords.get(i + 1)); // 2-grams
        }
        for (int i = 0; i < validWords.size() - 2; i++) {
            allTerms.add(validWords.get(i) + " " + validWords.get(i + 1) + " " + validWords.get(i + 2)); // 3-grams
        }

        // Đếm tần suất
        Map<String, Long> termCounts = allTerms.stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        Map<String, Double> termScores = new HashMap<>();
        for (Map.Entry<String, Long> entry : termCounts.entrySet()) {
            String term = entry.getKey();
            long frequency = entry.getValue();
            int wordCount = term.split("\\s+").length; // Số lượng từ trong cụm (1, 2, hoặc 3)


            double score = (double) frequency * Math.pow(wordCount, NGRAM_WEIGHT_POWER);
            termScores.put(term, score);
        }

        List<String> sortedTopTags = termScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(MAX_TAGS * 3)
                .collect(Collectors.toList());


        List<String> finalTags = filterRedundantTags(sortedTopTags);

        return finalTags.stream().limit(MAX_TAGS).collect(Collectors.toList());
    }


    private List<String> filterRedundantTags(List<String> sortedTopTags) {
        List<String> finalTags = new ArrayList<>();

        for (String currentTag : sortedTopTags) {
            boolean isRedundant = false;

            for (String existingTag : finalTags) {

                if ((" " + existingTag + " ").contains(" " + currentTag + " ")) {
                    isRedundant = true;
                    break;
                }
            }

            if (!isRedundant) {
                finalTags.add(currentTag);
            }
        }


        List<String> cleanedList = new ArrayList<>(finalTags);
        for(String tagA : finalTags){
            for(String tagB : finalTags){
                if(!tagA.equals(tagB) && (" " + tagA + " ").contains(" " + tagB + " ")){
                    cleanedList.remove(tagB);
                }
            }
        }

        return cleanedList;
    }
}