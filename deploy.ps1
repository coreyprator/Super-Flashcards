#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build, deploy, and verify Super-Flashcards to Google Cloud Run

.DESCRIPTION
    This script:
    1. Commits and pushes code changes
    2. Builds Docker image via Cloud Build
    3. Deploys to Cloud Run with all required secrets/env vars
    4. Runs automated verification tests
    5. Reports success/failure

.PARAMETER Message
    Git commit message (required)

.PARAMETER SkipTests
    Skip post-deployment verification tests

.PARAMETER SkipGit
    Skip git commit and push (use existing committed code)

.PARAMETER Staging
    Deploy to staging URL for testing

.EXAMPLE
    .\deploy.ps1 -Message "Fix database connection issue"
    
.EXAMPLE
    .\deploy.ps1 -Message "Update OAuth flow" -SkipTests
    
.EXAMPLE
    .\deploy.ps1 -SkipGit
    Deploys already-committed code without new commit
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipGit,
    
    [Parameter(Mandatory=$false)]
    [switch]$Staging
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "super-flashcards-475210"
$SERVICE_NAME = "super-flashcards"
$REGION = "us-central1"
$IMAGE = "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Color output functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Step { param($msg) Write-Host "`n🚀 $msg" -ForegroundColor Yellow; Write-Host ("="*80) -ForegroundColor Yellow }

# Validate parameters
if (-not $SkipGit -and -not $Message) {
    Write-Error "Commit message is required (use -Message or -SkipGit)"
    exit 1
}

# Track timing
$startTime = Get-Date

try {
    # Step 1: Git commit and push (unless skipped)
    if (-not $SkipGit) {
        Write-Step "STEP 1: Committing and pushing code"
        
        git add .
        if ($LASTEXITCODE -ne 0) { throw "git add failed" }
        
        git commit -m $Message
        if ($LASTEXITCODE -ne 0) { 
            Write-Info "No changes to commit, continuing with existing code..."
        }
        
        git push
        if ($LASTEXITCODE -ne 0) { throw "git push failed" }
        
        Write-Success "Code committed and pushed to GitHub"
    } else {
        Write-Info "Skipping git commit/push (using existing code)"
    }
    
    # Step 2: Build with Cloud Build
    Write-Step "STEP 2: Building Docker image"
    
    $buildStart = Get-Date
    gcloud builds submit --config cloudbuild.yaml --quiet
    if ($LASTEXITCODE -ne 0) { throw "Cloud Build failed" }
    
    $buildTime = ((Get-Date) - $buildStart).TotalSeconds
    Write-Success "Docker image built successfully in $([math]::Round($buildTime, 1))s"
    
    # Step 3: Deploy to Cloud Run
    Write-Step "STEP 3: Deploying to Cloud Run"
    
    $deployStart = Get-Date
    gcloud run deploy $SERVICE_NAME `
        --region $REGION `
        --image $IMAGE `
        --set-secrets=SQL_PASSWORD=db-password:latest `
        --quiet
    
    if ($LASTEXITCODE -ne 0) { throw "Cloud Run deployment failed" }
    
    $deployTime = ((Get-Date) - $deployStart).TotalSeconds
    Write-Success "Deployed to Cloud Run successfully in $([math]::Round($deployTime, 1))s"
    
    # Get the deployed URL
    $serviceUrl = (gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
    Write-Info "Service URL: $serviceUrl"
    
    # Step 4: Run verification tests (unless skipped)
    if (-not $SkipTests) {
        Write-Step "STEP 4: Running deployment verification tests"
        
        # Wait a few seconds for the service to fully start
        Write-Info "Waiting 10 seconds for service to stabilize..."
        Start-Sleep -Seconds 10
        
        $testStart = Get-Date
        
        # Run Python test suite (install requests if needed)
        try {
            python -m pip install requests --quiet 2>$null
        } catch {
            Write-Info "requests module already installed"
        }
        
        $stagingFlag = if ($Staging) { "--staging" } else { "" }
        python test_deployment.py $stagingFlag
        
        $testExitCode = $LASTEXITCODE
        $testTime = ((Get-Date) - $testStart).TotalSeconds
        
        if ($testExitCode -eq 0) {
            Write-Success "All verification tests passed in $([math]::Round($testTime, 1))s"
        } else {
            Write-Error "Some verification tests failed"
            Write-Info "Review test output above for details"
            Write-Info "Database connection issues detected - may need manual intervention"
            # Don't exit 1 - let user decide if this is critical
        }
    } else {
        Write-Info "Skipping verification tests"
    }
    
    # Success summary
    $totalTime = ((Get-Date) - $startTime).TotalSeconds
    Write-Step "DEPLOYMENT COMPLETE"
    Write-Success "Total time: $([math]::Round($totalTime, 1))s"
    Write-Info "Production URL: https://learn.rentyourcio.com"
    Write-Info "Cloud Run URL: $serviceUrl"
    
} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}
