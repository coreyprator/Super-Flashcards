# MS SQL Quick Reference - Language Learning App

Quick reference for common database operations. Use your expertise to extend these!

## Python Environment Setup

### Package Installation Issues

If you encounter SSL/certificate errors during pip installs, use trusted host flags:

```powershell
# Standard installation
pip install package-name

# If SSL errors occur, use trusted hosts
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org package-name

# Example: Reinstall corrupted uvicorn
pip uninstall uvicorn -y && pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org uvicorn[standard]
```

**Common Symptoms**:
- Package names appearing corrupted in `pip list` (e.g., "~vicorn" instead of "uvicorn")
- SSL certificate verification errors
- Connection timeouts to PyPI

### Version Compatibility Issues

**FastAPI + Pydantic Compatibility:**

```bash
# WORKING COMBINATION (Tested October 2025)
pip install "fastapi==0.104.1" "starlette==0.27.0" "pydantic>=2.4.0,<2.6.0"

# BROKEN COMBINATION (Avoid)
# fastapi==0.118.0 + pydantic==2.11.9 
# Error: "model_fields_schema() got an unexpected keyword argument 'extras_keys_schema'"
```

**If you get Pydantic compatibility errors:**
1. Check versions: `pip show fastapi pydantic starlette`
2. Downgrade FastAPI: `pip install "fastapi==0.104.1" --force-reinstall`
3. Use requirements.txt: `pip install -r requirements.txt`

## Database Setup

```sql
-- Create database
CREATE DATABASE LanguageLearning;
GO

USE LanguageLearning;
GO

-- Check database size
EXEC sp_spaceused;

-- List all tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';
```

## Viewing Data

```sql
-- View all languages
SELECT * FROM languages ORDER BY name;

-- View all flashcards with language names
SELECT 
    f.word_or_phrase,
    l.name as language,
    f.times_reviewed,
    f.created_at
FROM flashcards f
JOIN languages l ON f.language_id = l.id
ORDER BY f.created_at DESC;

-- Count flashcards by language
SELECT 
    l.name,
    COUNT(*) as count
FROM flashcards f
JOIN languages l ON f.language_id = l.id
GROUP BY l.name
ORDER BY count DESC;

-- Recent flashcards (last 10)
SELECT TOP 10
    word_or_phrase,
    definition,
    source,
    created_at
FROM flashcards
ORDER BY created_at DESC;
```

## Search and Filter

```sql
-- Search by word
SELECT * FROM flashcards
WHERE word_or_phrase LIKE '%bon%';

-- Search by definition
SELECT word_or_phrase, definition
FROM flashcards
WHERE definition LIKE '%hello%';

-- Find AI-generated flashcards
SELECT COUNT(*) as ai_count
FROM flashcards
WHERE source = 'ai_generated';

-- Find unreviewed flashcards
SELECT * FROM flashcards
WHERE last_reviewed IS NULL
ORDER BY created_at;

-- Cards needing review (3+ days old)
SELECT 
    word_or_phrase,
    DATEDIFF(day, ISNULL(last_reviewed, created_at), GETDATE()) as days_since_review
FROM flashcards
WHERE last_reviewed IS NULL OR last_reviewed < DATEADD(day, -3, GETDATE())
ORDER BY days_since_review DESC;
```

## Analytics Queries

```sql
-- Study statistics
SELECT 
    COUNT(*) as total_flashcards,
    SUM(times_reviewed) as total_reviews,
    AVG(CAST(times_reviewed AS FLOAT)) as avg_reviews_per_card,
    MAX(times_reviewed) as max_reviews
FROM flashcards;

-- Daily activity (last 30 days)
SELECT 
    CAST(created_at AS DATE) as date,
    COUNT(*) as cards_added
FROM flashcards
WHERE created_at > DATEADD(day, -30, GETDATE())
GROUP BY CAST(created_at AS DATE)
ORDER BY date DESC;

-- Most active study days
SELECT 
    CAST(last_reviewed AS DATE) as date,
    COUNT(*) as reviews
FROM flashcards
WHERE last_reviewed IS NOT NULL
GROUP BY CAST(last_reviewed AS DATE)
ORDER BY reviews DESC;

-- Etymology word count (most common roots)
SELECT 
    value as word,
    COUNT(*) as frequency
FROM flashcards
CROSS APPLY STRING_SPLIT(etymology, ' ')
WHERE LEN(value) > 3  -- Filter out short words
GROUP BY value
HAVING COUNT(*) > 2
ORDER BY frequency DESC;
```

