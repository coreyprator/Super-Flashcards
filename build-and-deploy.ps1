# Build and Deploy Script for Super Flashcards
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
        gcloud auth login --no-launch-browser --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ User authentication successful!" -ForegroundColor Green
            
            # Also set application-default credentials for gcloud builds submit
            Write-Host "Setting up application-default credentials for Cloud Build..." -ForegroundColor Cyan
            gcloud auth application-default login --no-launch-browser
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Application-default credentials set!`n" -ForegroundColor Green
                return $true
            } else {
                Write-Host "⚠️  Application-default login failed, but user auth succeeded. Continuing..." -ForegroundColor Yellow
                return $true
            }
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
    Write-Host "✅ Already authenticated as: $account" -ForegroundColor Green
    
    # Check if application-default credentials exist (needed for gcloud builds submit)
    Write-Host "Checking application-default credentials..." -ForegroundColor Cyan
    $adcPath = "$env:APPDATA\gcloud\application_default_credentials.json"
    if (-not (Test-Path $adcPath)) {
        Write-Host "⚠️  Application-default credentials not found. Setting up for Cloud Build..." -ForegroundColor Yellow
        gcloud auth application-default login --no-launch-browser
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Application-default credentials configured!`n" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Application-default credentials found`n" -ForegroundColor Green
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Super Flashcards Container..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location "g:\My Drive\Code\Python\Super-Flashcards"

# Build the container
Write-Host "`nStep 1: Building container image..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.yaml --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    # Check if it was an auth error
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Checking if this is an authentication issue..." -ForegroundColor Yellow
    
    if (-not (Test-GcloudAuth)) {
        Write-Host "Authentication expired during build. Re-authenticating..." -ForegroundColor Yellow
        if (Invoke-GcloudAuth) {
            Write-Host "Retrying build..." -ForegroundColor Cyan
            gcloud builds submit --config cloudbuild.yaml --project=super-flashcards-475210
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
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Deploy to Cloud Run
Write-Host "`nStep 2: Deploying to Cloud Run..." -ForegroundColor Yellow

Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan

# Google OAuth credentials from .env.example
$GOOGLE_CLIENT_ID = "57478301787-80l70otb16jfgliododcl2s4m59vnc67.apps.googleusercontent.com"
$GOOGLE_CLIENT_SECRET = "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"
$GOOGLE_REDIRECT_URI = "https://learn.rentyourcio.com/api/auth/google/callback"

# Use --update-secrets to mount secrets directly from Secret Manager
# This avoids the issue of special characters in the password
gcloud run deploy super-flashcards `
    --image gcr.io/super-flashcards-475210/super-flashcards:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning,SQL_USER=flashcards_user,BASIC_AUTH_USERNAME=beta,BASIC_AUTH_PASSWORD=flashcards2025,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI" `
    --update-secrets="SQL_PASSWORD=db-password:latest,OPENAI_API_KEY=openai-api-key:latest" `
    --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    # Check if it was an auth error
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Checking if this is an authentication issue..." -ForegroundColor Yellow
    
    if (-not (Test-GcloudAuth)) {
        Write-Host "Authentication expired during deployment. Re-authenticating..." -ForegroundColor Yellow
        if (Invoke-GcloudAuth) {
            Write-Host "Retrying deployment..." -ForegroundColor Cyan
            gcloud run deploy super-flashcards `
                --image gcr.io/super-flashcards-475210/super-flashcards:latest `
                --platform managed `
                --region us-central1 `
                --allow-unauthenticated `
                --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning,SQL_USER=flashcards_user,BASIC_AUTH_USERNAME=beta,BASIC_AUTH_PASSWORD=flashcards2025,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI" `
                --update-secrets="SQL_PASSWORD=db-password:latest,OPENAI_API_KEY=openai-api-key:latest" `
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
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYour app is live at:" -ForegroundColor Cyan
Write-Host "https://super-flashcards-57478301787.us-central1.run.app" -ForegroundColor White
Write-Host "`nLogin with:" -ForegroundColor Cyan
Write-Host "  Username: beta" -ForegroundColor White
Write-Host "  Password: flashcards2025" -ForegroundColor White
