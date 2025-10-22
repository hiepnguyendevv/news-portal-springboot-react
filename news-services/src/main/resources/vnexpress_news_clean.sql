-- PHẦN 1: TẠO CÁC USER
-- ----------------------------------------------------

INSERT IGNORE INTO users (username, email, password, full_name, role, status, created_at, updated_at) VALUES 
('giachinhvothanhnguyenong', 'giachinhvothanhnguyenong@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Gia Chính Võ Thành Nguyên Ông', 'USER', 'ACTIVE', NOW(), NOW()),
('sonha', 'sonha@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Sơn Hà', 'USER', 'ACTIVE', NOW(), NOW()),
('letan', 'letan@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Lê Tân', 'USER', 'ACTIVE', NOW(), NOW()),
('nguyenongvothanh', 'nguyenongvothanh@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Nguyên Ông Võ Thành', 'USER', 'ACTIVE', NOW(), NOW()),
('nguyenong', 'nguyenong@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Nguyên Ông', 'USER', 'ACTIVE', NOW(), NOW()),
('oanloan', 'oanloan@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Oan Loan', 'USER', 'ACTIVE', NOW(), NOW()),
('nguyentien', 'nguyentien@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Nguyễn Tiến', 'USER', 'ACTIVE', NOW(), NOW()),
('huyenle', 'huyenle@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Huyền Lê', 'USER', 'ACTIVE', NOW(), NOW()),
('nhutam', 'nhutam@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Như Tâm', 'USER', 'ACTIVE', NOW(), NOW()),
('uctrung', 'uctrung@vnexpress.net', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'Úc Trung', 'USER', 'ACTIVE', NOW(), NOW());

-- PHẦN 2: TẠO CÁC DANH MỤC (CATEGORIES)
-- ----------------------------------------------------

-- Tạo danh mục cha
INSERT IGNORE INTO categories (name, slug, description, is_active, level, parent_id, created_at, updated_at) VALUES 
('Thời sự', 'thoi-su', 'Tin tức thuộc danh mục Thời sự', 1, 0, NULL, NOW(), NOW()),
('Thế giới', 'the-gioi', 'Tin tức thuộc danh mục Thế giới', 1, 0, NULL, NOW(), NOW());

-- Tạo danh mục con
INSERT IGNORE INTO categories (name, slug, description, is_active, level, parent_id, created_at, updated_at) VALUES 
('Chính trị', 'thoi-su-chinh-tri', 'Tin tức thuộc danh mục Chính trị', 1, 1, (SELECT id FROM categories WHERE slug = 'thoi-su' LIMIT 1), NOW(), NOW()),
('Giao thông', 'thoi-su-giao-thong', 'Tin tức thuộc danh mục Giao thông', 1, 1, (SELECT id FROM categories WHERE slug = 'thoi-su' LIMIT 1), NOW(), NOW()),
('Tư liệu', 'the-gioi-tu-lieu', 'Tin tức thuộc danh mục Tư liệu', 1, 1, (SELECT id FROM categories WHERE slug = 'the-gioi' LIMIT 1), NOW(), NOW()),
('Phân tích', 'the-gioi-phan-tich', 'Tin tức thuộc danh mục Phân tích', 1, 1, (SELECT id FROM categories WHERE slug = 'the-gioi' LIMIT 1), NOW(), NOW());

-- PHẦN 3: TẠO CÁC TAG
-- ----------------------------------------------------

INSERT IGNORE INTO tags (name, slug, description, created_at, updated_at) VALUES 
('Bão lũ', 'bao-lu', 'Tag liên quan đến bão lũ, thiên tai', NOW(), NOW()),
('Chính trị', 'chinh-tri', 'Tag liên quan đến chính trị, quốc hội', NOW(), NOW()),
('Giao thông', 'giao-thong', 'Tag liên quan đến giao thông, vận tải', NOW(), NOW()),
('Kinh tế', 'kinh-te', 'Tag liên quan đến kinh tế, thị trường', NOW(), NOW()),
('Quốc tế', 'quoc-te', 'Tag liên quan đến các vấn đề quốc tế', NOW(), NOW()),
('An ninh', 'an-ninh', 'Tag liên quan đến an ninh, quốc phòng', NOW(), NOW()),
('Giáo dục', 'giao-duc', 'Tag liên quan đến giáo dục, đào tạo', NOW(), NOW()),
('Y tế', 'y-te', 'Tag liên quan đến y tế, sức khỏe', NOW(), NOW()),
('Công nghệ', 'cong-nghe', 'Tag liên quan đến công nghệ, kỹ thuật', NOW(), NOW()),
('Thể thao', 'the-thao', 'Tag liên quan đến thể thao, thể dục', NOW(), NOW()),
('Văn hóa', 'van-hoa', 'Tag liên quan đến văn hóa, nghệ thuật', NOW(), NOW()),
('Môi trường', 'moi-truong', 'Tag liên quan đến môi trường, khí hậu', NOW(), NOW()),
('Du lịch', 'du-lich', 'Tag liên quan đến du lịch, khám phá', NOW(), NOW()),
('Nông nghiệp', 'nong-nghiep', 'Tag liên quan đến nông nghiệp, nông thôn', NOW(), NOW()),
('Xã hội', 'xa-hoi', 'Tag liên quan đến các vấn đề xã hội', NOW(), NOW()),
('Pháp luật', 'phap-luat', 'Tag liên quan đến pháp luật, tư pháp', NOW(), NOW());

