-- Migration: Add unit column to videos table if it doesn't exist
-- Run this to ensure unit column exists for storing unit information

USE video_delivery;

-- Add unit column (will fail if already exists, but that's okay)
-- Run this migration to ensure unit column exists
ALTER TABLE videos 
  ADD COLUMN unit VARCHAR(255) NULL AFTER grade;

-- Add index for unit column (will fail if already exists, but that's okay)
ALTER TABLE videos 
  ADD INDEX idx_unit (unit);

