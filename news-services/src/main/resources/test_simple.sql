-- Test SQL đơn giản
INSERT IGNORE INTO users (username, email, password, full_name, role, status, created_at, updated_at) VALUES 
('testuser', 'test@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Test User', 'USER', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO categories (name, slug, description, is_active, level, parent_id, created_at, updated_at) VALUES 
('Test Category', 'test-category', 'Test category description', 1, 0, NULL, NOW(), NOW());

INSERT IGNORE INTO news (title, slug, image_url, content, summary, category_id, author_id, published, status, created_at, updated_at, view_count, published_at, featured, is_realtime, live_start_time, live_end_time, review_note) VALUES
('Test News Title', 'test-news-title', 'https://example.com/image.jpg', 'This is test content for news article.', 'This is a test summary.', 
(SELECT id FROM categories WHERE slug = 'test-category' LIMIT 1), 
(SELECT id FROM users WHERE username = 'testuser' LIMIT 1), 
1, 'PUBLISHED', NOW(), NOW(), 0, NOW(), 0, 0, NULL, NULL, NULL);