-- PHẦN 4: TẠO CÁC BÀI VIẾT (NEWS)
-- ----------------------------------------------------

INSERT IGNORE INTO news (title, slug, image_url, content, summary, category_id, author_id, published, status, created_at, updated_at, view_count, published_at, featured, is_realtime, live_start_time, live_end_time, review_note) VALUES
('Miền Trung mưa lớn từ trưa nay', 'mien-trung-mua-lon-tu-trua-nay', 'https://i1-vnexpress.vnecdn.net/2025/10/22/Anh-chup-Man-hinh-2025-10-22-l-7224-3538-1761088437.png?w=680&h=0&q=100&dpr=1&fit=crop&s=kFM54UnQVzsaHaXLwK1uog', 'Trung tâm Dự báo Khí tượng Thủy văn quốc gia cho biết lúc 6h hôm nay, tâm bão Fengshen cách Đà Nẵng khoảng 280 km về phía đông đông bắc, sức gió mạnh nhất 102 km/h, cấp 10, giật cấp 12 và đang theo hướng tây tây nam với tốc độ 10 km/h.', 'Bão Fengshen còn cách đất liền Trung Trung Bộ hơn 200 km, song hoàn lưu trước bão kết hợp với không khí lạnh, gió đông và yếu tố địa hình gây mưa lớn từ trưa nay.', (SELECT id FROM categories WHERE slug = 'thoi-su' LIMIT 1), (SELECT id FROM users WHERE username = 'giachinhvothanhnguyenong' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Hôm nay Quốc hội xem xét sửa ba luật về giáo dục', 'hom-nay-quoc-hoi-xem-xet-sua-ba-luat-ve-giao-duc', 'https://i1-vnexpress.vnecdn.net/2025/10/22/202411201137445300-z6050966923-3825-4067-1761089821.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=jonVLAImdCqnTH0eNR6_ww', 'VớiLuật Giáo dục, dự thảo tập trung hoàn thiện hệ thống giáo dục quốc dân theo hướng mở, linh hoạt và liên thông, đáp ứng yêu cầu học tập suốt đời.', 'Sáng 22/10, Bộ trưởng Giáo dục và Đào tạo Nguyễn Kim Sơn trình Quốc hội ba dự thảo luật sửa đổi gồm Giáo dục, Giáo dục đại học và Giáo dục nghề nghiệp.', (SELECT id FROM categories WHERE slug = 'thoi-su-chinh-tri' LIMIT 1), (SELECT id FROM users WHERE username = 'sonha' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Người đưa củ sắn dây thành thương hiệu tỷ đồng', 'nguoi-dua-cu-san-day-thanh-thuong-hieu-ty-dong', 'https://i1-vnexpress.vnecdn.net/2025/10/21/z7139458816941-e45c57e8a9c34ee-9062-5754-1761019245.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=7FZAtsOvvyX4z_AbN3Ptjg', 'Ông Bùi Văn Thành, 56 tuổi, sinh ra trong gia đình thuần nông ở vùng Thượng Quận, thị xã Kinh Môn cũ (nay là phường Trần Liễu, TP Hải Phòng), nơi vốn có truyền thống trồng sắn dây.', 'Hải PhòngTừ cây sắn dây quen thuộc của quê hương, ông Bùi Văn Thành đã gây dựng thành sản phẩm OCOP 4 sao, doanh thu hàng tỷ đồng mỗi năm.', (SELECT id FROM categories WHERE slug = 'thoi-su-giao-thong' LIMIT 1), (SELECT id FROM users WHERE username = 'letan' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Bọc kín ôtô bằng vải bạt tránh ngập lụt', 'boc-kin-oto-bang-vai-bat-tranh-ngap-lut', 'https://i1-vnexpress.vnecdn.net/2025/10/21/VNE3061-JPG-1761061100-4055-1761061342.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=CjqDhLuNmozRNjJK6MkxSg', 'Chiều 21/10, anh Trần Thanh Nguyên, 34 tuổi, mua tấm bạt kích cỡ lớn nhất về trải ra giữa phòng khách ngôi nhà ba tầng số 107 đường Mẹ Nhu, phường Thanh Khê, sau đó lùi chiếc BMW 320i mới mua vào chính giữa.', 'Học kinh nghiệm từ người dân vùng lũ Thái Nguyên, anh Thanh Nguyên ở Đà Nẵng dùng tấm bạt 6x12 m bọc kín chiếc BMW 320i đặt trong phòng khách.', (SELECT id FROM categories WHERE slug = 'thoi-su' LIMIT 1), (SELECT id FROM users WHERE username = 'nguyenongvothanh' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Trưởng thôn bị gấu hoang dã tấn công', 'truong-thon-bi-gau-hoang-da-tan-cong', 'https://i1-vnexpress.vnecdn.net/2025/10/21/25f7cc7b42a2cffc96b3-176105584-2332-6860-1761055993.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=KAGtah3xfaNYhSlpAERGeA', 'Khoảng 18h30 ngày 21/10, một số người dân phát hiện ông Nhương, người dân tộc Cơ Tu, nằm bên đường, trên người có nhiều vết thương nghi do động vật hoang dã cắn nên đã khiêng về thôn sơ cứu.', 'Đà NẵngÔng Pơloong Nhương, 48 tuổi, Trưởng thôn A Tu 1, xã Hùng Sơn trên đường đi làm rẫy về bị con gấu ở rừng gần biên giới Lào tấn công vùng mặt, cổ.', (SELECT id FROM categories WHERE slug = 'thoi-su-chinh-tri' LIMIT 1), (SELECT id FROM users WHERE username = 'nguyenong' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Người học lái xe có thể được xác thực điện tử để chống gian lận', 'nguoi-hoc-lai-xe-co-the-duoc-xac-thuc-dien-tu-de-chong-gian-lan', 'https://i1-vnexpress.vnecdn.net/2025/10/21/2-5974-1761021978.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=626iWfGBk8cZ0ScgW3M02w', 'Bộ Xây dựng đang lấy ý kiến dự thảo văn bản sửa đổi Nghị định 160/2024 quy định về hoạt động đào tạo và sát hạch giấy phép lái xe.', 'Bộ Xây dựng đề xuất lắp hệ thống ứng dụng định danh và xác thực điện tử tại các cơ sở đào tạo, sát hạch lái xe để nhận diện học viên, tránh gian lận và đồng bộ cơ sở dữ liệu cá nhân.', (SELECT id FROM categories WHERE slug = 'thoi-su-giao-thong' LIMIT 1), (SELECT id FROM users WHERE username = 'oanloan' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Drone quân sự Mỹ trục trặc vì trời nóng, hơi nước biển', 'drone-quan-su-my-truc-trac-vi-troi-nong-hoi-nuoc-bien', 'https://i1-vnexpress.vnecdn.net/2025/10/21/5563187178137268905a-drone-My-4456-4808-1761039785.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=6YUd0rRH-BYnyO0pKqgEAA', '"Một số mẫu thiết bị bay không người lái (drone) từng thử nghiệm tại nơi khác đã gặp trục trặc khi hoạt động tại Hawaii.', 'Binh sĩ Mỹ cho biết một số nguyên mẫu drone, UAV gặp trục trặc vì trời nóng và hơi muối khi thử nghiệm tại Hawaii.', (SELECT id FROM categories WHERE slug = 'the-gioi' LIMIT 1), (SELECT id FROM users WHERE username = 'nguyentien' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

("Phu nhân Tổng Bí thư trao tặng 'Tủ sách tiếng Việt' cho thư viện Phần Lan", 'phu-nhan-tong-bi-thu-trao-tang-tu-sach-tieng-viet-cho-thu-vien-phan-lan', 'https://i1-vnexpress.vnecdn.net/2025/10/22/phu-nhan-ngo-phuong-ly-jpeg-17-4613-7791-1761091170.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=u6j1pAFfbMZBzgUVceFs-Q', 'Bà Ngô Phương Ly cùng phu nhân Tổng thống Phần Lan Suzanne Innes-Stubb hôm 21/10 tham quan các khu vực trưng bày, không gian đọc, khu "Thiên đường sách" (Book Heaven), chiếu phim, triển lãm nghệ thuật, hội thảo...', 'Phu nhân Tổng Bí thư, bà Ngô Phương Ly, thăm Thư viện Trung tâm Oodi tại thủ đô Helsinki và trao tặng "Tủ sách tiếng Việt".', (SELECT id FROM categories WHERE slug = 'the-gioi-tu-lieu' LIMIT 1), (SELECT id FROM users WHERE username = 'huyenle' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL),

('Bảo tàng Louvre mất lượng trang sức hơn 100 triệu USD', 'bao-tang-louvre-mat-luong-trang-suc-hon-100-trieu-usd', 'https://i1-vnexpress.vnecdn.net/2025/10/22/5563187178137269004a-Louvre-17-4602-9842-1761090486.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=hxZsQHE6cRaL726hX9CX9A', '"Người phụ trách bảo tàng Louvre ước tính thiệt hại lên tới 88 triệu euro (khoảng 102 triệu USD).', 'Công tố viên Pháp cho biết nhóm cướp lấy đi lượng trang sức trị giá hơn 100 triệu USD tại bảo tàng Louvre trong vòng 7 phút.', (SELECT id FROM categories WHERE slug = 'the-gioi-phan-tich' LIMIT 1), (SELECT id FROM users WHERE username = 'nguyentien' LIMIT 1), 1, 'PUBLISHED', NOW(), NOW(), 1, NOW(), 0, 0, NULL, NULL, NULL);

-- PHẦN 5: TẠO CÁC NEWS_TAGS
-- ----------------------------------------------------

INSERT IGNORE INTO news_tags (news_id, tag_id) VALUES
((SELECT id FROM news WHERE slug = 'mien-trung-mua-lon-tu-trua-nay' LIMIT 1), (SELECT id FROM tags WHERE slug = 'bao-lu' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'mien-trung-mua-lon-tu-trua-nay' LIMIT 1), (SELECT id FROM tags WHERE slug = 'moi-truong' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'hom-nay-quoc-hoi-xem-xet-sua-ba-luat-ve-giao-duc' LIMIT 1), (SELECT id FROM tags WHERE slug = 'chinh-tri' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'hom-nay-quoc-hoi-xem-xet-sua-ba-luat-ve-giao-duc' LIMIT 1), (SELECT id FROM tags WHERE slug = 'giao-duc' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'nguoi-dua-cu-san-day-thanh-thuong-hieu-ty-dong' LIMIT 1), (SELECT id FROM tags WHERE slug = 'kinh-te' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'nguoi-dua-cu-san-day-thanh-thuong-hieu-ty-dong' LIMIT 1), (SELECT id FROM tags WHERE slug = 'nong-nghiep' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'boc-kin-oto-bang-vai-bat-tranh-ngap-lut' LIMIT 1), (SELECT id FROM tags WHERE slug = 'bao-lu' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'boc-kin-oto-bang-vai-bat-tranh-ngap-lut' LIMIT 1), (SELECT id FROM tags WHERE slug = 'giao-thong' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'truong-thon-bi-gau-hoang-da-tan-cong' LIMIT 1), (SELECT id FROM tags WHERE slug = 'xa-hoi' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'nguoi-hoc-lai-xe-co-the-duoc-xac-thuc-dien-tu-de-chong-gian-lan' LIMIT 1), (SELECT id FROM tags WHERE slug = 'giao-thong' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'nguoi-hoc-lai-xe-co-the-duoc-xac-thuc-dien-tu-de-chong-gian-lan' LIMIT 1), (SELECT id FROM tags WHERE slug = 'cong-nghe' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'drone-quan-su-my-truc-trac-vi-troi-nong-hoi-nuoc-bien' LIMIT 1), (SELECT id FROM tags WHERE slug = 'quoc-te' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'drone-quan-su-my-truc-trac-vi-troi-nong-hoi-nuoc-bien' LIMIT 1), (SELECT id FROM tags WHERE slug = 'cong-nghe' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'phu-nhan-tong-bi-thu-trao-tang-tu-sach-tieng-viet-cho-thu-vien-phan-lan' LIMIT 1), (SELECT id FROM tags WHERE slug = 'quoc-te' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'phu-nhan-tong-bi-thu-trao-tang-tu-sach-tieng-viet-cho-thu-vien-phan-lan' LIMIT 1), (SELECT id FROM tags WHERE slug = 'van-hoa' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'bao-tang-louvre-mat-luong-trang-suc-hon-100-trieu-usd' LIMIT 1), (SELECT id FROM tags WHERE slug = 'quoc-te' LIMIT 1)),
((SELECT id FROM news WHERE slug = 'bao-tang-louvre-mat-luong-trang-suc-hon-100-trieu-usd' LIMIT 1), (SELECT id FROM tags WHERE slug = 'van-hoa' LIMIT 1));
