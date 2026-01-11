# Fix Cloud SQL Permissions for flashcards_user
# Run this script to grant database permissions

$adminPassword = Read-Host -Prompt "Enter the 'sqlserver' admin password" -AsSecureString
$adminPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

Write-Host ""
Write-Host "Connecting to Cloud SQL and granting permissions..."
Write-Host ""

sqlcmd -S "35.224.242.223,1433" -U "sqlserver" -P $adminPwd -i "fix-sql-permissions.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Permissions granted successfully!"
    Write-Host ""
    Write-Host "Now redeploying Cloud Run service..."
    
    gcloud run services update super-flashcards `
        --region us-central1 `
        --project super-flashcards-475210 `
        --update-secrets=SQL_PASSWORD=db-password:15
    
    Write-Host ""
    Write-Host "✅ All fixed! Your application should now work."
}
