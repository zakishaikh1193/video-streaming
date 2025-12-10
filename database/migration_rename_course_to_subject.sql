-- Migration: Rename course column to subject
-- This migration renames the 'course' column to 'subject' in the videos table

USE video_delivery;

-- Check if course column exists and rename it to subject
-- MySQL doesn't support IF EXISTS for RENAME COLUMN, so we'll use a procedure
DELIMITER //
CREATE PROCEDURE RenameCourseToSubject()
BEGIN
    -- Check if course column exists
    IF EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'video_delivery' 
        AND TABLE_NAME = 'videos' 
        AND COLUMN_NAME = 'course'
    ) THEN
        -- Rename course column to subject
        ALTER TABLE videos CHANGE COLUMN course subject VARCHAR(255) NULL;
        
        -- Drop old index if exists
        ALTER TABLE videos DROP INDEX IF EXISTS idx_course;
        
        -- Add new index for subject
        ALTER TABLE videos ADD INDEX idx_subject (subject);
        
        SELECT 'Course column renamed to subject successfully' AS result;
    ELSE
        -- If course doesn't exist, check if subject already exists
        IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'video_delivery' 
            AND TABLE_NAME = 'videos' 
            AND COLUMN_NAME = 'subject'
        ) THEN
            -- Add subject column if it doesn't exist
            ALTER TABLE videos ADD COLUMN subject VARCHAR(255) NULL AFTER id;
            ALTER TABLE videos ADD INDEX idx_subject (subject);
            SELECT 'Subject column added successfully' AS result;
        ELSE
            SELECT 'Subject column already exists' AS result;
        END IF;
    END IF;
END //
DELIMITER ;

-- Execute the procedure
CALL RenameCourseToSubject();

-- Drop the procedure
DROP PROCEDURE IF EXISTS RenameCourseToSubject;


