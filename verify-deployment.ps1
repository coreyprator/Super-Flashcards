#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick verification of current deployment

.DESCRIPTION
    Runs deployment verification tests without building/deploying.
    Use this to check if the currently deployed version is working.

.PARAMETER Staging
    Test staging URL instead of production

.EXAMPLE
    .\verify-deployment.ps1
    
.EXAMPLE
    .\verify-deployment.ps1 -Staging
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Staging
)

Write-Host "`n🔍 Running deployment verification tests..." -ForegroundColor Cyan
Write-Host ("="*80) -ForegroundColor Cyan

$stagingFlag = if ($Staging) { "--staging" } else { "" }
python test_deployment.py $stagingFlag

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Review output above." -ForegroundColor Red
    exit 1
}
