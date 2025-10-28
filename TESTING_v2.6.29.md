# v2.6.29 Deployment Complete - Testing Instructions

## ✅ Deployment Status: COMPLETE

**Version**: v2.6.29  
**Deployed**: October 27, 2025  
**Deployment Time**: 2m25s  
**Status**: SUCCESS ✓  
**App URL**: https://learn.rentyourcio.com

## 🚨 CRITICAL: Database Migration Required

**BEFORE TESTING**, you must run the database migration to create the `api_debug_logs` table.

See: **MIGRATION_GUIDE_v2.6.29.md** for instructions.

Quick command:
```bash
sqlcmd -S 35.224.242.223,1433 -U flashcards_user -d LanguageLearning -i backend/migrations/create_api_debug_logs_table.sql
```

Or run the SQL manually in Azure Data Studio.

## 🎯 What This Version Does

This version adds **comprehensive verbose debugging** for image and audio generation:

### 1. Database Logging Table
- New table: `api_debug_logs`
- Tracks EVERY image/audio generation attempt
- Stores timing, errors, input/output data
- Reveals exactly where and why failures occur

### 2. Verbose Image Generation Logging
- Logs EVERY step of image generation
- Shows DALL-E API requests and responses
- Tracks download and upload progress
- Logs validation failures (why generation was skipped)

### 3. Enhanced Error Tracking
- Full exception tracebacks stored in database
- Duration tracking (milliseconds)
- API provider and model tracking
- Input parameters captured as JSON

## 🧪 Testing Steps

### Step 1: Run Database Migration
```bash
# Connect and run migration
sqlcmd -S 35.224.242.223,1433 -U flashcards_user -P [password] -d LanguageLearning -i backend/migrations/create_api_debug_logs_table.sql
```

Verify:
```sql
SELECT COUNT(*) FROM api_debug_logs;  -- Should return 0
```

### Step 2: Generate Test Flashcards
1. Go to: https://learn.rentyourcio.com
2. Select language: **Greek (Modern)**
3. Click **"🪄 Batch AI Generate"**
4. Enter words: `cardio, geo`
5. Click **Generate**
6. **Important**: Note the start and end times (it will still be fast if broken)

### Step 3: Check Cloud Run Logs

Go to: [Cloud Run Logs](https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/logs)

**Look for these log messages:**

#### If working correctly:
```
🎨 ===== IMAGE GENERATION START =====
🎨 Word: 'cardio'
🎨 Include images: True
🎨 Has image_description: True
🔍 VERBOSE: === ENTERING generate_image() ===
🔍 VERBOSE: >>> Sending request to DALL-E API...
🔍 VERBOSE: <<< DALL-E API response received!
🔍 VERBOSE: ✅ Downloaded 234567 bytes
🔍 VERBOSE: ✅ Upload complete!
✅ IMAGE GENERATION SUCCESS
✅ Duration: 12450ms
🎨 ===== IMAGE GENERATION END =====
```

#### If skipping:
```
⚠️ Skipping image generation for 'cardio'
⚠️ request.include_images: True/False
⚠️ content.get('image_description'): None/value
```

#### If failing:
```
❌ IMAGE GENERATION FAILED
❌ Error: [error message]
❌ Traceback: [full traceback]
```

### Step 4: Query Database Logs

```sql
-- Check if any logs were created
SELECT COUNT(*) FROM api_debug_logs;

-- View all image generation attempts
SELECT 
    word,
    status,
    step,
    duration_ms,
    error_message,
    created_at
FROM api_debug_logs
WHERE operation_type = 'image_generation'
ORDER BY created_at DESC;

-- Check for failures
SELECT 
    word,
    error_message,
    error_traceback
FROM api_debug_logs
WHERE status = 'failed';

-- Check for skipped operations
SELECT 
    word,
    input_data,
    error_message
FROM api_debug_logs
WHERE status = 'skipped';
```

### Step 5: Check Generated Cards

