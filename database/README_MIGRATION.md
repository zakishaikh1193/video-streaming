# Migration: Recreate Videos Table

## Overview
This migration will DROP the existing `videos` table and create a new one WITHOUT the `activity` and `course` fields.

## ⚠️ WARNING
**THIS WILL DELETE ALL EXISTING VIDEO DATA!**

Make sure you have a backup before running this migration.

## Steps to Run Migration

1. **Backup your database** (if you have important data):
   ```sql
   mysqldump -u your_username -p video_delivery > backup_before_migration.sql
   ```

2. **Run the migration SQL file**:
   ```bash
   mysql -u your_username -p video_delivery < database/migration_recreate_videos_table.sql
   ```
   
   Or manually in MySQL:
   ```sql
   source database/migration_recreate_videos_table.sql;
   ```

3. **Verify the table structure**:
   ```sql
   DESCRIBE videos;
   ```

## New Table Structure

The new table includes:
- ✅ id
- ✅ video_id
- ✅ partner_id
- ✅ title
- ✅ subject (NO course field)
- ✅ grade
- ✅ unit
- ✅ lesson
- ✅ module
- ✅ topic (NO activity field)
- ✅ description
- ✅ language
- ✅ file_path
- ✅ streaming_url
- ✅ qr_url
- ✅ thumbnail_url
- ✅ redirect_slug
- ✅ duration
- ✅ size
- ✅ version
- ✅ status
- ✅ created_at
- ✅ updated_at

## Removed Fields
- ❌ `course` (removed - use `subject` instead)
- ❌ `activity` (removed)

## Backend Code Updates

The backend code has been updated to:
- Remove references to `course` and `activity` columns
- Map `course` to `subject` for backward compatibility in API responses
- Ensure dynamic column handling still works

## After Migration

1. Restart your backend server
2. Test uploading a new video
3. Verify that subject and module values are being saved correctly




