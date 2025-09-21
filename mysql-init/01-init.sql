-- Create database if not exists
CREATE DATABASE IF NOT EXISTS news_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE news_database;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'news_user'@'%' IDENTIFIED BY 'news_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON news_database.* TO 'news_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;
