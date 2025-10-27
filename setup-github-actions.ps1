# Setup script for GitHub Actions service account
# Run this in PowerShell

$PROJECT_ID = "super-flashcards-475210"

Write-Host "🔑 Creating GitHub Actions service account..." -ForegroundColor Cyan

# Create service account
gcloud iam service-accounts create github-actions `
    --display-name="GitHub Actions Deployment" `
    --project=$PROJECT_ID

Write-Host "✅ Service account created" -ForegroundColor Green

Write-Host "🔐 Granting permissions..." -ForegroundColor Cyan

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" `
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" `
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" `
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" `
    --role="roles/cloudbuild.builds.builder"

Write-Host "✅ Permissions granted" -ForegroundColor Green

Write-Host "🔑 Creating service account key..." -ForegroundColor Cyan

# Create key
gcloud iam service-accounts keys create github-actions-key.json `
    --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

Write-Host "✅ Key created: github-actions-key.json" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open github-actions-key.json and copy its contents"
Write-Host "2. Go to: https://github.com/coreyprator/Super-Flashcards/settings/secrets/actions"
Write-Host "3. Click 'New repository secret'"
Write-Host "4. Name: GCP_SA_KEY"
Write-Host "5. Value: Paste the entire JSON contents"
Write-Host "6. Click 'Add secret'"
Write-Host "7. Delete the key file: del github-actions-key.json"
Write-Host ""
Write-Host "After that, every git push will auto-deploy! 🚀" -ForegroundColor Green
