# Super Flashcards - Migrate Data to Cloud SQL
# Shows real-time progress with detailed output

param(
    [string]$CloudPassword = "ezihRMX6VAaGd97hAuwW"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SuperFlashcards Cloud Migration - Live Progress" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Connection strings
$LocalServer = "localhost\SQLEXPRESS"
$CloudServer = "35.224.242.223,1433"
$Database = "LanguageLearning"
$CloudUser = "flashcards_user"

Write-Host "[Step 1/5] Testing local SQL Server connection..." -ForegroundColor Yellow
try {
    $localTest = sqlcmd -S $LocalServer -d $Database -E -Q "SELECT COUNT(*) as count FROM languages" -h -1
    Write-Host "   ✓ Local database accessible" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cannot connect to local SQL Server" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 2/5] Testing Cloud SQL connection..." -ForegroundColor Yellow
try {
    $cloudTest = sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q "SELECT 1" -h -1
    Write-Host "   ✓ Cloud database accessible" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cannot connect to Cloud SQL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 3/5] Creating tables in Cloud SQL..." -ForegroundColor Yellow

# Create Languages table
Write-Host "   → Creating languages table..." -NoNewline
sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q @"
CREATE TABLE languages (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL,
    code NVARCHAR(5) UNIQUE NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
"@ -h -1 | Out-Null
Write-Host " ✓" -ForegroundColor Green

# Create Flashcards table
Write-Host "   → Creating flashcards table..." -NoNewline
sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q @"
CREATE TABLE flashcards (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    language_id UNIQUEIDENTIFIER NOT NULL,
    word_or_phrase NVARCHAR(500) NOT NULL,
    definition NVARCHAR(MAX),
    etymology NVARCHAR(MAX),
    english_cognates NVARCHAR(MAX),
    related_words NVARCHAR(MAX),
    image_url NVARCHAR(1000),
    image_description NVARCHAR(MAX),
    audio_url NVARCHAR(500),
    audio_generated_at DATETIME2,
    ipa_pronunciation NVARCHAR(500),
    ipa_audio_url NVARCHAR(500),
    ipa_generated_at DATETIME2,
    source NVARCHAR(50) DEFAULT 'manual',
    times_reviewed INT DEFAULT 0,
    last_reviewed DATETIME2,
    is_synced BIT DEFAULT 1,
    local_only BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (language_id) REFERENCES languages(id)
);
CREATE INDEX IX_flashcards_word ON flashcards(word_or_phrase);
"@ -h -1 | Out-Null
Write-Host " ✓" -ForegroundColor Green

Write-Host ""
Write-Host "[Step 4/5] Copying Languages..." -ForegroundColor Yellow

# Export languages to CSV
$tempLang = "$env:TEMP\languages.csv"
sqlcmd -S $LocalServer -d $Database -E -Q "SELECT id, name, code, created_at FROM languages" -s "," -W -h -1 -o $tempLang

# Count and import
$langCount = (Get-Content $tempLang | Measure-Object -Line).Lines - 1
Write-Host "   → Found $langCount languages to copy" -ForegroundColor Cyan

# Import to cloud
$langData = Import-Csv $tempLang -Header "id","name","code","created_at"
$copied = 0
foreach ($row in $langData) {
    $copied++
    Write-Host "   → Copying language $copied/$langCount : $($row.name)..." -NoNewline
    
    $insertSql = @"
INSERT INTO languages (id, name, code, created_at) 
VALUES ('$($row.id)', N'$($row.name)', '$($row.code)', '$($row.created_at)');
"@
    
    sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q $insertSql -h -1 | Out-Null
    Write-Host " ✓" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Step 5/5] Copying Flashcards..." -ForegroundColor Yellow

# Get total count
$totalCards = (sqlcmd -S $LocalServer -d $Database -E -Q "SELECT COUNT(*) FROM flashcards" -h -1).Trim()
Write-Host "   → Found $totalCards flashcards to copy" -ForegroundColor Cyan
Write-Host "   → Processing in batches of 10..." -ForegroundColor Cyan
Write-Host ""

# Process in small batches for progress visibility
$batchSize = 10
$offset = 0
$copied = 0

while ($copied -lt $totalCards) {
    # Export batch to temp file
    $tempBatch = "$env:TEMP\flashcards_batch.txt"
    
    $batchSql = @"
SELECT 
    id, language_id, word_or_phrase, definition, etymology,
    english_cognates, related_words, image_url, image_description,
    audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
    ipa_generated_at, source, times_reviewed, last_reviewed,
    is_synced, local_only, created_at, updated_at
FROM flashcards
ORDER BY created_at
OFFSET $offset ROWS FETCH NEXT $batchSize ROWS ONLY
"@
    
    sqlcmd -S $LocalServer -d $Database -E -Q $batchSql -s "|" -W -h -1 -o $tempBatch
    
    # Read and import each row
    $batchLines = Get-Content $tempBatch | Where-Object { $_.Trim() -ne "" }
    
    if ($batchLines.Count -eq 0) { break }
    
    foreach ($line in $batchLines) {
        $fields = $line -split "\|"
        if ($fields.Count -lt 21) { continue }
        
        $copied++
        $percent = [math]::Round(($copied / $totalCards) * 100, 1)
        Write-Host "   [$percent%] Card $copied/$totalCards : $($fields[2].Trim())" -ForegroundColor Cyan
        
        # Escape single quotes
        $escapedFields = $fields | ForEach-Object { $_.Replace("'", "''") }
        
        $insertSql = @"
INSERT INTO flashcards (
    id, language_id, word_or_phrase, definition, etymology,
    english_cognates, related_words, image_url, image_description,
    audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
    ipa_generated_at, source, times_reviewed, last_reviewed,
    is_synced, local_only, created_at, updated_at
) VALUES (
    '$($escapedFields[0])', '$($escapedFields[1])', N'$($escapedFields[2])', 
    $(if($escapedFields[3].Trim()) {"N'$($escapedFields[3])'"} else {"NULL"}),
    $(if($escapedFields[4].Trim()) {"N'$($escapedFields[4])'"} else {"NULL"}),
    $(if($escapedFields[5].Trim()) {"N'$($escapedFields[5])'"} else {"NULL"}),
    $(if($escapedFields[6].Trim()) {"N'$($escapedFields[6])'"} else {"NULL"}),
    $(if($escapedFields[7].Trim()) {"'$($escapedFields[7])'"} else {"NULL"}),
    $(if($escapedFields[8].Trim()) {"N'$($escapedFields[8])'"} else {"NULL"}),
    $(if($escapedFields[9].Trim()) {"'$($escapedFields[9])'"} else {"NULL"}),
    $(if($escapedFields[10].Trim()) {"'$($escapedFields[10])'"} else {"NULL"}),
    $(if($escapedFields[11].Trim()) {"N'$($escapedFields[11])'"} else {"NULL"}),
    $(if($escapedFields[12].Trim()) {"'$($escapedFields[12])'"} else {"NULL"}),
    $(if($escapedFields[13].Trim()) {"'$($escapedFields[13])'"} else {"NULL"}),
    $(if($escapedFields[14].Trim()) {"'$($escapedFields[14])'"} else {"NULL"}),
    $(if($escapedFields[15].Trim()) {$escapedFields[15]} else {0}),
    $(if($escapedFields[16].Trim()) {"'$($escapedFields[16])'"} else {"NULL"}),
    $(if($escapedFields[17].Trim()) {$escapedFields[17]} else {1}),
    $(if($escapedFields[18].Trim()) {$escapedFields[18]} else {0}),
    '$(if($escapedFields[19].Trim()) {$escapedFields[19]} else {Get-Date -Format "yyyy-MM-dd HH:mm:ss"})',
    '$(if($escapedFields[20].Trim()) {$escapedFields[20]} else {Get-Date -Format "yyyy-MM-dd HH:mm:ss"})'
);
"@
        
        sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q $insertSql -h -1 2>&1 | Out-Null
    }
    
    $offset += $batchSize
}

# Verify
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   VERIFICATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$cloudLangCount = (sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q "SELECT COUNT(*) FROM languages" -h -1).Trim()
$cloudCardCount = (sqlcmd -S $CloudServer -U $CloudUser -P $CloudPassword -d $Database -Q "SELECT COUNT(*) FROM flashcards" -h -1).Trim()

Write-Host ""
Write-Host "   Local → Cloud" -ForegroundColor White
Write-Host "   Languages:  $langCount → $cloudLangCount" -ForegroundColor $(if($langCount -eq $cloudLangCount){"Green"}else{"Red"})
Write-Host "   Flashcards: $totalCards → $cloudCardCount" -ForegroundColor $(if($totalCards -eq $cloudCardCount){"Green"}else{"Red"})
Write-Host ""

if ($cloudLangCount -eq $langCount -and $cloudCardCount -eq $totalCards) {
    Write-Host "   ✅ MIGRATION COMPLETE! All data copied successfully!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Warning: Record counts don't match!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Next: Deploy application to Cloud Run" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Cleanup
Remove-Item $tempLang -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\flashcards_batch.txt" -ErrorAction SilentlyContinue
