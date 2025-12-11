-- Migration: Recreate videos table without 'activity' and 'course' fields
-- This will DROP the existing table and create a new one with the correct structure
-- WARNING: This will DELETE ALL EXISTING VIDEO DATA!

USE video_delivery;

-- Drop foreign key constraints first (if any)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the existing videos table
DROP TABLE IF EXISTS videos;

-- Create the new videos table with all required fields (excluding activity and course)
CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(100) NOT NULL UNIQUE,
  partner_id INT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NULL,
  grade VARCHAR(255) NULL,
  unit VARCHAR(255) NULL,
  lesson VARCHAR(255) NULL,
  module VARCHAR(255) NULL,
  topic VARCHAR(255) NULL,
  description TEXT NULL,
  language VARCHAR(10) DEFAULT 'en',
  file_path VARCHAR(500) NULL,
  streaming_url VARCHAR(500) NULL,
  qr_url VARCHAR(500) NULL,
  thumbnail_url VARCHAR(500) NULL,
  redirect_slug VARCHAR(100) NULL UNIQUE,
  duration INT DEFAULT 0 COMMENT 'Duration in seconds',
  size BIGINT DEFAULT 0 COMMENT 'File size in bytes',
  version DECIMAL(10, 1) DEFAULT 1.1,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_video_id (video_id),
  INDEX idx_subject (subject),
  INDEX idx_grade (grade),
  INDEX idx_unit (unit),
  INDEX idx_lesson (lesson),
  INDEX idx_module (module),
  INDEX idx_status (status),
  INDEX idx_redirect_slug (redirect_slug),
  INDEX idx_grade_unit_lesson (grade, unit, lesson)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify the table structure
DESCRIBE videos;

