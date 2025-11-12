# Build and Deploy Script for Super Flashcards QA Environment
$ErrorActionPreference = "Stop"

# Add gcloud to PATH
$env:Path += ";C:\Users\Owner\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

# Function to check if gcloud authentication is valid
function Test-GcloudAuth {
    try {
        $result = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
        return $null -ne $result -and $result -ne ""
    } catch {
        return $false
    }
}

# Function to authenticate with browser (supports passkey)
function Invoke-GcloudAuth {
    Write-Host "`n⚠️  Google Cloud authentication required or expired" -ForegroundColor Yellow
    Write-Host "Opening browser for authentication (supports passkey)..." -ForegroundColor Cyan
    Write-Host "If browser doesn't open, you'll get a link to copy/paste.`n" -ForegroundColor Gray
    
    # Try browser-first auth (best for passkey)
    try {
        gcloud auth login --no-launch-browser
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Authentication successful!`n" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        return $false
    }
    return $false
}

# Check authentication before starting
Write-Host "🔐 Checking Google Cloud authentication..." -ForegroundColor Cyan
if (-not (Test-GcloudAuth)) {
    if (-not (Invoke-GcloudAuth)) {
        Write-Host "Cannot proceed without authentication. Exiting." -ForegroundColor Red
        exit 1
    }
} else {
    $account = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
    Write-Host "✅ Already authenticated as: $account`n" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "🧪 Building Super Flashcards QA Container..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Branch: dev" -ForegroundColor Yellow
Write-Host "Service: super-flashcards-qa" -ForegroundColor Yellow
Write-Host "Database: LanguageLearning_QA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Magenta

Set-Location "g:\My Drive\Code\Python\Super-Flashcards"

# Verify we're on dev branch
Write-Host "`n🔍 Verifying git branch..." -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "dev") {
    Write-Host "⚠️  Warning: You are on branch '$currentBranch', not 'dev'" -ForegroundColor Yellow
    Write-Host "QA deployments should come from the 'dev' branch." -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Deployment cancelled. Switch to dev branch with: git checkout dev" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ On dev branch - ready for QA deployment`n" -ForegroundColor Green
}

# Build the container with :qa tag
Write-Host "Step 1: Building QA container image..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild-qa.yaml --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    # Check if it was an auth error
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Checking if this is an authentication issue..." -ForegroundColor Yellow
    
    if (-not (Test-GcloudAuth)) {
        Write-Host "Authentication expired during build. Re-authenticating..." -ForegroundColor Yellow
        if (Invoke-GcloudAuth) {
            Write-Host "Retrying build..." -ForegroundColor Cyan
            gcloud builds submit --config cloudbuild-qa.yaml --project=super-flashcards-475210
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Build failed after re-authentication!" -ForegroundColor Red
                exit 1
            }
        } else {
            exit 1
        }
    } else {
        Write-Host "Build failed for reasons other than authentication." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "🚀 Deploying to QA Cloud Run..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Deploy to Cloud Run QA service
Write-Host "`nStep 2: Deploying to Cloud Run QA service..." -ForegroundColor Yellow

# Google OAuth credentials (same as prod for now)
$GOOGLE_CLIENT_ID = "57478301787-80l70otb16jfgliododcl2s4m59vnc67.apps.googleusercontent.com"
$GOOGLE_CLIENT_SECRET = "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"

# QA redirect URI - will be updated after first deployment to get actual URL
# For now, use a placeholder - we'll update it after seeing the actual QA URL
$GOOGLE_REDIRECT_URI_QA = "https://super-flashcards-qa-57478301787.us-central1.run.app/api/auth/google/callback"

# Deploy to super-flashcards-qa service with QA database and secrets
gcloud run deploy super-flashcards-qa `
    --image gcr.io/super-flashcards-475210/super-flashcards:qa `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning_QA,SQL_USER=flashcards_qa_user,BASIC_AUTH_USERNAME=qa,BASIC_AUTH_PASSWORD=qa2025,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI_QA,ENVIRONMENT=qa" `
    --update-secrets="SQL_PASSWORD=db-password-qa:latest,OPENAI_API_KEY=openai-api-key:latest" `
    --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    # Check if it was an auth error
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Checking if this is an authentication issue..." -ForegroundColor Yellow
    
    if (-not (Test-GcloudAuth)) {
        Write-Host "Authentication expired during deployment. Re-authenticating..." -ForegroundColor Yellow
        if (Invoke-GcloudAuth) {
            Write-Host "Retrying deployment..." -ForegroundColor Cyan
            gcloud run deploy super-flashcards-qa `
                --image gcr.io/super-flashcards-475210/super-flashcards:qa `
                --platform managed `
                --region us-central1 `
                --allow-unauthenticated `
                --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning_QA,SQL_USER=flashcards_qa_user,BASIC_AUTH_USERNAME=qa,BASIC_AUTH_PASSWORD=qa2025,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI_QA,ENVIRONMENT=qa" `
                --update-secrets="SQL_PASSWORD=db-password-qa:latest,OPENAI_API_KEY=openai-api-key:latest" `
                --project=super-flashcards-475210
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Deployment failed after re-authentication!" -ForegroundColor Red
                exit 1
            }
        } else {
            exit 1
        }
    } else {
        Write-Host "Deployment failed for reasons other than authentication." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ QA Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n🧪 Your QA app is live at:" -ForegroundColor Magenta
Write-Host "https://super-flashcards-qa-57478301787.us-central1.run.app" -ForegroundColor White
Write-Host "`n🔐 QA Login credentials:" -ForegroundColor Magenta
Write-Host "  Username: qa" -ForegroundColor White
Write-Host "  Password: qa2025" -ForegroundColor White
Write-Host "`n📊 QA Environment Details:" -ForegroundColor Magenta
Write-Host "  Database: LanguageLearning_QA" -ForegroundColor White
Write-Host "  User: flashcards_qa_user" -ForegroundColor White
Write-Host "  Branch: dev" -ForegroundColor White
Write-Host "  Environment: qa" -ForegroundColor White
Write-Host "`n⚠️  Note: This is a QA environment - break things freely!" -ForegroundColor Yellow
Write-Host "Production remains untouched on 'main' branch.`n" -ForegroundColor Cyan
