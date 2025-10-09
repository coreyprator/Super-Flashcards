# SuperFlashcards - Setup Instructions

## ✅ 1. Database Backup System (COMPLETED)

**Status**: ✅ **FULLY OPERATIONAL** with email notifications

The backup system is now fully configured and working:

- **Daily Automated Backups**: Runs every day at 2:00 AM
- **Email Notifications**: Success/failure alerts sent to corey.prator@gmail.com
- **Google Drive Sync**: Backups automatically copied to G:\My Drive\Code\Python\Super-Flashcards\backups
- **Current Backup Size**: ~5.1 MB (20 backup files maintained)

**Key Files:**
- Main script: `backend\scripts\backup_with_google_workspace_email.ps1`
- Scheduled task: `backups\SuperFlashcards-DailyBackup.xml`
- SQL script: `backend\scripts\backup_database_fixed.sql`

**Manual backup**: Run `powershell -File "backend\scripts\backup_with_google_workspace_email.ps1"`

## 2. Full-Text Search (15 minutes)

```powershell
# Step 1: Run SQL setup
sqlcmd -S localhost\SQLEXPRESS -d LanguageLearning -i backend\scripts\setup_fulltext_search.sql

# Step 2: Register search router in backend/app/main.py
# Add these lines:
#   from app.routers import search
#   app.include_router(search.router)

# Step 3: Restart server
.\runui.ps1

# Step 4: Test in browser at http://localhost:8000
```

## 3. Word Frequency Analyzer (10 minutes)

```powershell
# Install requirement
pip install python-docx

# Export Google Doc as .docx, then:
python backend\scripts\analyze_word_frequency.py "your_doc.docx" -o words.csv

# Review words.csv and remove unwanted entries
```

## Next Steps

1. Set up backups (peace of mind!)
2. Implement search (find cards instantly)
3. Analyze your documents (prepare for batch import)

See the artifacts in Claude for detailed documentation!
