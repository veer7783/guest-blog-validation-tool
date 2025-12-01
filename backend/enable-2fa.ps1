# Enable 2FA Script
# Run this after scanning the QR code with Google Authenticator

Write-Host "`n🔐 Enable 2FA for Guest Blog Validation Tool`n" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Check if token exists
if (-not $global:token) {
    Write-Host "`n⚠️  No active session found. Logging in...`n" -ForegroundColor Yellow
    
    $loginBody = @{
        email = "superadmin@guestblog.com"
        password = "Admin@123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post -ContentType "application/json" -Body $loginBody
    
    $global:token = $loginResponse.data.token
    $global:headers = @{ Authorization = "Bearer $global:token" }
    
    Write-Host "✅ Login successful!`n" -ForegroundColor Green
}

# Prompt for 2FA code
Write-Host "📱 Open Google Authenticator on your phone" -ForegroundColor White
Write-Host "   Look for: Guest Blog Validation (superadmin@guestblog.com)`n" -ForegroundColor White

$code = Read-Host "Enter the 6-digit code from Google Authenticator"

if ($code.Length -ne 6) {
    Write-Host "`n❌ Error: Code must be exactly 6 digits`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔄 Enabling 2FA...`n" -ForegroundColor Cyan

try {
    $enableBody = @{ code = $code } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/enable" `
        -Method Post -Headers $global:headers `
        -ContentType "application/json" -Body $enableBody
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ 2FA ENABLED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
    Write-Host "`n📊 Checking 2FA status...`n" -ForegroundColor Cyan
    
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/status" `
        -Method Get -Headers $global:headers
    
    Write-Host "Status:" -ForegroundColor White
    Write-Host "  • 2FA Enabled: $($status.data.isEnabled)" -ForegroundColor $(if ($status.data.isEnabled) { "Green" } else { "Red" })
    Write-Host "  • Has Backup Codes: $($status.data.hasBackupCodes)" -ForegroundColor $(if ($status.data.hasBackupCodes) { "Green" } else { "Red" })
    Write-Host "  • Backup Codes Remaining: $($status.data.backupCodesRemaining)`n" -ForegroundColor White
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🧪 NEXT: Test 2FA Login" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`nRun this command to test 2FA login:" -ForegroundColor White
    Write-Host "  .\test-2fa-login.ps1`n" -ForegroundColor Yellow
    
    Write-Host "Or manually test:" -ForegroundColor White
    Write-Host '  $loginBody = @{' -ForegroundColor Gray
    Write-Host '      email = "superadmin@guestblog.com"' -ForegroundColor Gray
    Write-Host '      password = "Admin@123"' -ForegroundColor Gray
    Write-Host '      twoFactorCode = "123456"  # Current code from app' -ForegroundColor Gray
    Write-Host '  } | ConvertTo-Json' -ForegroundColor Gray
    Write-Host '  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody' -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "`n❌ Error enabling 2FA:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Invalid verification code*") {
        Write-Host "💡 Tips:" -ForegroundColor Yellow
        Write-Host "   • Make sure your phone's time is set to automatic" -ForegroundColor White
        Write-Host "   • Wait for the next code (codes change every 30 seconds)" -ForegroundColor White
        Write-Host "   • Ensure you scanned the correct QR code`n" -ForegroundColor White
    }
    
    exit 1
}
