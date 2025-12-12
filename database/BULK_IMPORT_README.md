# Bulk Video Import Guide

This guide explains how to import 288 videos from the CSV file into your database.

## Prerequisites

1. **CSV File**: `ICTVideosList.csv` with video metadata
2. **Video Files**: All video files should be in `backend/upload/` folder
3. **QR Codes**: All QR code images should be in `qr-codes/` folder (named as `VID_XXXXXXXXXX.png`)

## Step 1: Prepare the CSV File

Copy your `ICTVideosList.csv` file to one of these locations:
- Project root: `ICTVideosList.csv`
- Or provide the full path when running the script

## Step 2: Generate SQL Dump

Run the script to generate the SQL dump:

```bash
cd backend/scripts
node generateBulkVideoSQL.js "path/to/ICTVideosList.csv"
```

Or if the CSV is in the project root:

```bash
cd backend/scripts
node generateBulkVideoSQL.js "../../ICTVideosList.csv"
```

The script will generate `bulk_videos_import.sql` in the project root.

## Step 3: Review the SQL File

Before importing, review the generated SQL file to ensure:
- All video IDs are unique (format: `VID_XXXXXXXXXX`)
- All redirect slugs are unique (10 characters)
- File paths are correct (`upload/filename.mp4`)
- QR code paths are correct (`/qr-codes/VID_XXXXXXXXXX.png`)

## Step 4: Import to Database

### Option A: Using MySQL Command Line

```bash
mysql -u your_username -p video_delivery < bulk_videos_import.sql
```

### Option B: Using phpMyAdmin

1. Open phpMyAdmin
2. Select `video_delivery` database
3. Go to "Import" tab
4. Choose the `bulk_videos_import.sql` file
5. Click "Go"

### Option C: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. File → Open SQL Script → Select `bulk_videos_import.sql`
4. Execute the script

## Step 5: Verify Import

After importing, verify the videos:

```sql
SELECT COUNT(*) FROM videos WHERE subject = 'ICT';
-- Should return 288 (or your total count)

SELECT video_id, title, grade, unit, lesson, redirect_slug 
FROM videos 
WHERE subject = 'ICT' 
LIMIT 10;
```

## Important Notes

1. **Video Files**: Make sure all video files are copied to `backend/upload/` folder with the exact filenames from the CSV
2. **QR Codes**: QR code images should be in `qr-codes/` folder, named as `VID_XXXXXXXXXX.png` (matching the generated video_id)
3. **File Paths**: The SQL uses relative paths (`upload/filename.mp4`). Ensure your backend serves files from the `upload/` directory
4. **Streaming URLs**: The SQL uses `http://localhost:5000` as the base URL. Update this in the SQL file if your production URL is different
5. **Redirect Slugs**: Each video gets a unique 10-character redirect slug for short URLs

## Troubleshooting

### Error: Duplicate entry for key 'video_id'
- The script generates unique IDs, but if you're importing multiple times, you may need to clear existing data first
- Or modify the script to check existing IDs

### Error: Duplicate entry for key 'redirect_slug'
- Same as above - ensure you're not importing duplicates

### Videos not showing in frontend
- Check that video files exist in `backend/upload/` folder
- Verify file paths in database match actual file locations
- Check backend server configuration for serving upload files

### QR codes not working
- Ensure QR code images exist in `qr-codes/` folder
- Verify QR code paths in database match actual file locations
- Check that QR codes are named correctly (VID_XXXXXXXXXX.png)

## Customization

If you need to modify the script:
- Edit `backend/scripts/generateBulkVideoSQL.js`
- Change subject from "ICT" to your subject name
- Adjust file paths or URL generation
- Modify metadata extraction logic