## Data Management

```sql
-- Add a new language
INSERT INTO languages (id, name, code)
VALUES (NEWID(), 'Russian', 'ru');

-- Update flashcard
UPDATE flashcards
SET definition = 'New definition here'
WHERE word_or_phrase = 'bonjour';

-- Delete a flashcard
DELETE FROM flashcards
WHERE word_or_phrase = 'test';

-- Batch update: Mark all as synced
UPDATE flashcards
SET is_synced = 1, local_only = 0
WHERE is_synced = 0;

-- Reset review counts (if needed)
UPDATE flashcards
SET times_reviewed = 0, last_reviewed = NULL;
```

## Maintenance

```sql
-- Check table sizes
EXEC sp_spaceused 'flashcards';
EXEC sp_spaceused 'languages';
EXEC sp_spaceused 'study_sessions';

-- Check index fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Rebuild indexes if fragmented
ALTER INDEX ALL ON flashcards REBUILD;

-- Update statistics
UPDATE STATISTICS flashcards;
UPDATE STATISTICS languages;

-- Shrink database (use sparingly)
DBCC SHRINKDATABASE(LanguageLearning, 10);
```

## Backup & Restore

```sql
-- Full backup
BACKUP DATABASE LanguageLearning
TO DISK = 'C:\Backup\LanguageLearning_Full.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;

-- Differential backup
BACKUP DATABASE LanguageLearning
TO DISK = 'C:\Backup\LanguageLearning_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION;

-- Restore database
USE master;
GO
RESTORE DATABASE LanguageLearning
FROM DISK = 'C:\Backup\LanguageLearning_Full.bak'
WITH REPLACE, STATS = 10;
GO

-- Verify backup
RESTORE VERIFYONLY 
FROM DISK = 'C:\Backup\LanguageLearning_Full.bak';
```

## Export Data

```sql
-- Export to CSV using bcp
-- Run from command line:
bcp "SELECT * FROM LanguageLearning.dbo.flashcards" queryout "flashcards.csv" -c -t, -S localhost\SQLEXPRESS -T

-- Export specific fields
bcp "SELECT word_or_phrase, definition, etymology FROM LanguageLearning.dbo.flashcards WHERE language_id = (SELECT id FROM LanguageLearning.dbo.languages WHERE code = 'fr')" queryout "french_cards.csv" -c -t, -S localhost\SQLEXPRESS -T
```

## JSON Queries

```sql
-- Extract first related word
SELECT 
    word_or_phrase,
    JSON_VALUE(related_words, '$[0]') as first_related
FROM flashcards
WHERE related_words IS NOT NULL;

-- Count related words per flashcard
SELECT 
    word_or_phrase,
    (SELECT COUNT(*) FROM OPENJSON(related_words)) as num_related
FROM flashcards
WHERE ISJSON(related_words) = 1;

-- Find all related words
SELECT 
    f.word_or_phrase,
    rw.value as related_word
FROM flashcards f
CROSS APPLY OPENJSON(f.related_words) rw;

-- Update JSON array (add a related word)
UPDATE flashcards
SET related_words = JSON_MODIFY(
    ISNULL(related_words, '[]'),
    'append $',
    'nouveau mot'
)
WHERE word_or_phrase = 'bonjour';
```

## Performance Monitoring

```sql
-- Find slow queries
SELECT TOP 10
    qs.execution_count,
    qs.total_elapsed_time / 1000000.0 as total_seconds,
    qs.total_elapsed_time / qs.execution_count / 1000.0 as avg_ms,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%flashcards%'
ORDER BY qs.total_elapsed_time DESC;

-- Current connections
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('LanguageLearning');

-- Database file sizes
SELECT 
    name,
    size * 8 / 1024 as size_mb,
    max_size,
    growth
FROM sys.database_files;
```

## Useful Stored Procedures