In the app:
1. Click **"📖 Browse"** button
2. Search for: `cardio` or `geo`
3. Check if card has:
   - ✅ Definition (should always have)
   - ✅ Etymology (should always have)
   - ❓ **Image** (this is what we're debugging)
   - ❓ **Audio** (separate issue - endpoint missing)

## 📊 Expected Results

### Scenario A: Images ARE being generated (but not appearing)
**Logs show:**
```
✅ IMAGE GENERATION SUCCESS
✅ Duration: 10000-15000ms per image
```

**Database shows:**
```sql
status = 'success'
duration_ms = 10000-15000
output_data = '{"image_url": "/images/cardio_abc123.png"}'
```

**This means:** Image generation works, but there's a display/storage issue.

### Scenario B: Images are being SKIPPED
**Logs show:**
```
⚠️ Skipping image generation
⚠️ request.include_images: False
```

**Database shows:**
```sql
status = 'skipped'
error_message = 'Skipped: include_images=False'
input_data = '{"include_images": false, "has_image_description": true}'
```

**This means:** Frontend not sending `include_images: true` or backend validation failing.

### Scenario C: Images are FAILING
**Logs show:**
```
❌ IMAGE GENERATION FAILED
❌ Error: OpenAI API error
```

**Database shows:**
```sql
status = 'failed'
error_message = 'OpenAI API error: ...'
error_traceback = '[full Python traceback]'
```

**This means:** DALL-E API call failing (credentials, quota, content policy, etc.)

### Scenario D: Nothing logged at all
**No logs, no database entries**

**This means:** `generate_image()` is NOT being called at all. The `if request.include_images and content.get("image_description")` validation is failing BEFORE entering the try block.

## 🔍 Debugging Based on Results

### If Scenario A (Success but not displaying):
- Check flashcard table: Does `image_url` field have value?
- Check image proxy: Is `/images/` endpoint working?
- Check Cloud Storage: Is image actually uploaded?
- Frontend issue: Is image_url being rendered?

### If Scenario B (Skipped):
- Check `input_data` in database to see WHY
- Is `include_images` False? Frontend bug.
- Is `image_description` None? AI generation bug.
- Add logging to batch_ai_generate.py request parsing.

### If Scenario C (Failed):
- Read `error_message` and `error_traceback`
- Check OpenAI API credentials
- Check OpenAI API quota/billing
- Check content policy violations
- Check network connectivity to OpenAI

### If Scenario D (Not called):
- Add logging BEFORE the `if` statement
- Log values of `request.include_images` and `content.get("image_description")`
- Check AI content generation - is it returning `image_description`?

## 📝 What to Report Back

After testing, please provide:

1. **Generation time**: How long did it take?
   - Expected with images: 30-40 seconds for 2 cards
   - Expected without images: 5-10 seconds for 2 cards

2. **Cloud Run logs**: Copy/paste the image generation section

3. **Database query results**:
```sql
SELECT * FROM api_debug_logs ORDER BY created_at DESC;
```

4. **Card inspection**: Do the generated cards have images?

5. **Screenshot**: Show the generated card (like you did before)

## 🎬 Next Steps Based on Results

### If images ARE generating:
- Fix display/storage issue
- Check image_url in database vs what's rendered
- Test image proxy endpoint

### If images are SKIPPED:
- Fix validation logic
- Ensure `include_images: true` sent from frontend
- Ensure AI generates `image_description`

### If images are FAILING:
- Fix the specific error shown in logs
- Check OpenAI credentials/quota
- Handle content policy violations

### If nothing is logged:
- Add more logging earlier in the chain
- Check AI content generation output
- Verify batch generation request parameters

## 📚 Additional Documentation

- **DEPLOYMENT_v2.6.29.md** - Full technical details of changes
- **MIGRATION_GUIDE_v2.6.29.md** - Database migration instructions
- **backend/migrations/create_api_debug_logs_table.sql** - SQL migration script

## ⚡ Quick Reference

**App URL**: https://learn.rentyourcio.com  
**Database**: 35.224.242.223,1433  
**User**: flashcards_user  
**Database**: LanguageLearning  

**Cloud Run Logs**: [View Logs](https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/logs)

**GitHub Actions**: [View Deployments](https://github.com/coreyprator/Super-Flashcards/actions)

---

**Ready to test! Remember to run the database migration first!** 🚀
