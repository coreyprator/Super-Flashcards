# Database Migration Guide for v2.6.29

## IMPORTANT: Run this BEFORE testing v2.6.29

The new debug logging feature requires a new table: `api_debug_logs`

## Option 1: Run SQL Script (Recommended)

The file `backend/migrations/create_api_debug_logs_table.sql` contains the migration.

### Using Azure Data Studio or SSMS:

1. Open Azure Data Studio or SQL Server Management Studio
2. Connect to: `35.224.242.223,1433`
3. Login: `flashcards_user`
4. Password: `ezihRMX6VAaGd97hAuwW`
5. Select database: `LanguageLearning`
6. Open file: `backend/migrations/create_api_debug_logs_table.sql`
7. Execute (F5)

### Using sqlcmd (Command Line):

```bash
sqlcmd -S 35.224.242.223,1433 -U flashcards_user -P ezihRMX6VAaGd97hAuwW -d LanguageLearning -i backend/migrations/create_api_debug_logs_table.sql
```

## Option 2: Manual SQL Execution

If you can't access the file, run this SQL directly:

```sql
-- Create API Debug Logs Table
CREATE TABLE api_debug_logs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    flashcard_id UNIQUEIDENTIFIER NULL,
    operation_type NVARCHAR(50) NOT NULL,
    word NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL,
    step NVARCHAR(100) NULL,
    input_data NVARCHAR(MAX) NULL,
    output_data NVARCHAR(MAX) NULL,
    error_message NVARCHAR(MAX) NULL,
    error_traceback NVARCHAR(MAX) NULL,
    duration_ms INT NULL,
    api_provider NVARCHAR(50) NULL,
    api_model NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Create indexes
CREATE INDEX ix_api_debug_logs_flashcard_id ON api_debug_logs(flashcard_id);
CREATE INDEX ix_api_debug_logs_operation_type ON api_debug_logs(operation_type);
CREATE INDEX ix_api_debug_logs_created_at ON api_debug_logs(created_at DESC);
CREATE INDEX ix_api_debug_logs_status ON api_debug_logs(status);
```

## Verification

After running the migration, verify the table exists:

```sql
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'api_debug_logs';
```

Should return:
```
TABLE_NAME         TABLE_TYPE
api_debug_logs     BASE TABLE
```

## Test the Application

After migration is complete:

1. Go to https://learn.rentyourcio.com
2. Click "🪄 Batch AI Generate"
3. Enter 1-2 Greek words (e.g., "cardio", "geo")
4. Click Generate
5. Wait for completion

## Check Debug Logs

### In Database:

```sql
SELECT TOP 10
    operation_type,
    word,
    status,
    step,
    duration_ms,
    error_message,
    created_at
FROM api_debug_logs
ORDER BY created_at DESC;
```

### In Cloud Run Logs:

Go to: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/logs

Look for:
- `🎨 ===== IMAGE GENERATION START =====`
- `🔍 VERBOSE: === ENTERING generate_image() ===`
- `✅ IMAGE GENERATION SUCCESS` or `❌ IMAGE GENERATION FAILED`

## What This Will Reveal

The debug logs will show:

1. **If image generation is being called**
   - Look for `operation_type = 'image_generation'`

2. **Why it's being skipped**
   - Check `status = 'skipped'` entries
   - Read `input_data` to see validation values

3. **Where it's failing**
   - Check `status = 'failed'` entries
   - Read `error_message` and `error_traceback`

4. **Performance metrics**
   - Check `duration_ms` for successful generations
   - Should be 10,000-15,000ms per image (DALL-E API time)

## Common Issues

### Table already exists
If you see: `There is already an object named 'api_debug_logs'`

Run this first:
```sql
DROP TABLE api_debug_logs;
```

Then run the CREATE TABLE statement again.

### Permission denied
If you get permission errors, the user account may not have CREATE TABLE privileges.

Contact the database administrator or use a higher-privileged account.

### Connection failed
If you can't connect to the database:
1. Check your IP is whitelisted in Cloud SQL firewall rules
2. Verify credentials are correct
3. Try connecting with Azure Data Studio instead of SSMS

## Need Help?

If you encounter issues:
1. Check Cloud SQL logs in Google Cloud Console
2. Verify firewall rules allow your IP
3. Try connecting with different SQL client (Azure Data Studio, DBeaver, etc.)
4. Contact me with the error message
