-- Test data import
INSERT IGNORE INTO user (username, email, password, full_name, role, status, created_at, updated_at) 
VALUES ('testuser', 'test@example.com', '$2b$12$72vtyxjPhvEAAoK02vTBIuvkXWlexBPDyP0vcTxI9SkE48zznyoJq', 'Test User', 'USER', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO categories (name, slug, description, is_active, level, parent_id, created_at, updated_at) 
VALUES ('Test Category', 'test-category', 'Test category description', 1, 0, NULL, NOW(), NOW());

