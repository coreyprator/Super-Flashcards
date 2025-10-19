# Build and Deploy Script for Super Flashcards
$ErrorActionPreference = "Stop"

# Add gcloud to PATH
$env:Path += ";C:\Users\Owner\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Super Flashcards Container..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

cd "g:\My Drive\Code\Python\Super-Flashcards"

# Build the container
Write-Host "`nStep 1: Building container image..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.yaml --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Deploy to Cloud Run
Write-Host "`nStep 2: Deploying to Cloud Run..." -ForegroundColor Yellow

# Get OpenAI API key from Secret Manager and trim whitespace
$OPENAI_KEY = (gcloud secrets versions access latest --secret="openai-api-key" --project=super-flashcards-475210).Trim()

gcloud run deploy super-flashcards `
    --image gcr.io/super-flashcards-475210/super-flashcards:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning,SQL_USER=flashcards_user,SQL_PASSWORD=ezihRMX6VAaGd97hAuwW,BASIC_AUTH_USERNAME=beta,BASIC_AUTH_PASSWORD=flashcards2025,OPENAI_API_KEY=$OPENAI_KEY" `
    --project=super-flashcards-475210

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYour app is live at:" -ForegroundColor Cyan
Write-Host "https://super-flashcards-57478301787.us-central1.run.app" -ForegroundColor White
Write-Host "`nLogin with:" -ForegroundColor Cyan
Write-Host "  Username: beta" -ForegroundColor White
Write-Host "  Password: flashcards2025" -ForegroundColor White
