# Test Backup Code Login Script

Write-Host "`n🔐 Testing Backup Code Login`n" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n⚠️  WARNING: Backup codes can only be used ONCE!" -ForegroundColor Yellow
Write-Host "   After using a code, it will be permanently removed.`n" -ForegroundColor Yellow

# Show available backup codes
if (Test-Path "2fa_backup_codes.txt") {
    Write-Host "📋 Your backup codes (from 2fa_backup_codes.txt):" -ForegroundColor Cyan
    Get-Content "2fa_backup_codes.txt" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    Write-Host ""
} else {
    Write-Host "⚠️  Backup codes file not found. Check your saved codes.`n" -ForegroundColor Yellow
}

$confirm = Read-Host "Do you want to test a backup code? (y/n)"

if ($confirm -ne "y") {
    Write-Host "`nTest cancelled.`n" -ForegroundColor Yellow
    exit 0
}

$backupCode = Read-Host "`nEnter one of your backup codes (8 characters)"

if ($backupCode.Length -ne 8) {
    Write-Host "`n❌ Error: Backup code must be exactly 8 characters`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔄 Testing login with backup code...`n" -ForegroundColor Cyan

$loginBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = $backupCode.ToUpper()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post -ContentType "application/json" -Body $loginBody
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ BACKUP CODE LOGIN SUCCESSFUL!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
    Write-Host "`n⚠️  This backup code has been used and removed." -ForegroundColor Yellow
    Write-Host "   You have 9 backup codes remaining.`n" -ForegroundColor Yellow
    
    Write-Host "🔑 JWT Token received (first 50 chars):" -ForegroundColor Cyan
    Write-Host "  $($response.data.token.Substring(0, 50))...`n" -ForegroundColor Gray
    
    # Check remaining backup codes
    $global:token = $response.data.token
    $global:headers = @{ Authorization = "Bearer $global:token" }
    
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/status" `
        -Method Get -Headers $global:headers
    
    Write-Host "📊 2FA Status:" -ForegroundColor Cyan
    Write-Host "  • Backup Codes Remaining: $($status.data.backupCodesRemaining)`n" -ForegroundColor White
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "💡 Tip: Regenerate backup codes when running low!" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`nTo regenerate backup codes, run:" -ForegroundColor White
    Write-Host '  $regenBody = @{ password = "Admin@123" } | ConvertTo-Json' -ForegroundColor Gray
    Write-Host '  Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/regenerate-backup-codes" -Method Post -Headers $global:headers -ContentType "application/json" -Body $regenBody' -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "`n❌ Backup Code Login Failed:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    
    Write-Host "💡 Possible reasons:" -ForegroundColor Yellow
    Write-Host "   • Code already used (backup codes are one-time use)" -ForegroundColor White
    Write-Host "   • Incorrect code (check your saved codes)" -ForegroundColor White
    Write-Host "   • Code is case-sensitive (try uppercase)`n" -ForegroundColor White
    
    exit 1
}
