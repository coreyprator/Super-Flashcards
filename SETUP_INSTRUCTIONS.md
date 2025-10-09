# Sprint 3 Quick Wins - Setup Instructions

## 1. Database Backup (5 minutes)

```powershell
# Run as Administrator
.\backend\scripts\setup_backup.ps1

# Verify
Get-ScheduledTask -TaskName "SuperFlashcards-DailyBackup"
Get-ChildItem C:\Backups\SuperFlashcards\
```

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
