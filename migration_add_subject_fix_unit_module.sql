-- Migration script to fix videos table schema
-- Issues to fix:
-- 1. Add 'subject' column (currently missing)
-- 2. Change 'unit' from INT NOT NULL to VARCHAR(255) NULL (to store text values, not just numbers)
-- 3. Ensure 'module' properly stores values (already VARCHAR, but ensure it works correctly)

-- Step 1: Add 'subject' column after 'course'
ALTER TABLE `videos` 
ADD COLUMN `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL 
AFTER `course`;

-- Step 2: Change 'unit' from INT NOT NULL to VARCHAR(255) NULL
-- First, we need to convert existing data
-- If there are existing integer values, we'll convert them to strings
ALTER TABLE `videos` 
MODIFY COLUMN `unit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Step 3: Add index for 'subject' column for better query performance
ALTER TABLE `videos` 
ADD INDEX `idx_subject` (`subject`);

-- Step 4: Update existing records to set subject = course (for backward compatibility)
-- This ensures existing data has subject populated
UPDATE `videos` 
SET `subject` = `course` 
WHERE `subject` IS NULL AND `course` IS NOT NULL;

-- Verification queries (run these to check the changes):
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'videos' 
-- AND COLUMN_NAME IN ('subject', 'unit', 'module', 'course')
-- ORDER BY ORDINAL_POSITION;