```sql
-- Create procedure: Get flashcards needing review
CREATE PROCEDURE GetFlashcardsNeedingReview
    @DaysSinceReview INT = 3,
    @LanguageCode NVARCHAR(5) = NULL
AS
BEGIN
    SELECT 
        f.id,
        f.word_or_phrase,
        l.name as language,
        DATEDIFF(day, ISNULL(f.last_reviewed, f.created_at), GETDATE()) as days_since_review
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    WHERE (f.last_reviewed IS NULL OR f.last_reviewed < DATEADD(day, -@DaysSinceReview, GETDATE()))
      AND (@LanguageCode IS NULL OR l.code = @LanguageCode)
    ORDER BY days_since_review DESC;
END;
GO

-- Use it:
EXEC GetFlashcardsNeedingReview @DaysSinceReview = 5, @LanguageCode = 'fr';

-- Create procedure: Get language statistics
CREATE PROCEDURE GetLanguageStats
AS
BEGIN
    SELECT 
        l.name,
        l.code,
        COUNT(f.id) as total_cards,
        SUM(f.times_reviewed) as total_reviews,
        AVG(CAST(f.times_reviewed AS FLOAT)) as avg_reviews,
        COUNT(CASE WHEN f.source = 'ai_generated' THEN 1 END) as ai_generated,
        COUNT(CASE WHEN f.source = 'manual' THEN 1 END) as manual,
        MAX(f.created_at) as newest_card,
        COUNT(CASE WHEN f.last_reviewed > DATEADD(day, -7, GETDATE()) THEN 1 END) as reviewed_this_week
    FROM languages l
    LEFT JOIN flashcards f ON l.id = f.language_id
    GROUP BY l.name, l.code
    ORDER BY total_cards DESC;
END;
GO

-- Use it:
EXEC GetLanguageStats;
```

## Tips for Your Expertise

**You have 20 years of MS SQL experience - here are power user tips:**

1. **Query Store**: Enable for automatic query performance insights
   ```sql
   ALTER DATABASE LanguageLearning SET QUERY_STORE = ON;
   ```

2. **Extended Events**: Track AI generation performance
   ```sql
   -- Create session to monitor long-running queries
   CREATE EVENT SESSION SlowQueries ON SERVER
   ADD EVENT sqlserver.sql_statement_completed
   WHERE duration > 1000000; -- 1 second
   ```

3. **Custom Indexes**: Create based on your query patterns
   ```sql
   -- Composite index for filtered queries
   CREATE INDEX IX_Flashcards_Language_Reviewed
   ON flashcards(language_id, last_reviewed)
   INCLUDE (word_or_phrase, times_reviewed);
   ```

4. **Partitioning** (if you get to 100k+ cards):
   ```sql
   -- Partition by language_id for better performance
   CREATE PARTITION FUNCTION PF_Language(UNIQUEIDENTIFIER)
   AS RANGE RIGHT FOR VALUES (...);
   ```

**You know what works - use your expertise to optimize!**

## Python Environment & Package Installation

### SSL Certificate Issues with PyPI

If you encounter SSL certificate errors when installing Python packages:

```bash
# Standard installation (may fail with SSL errors)
pip install -r requirements.txt

# SSL Error symptoms:
# SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING]...'))
# HTTPSConnectionPool(host='pypi.org', port=443): Max retries exceeded
```

**Solution - Use trusted host flags:**

```bash
# Install with trusted hosts (bypasses SSL verification)
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# For individual packages
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org requests==2.31.0
```

### Permanent Solution - Create pip.conf

Create a `pip.conf` file in your project root or user directory:

**Location:** `%APPDATA%\pip\pip.ini` (Windows) or `~/.pip/pip.conf` (Linux/Mac)

```ini
[global]
trusted-host = pypi.org
               pypi.python.org
               files.pythonhosted.org

[install]
trusted-host = pypi.org
               pypi.python.org
               files.pythonhosted.org
```

### Python Version Compatibility

**Recommended:** Python 3.11 or 3.12 for best compatibility

```bash
# Check available Python versions
py -0

# Create virtual environment with specific Python version
py -3.12 -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1  # PowerShell
.venv\Scripts\activate.bat  # Command Prompt
```

**Avoid Python 3.13+** - too new for some packages (pyodbc, SQLAlchemy compatibility issues)

### Database Connection Troubleshooting

**Common pyodbc Issues:**
- Ensure ODBC Driver 17+ for SQL Server is installed
- Check connection strings in `.env` file
- Verify SQL Server Express is running and accepting connections

```python
# Test connection
import pyodbc
pyodbc.drivers()  # Should show SQL Server drivers
```

### Virtual Environment Best Practices

1. **Always use project-specific virtual environments**
2. **Avoid cross-contamination** between projects (like cubist_art vs super-flashcards)
3. **Check active environment:**
   ```bash
   python -c "import sys; print(sys.executable)"
   ```
4. **Deactivate when switching projects:**
   ```bash
   deactivate
   ```