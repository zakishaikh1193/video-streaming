# Subtitle System Status Check

## Current Status

Based on the codebase analysis, here's the status of the subtitle/caption system:

### ✅ What's Working

1. **Backend Infrastructure:**
   - Caption database table exists (`captions` table)
   - Caption service (`captionService.js`) can upload and retrieve captions
   - Caption API routes (`/api/captions/:videoId`) are registered
   - Static file serving for captions at `/video-storage/captions/` with CORS headers

2. **Frontend Integration:**
   - `VideoPlayer.jsx` has caption loading logic
   - CC button is configured in Video.js control bar
   - Caption URLs are constructed correctly
   - `ShortUrlRedirect.jsx` fetches captions from API

3. **Subtitle Generation:**
   - Batch subtitle generation script exists
   - Can generate `.vtt` files using FFmpeg + Whisper

### ⚠️ What Needs to Be Done

1. **File Location Mismatch:**
   - Generated subtitles go to `backend/subtitles/`
   - System expects captions in `video-storage/captions/`
   - Files need to be moved and renamed (format: `videoId_language.vtt`)

2. **Database Entries:**
   - Subtitle files need entries in `captions` table
   - Each entry needs: `video_id`, `language`, `file_path`

3. **Video ID Matching:**
   - Subtitle filename must match `video_id` in `videos` table
   - Example: `VID_4VFYDM03BP.vtt` → video_id must be `VID_4VFYDM03BP`

## How to Fix

### Step 1: Check Current Status

```bash
cd backend
npm run check-subtitles
```

This will show:
- Subtitle files in `backend/subtitles/`
- Caption files in `video-storage/captions/`
- Database entries in `captions` table

### Step 2: Import Subtitles (if needed)

If you have subtitle files in `backend/subtitles/` that aren't in the caption system:

```bash
cd backend
npm run import-subtitles
```

This will:
- Copy files to `video-storage/captions/`
- Rename them with language suffix (e.g., `VID_4VFYDM03BP_en.vtt`)
- Add database entries

### Step 3: Verify in Video Player

1. Open a video page (e.g., `/stream/VID_4VFYDM03BP`)
2. Check browser console for caption loading logs
3. Verify CC button appears
4. Click CC button and check if subtitles display

### Step 4: Test Caption URL

Test if caption file is accessible:
```
http://localhost:5000/video-storage/captions/VID_4VFYDM03BP_en.vtt
```

Should return the `.vtt` file content.

## Troubleshooting

### CC Button Not Showing

1. **Check if captions exist in database:**
   ```sql
   SELECT * FROM captions WHERE video_id = 'VID_4VFYDM03BP';
   ```

2. **Check if file exists:**
   ```bash
   ls video-storage/captions/VID_4VFYDM03BP_en.vtt
   ```

3. **Check browser console:**
   - Look for `[VideoPlayer]` logs
   - Check for CORS errors
   - Verify caption URL is correct

4. **Check API response:**
   - `GET /api/videos/VID_4VFYDM03BP` should include `captions` array
   - Or `GET /api/captions/VID_4VFYDM03BP` should return caption data

### Caption File Not Found (404)

1. **Verify file location:**
   - File should be in `video-storage/captions/`
   - Named as `videoId_language.vtt`

2. **Check static file serving:**
   - `backend/server.js` should have: `app.use('/video-storage/captions', ...)`

3. **Check file permissions:**
   - File should be readable by the server process

### Database Entry Missing

1. **Check if video exists:**
   ```sql
   SELECT video_id FROM videos WHERE video_id = 'VID_4VFYDM03BP';
   ```

2. **Import subtitle:**
   ```bash
   npm run import-subtitles
   ```

3. **Or manually add:**
   ```sql
   INSERT INTO captions (video_id, language, file_path)
   VALUES ('VID_4VFYDM03BP', 'en', 'captions/VID_4VFYDM03BP_en.vtt');
   ```

## Quick Test Commands

```bash
# Check subtitle system status
cd backend
npm run check-subtitles

# Check specific video
npm run check-subtitles VID_4VFYDM03BP

# Import subtitles
npm run import-subtitles

# Dry run (see what would be done)
npm run import-subtitles -- --dry-run
```

## Expected File Structure

```
video-streaming/
├── backend/
│   └── subtitles/              # Generated subtitles (temporary)
│       └── VID_4VFYDM03BP.vtt
└── video-storage/
    └── captions/               # Final caption files (served by API)
        └── VID_4VFYDM03BP_en.vtt
```

## Database Structure

```sql
captions table:
- id (AUTO_INCREMENT)
- video_id (VARCHAR)      -- Must match videos.video_id
- language (VARCHAR)      -- e.g., 'en', 'es'
- file_path (VARCHAR)    -- e.g., 'captions/VID_4VFYDM03BP_en.vtt'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
