# Test 2FA Login Script

Write-Host "`n🧪 Testing 2FA Login Flow`n" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Step 1: Try login without 2FA code
Write-Host "`n📝 Step 1: Login without 2FA code (should ask for 2FA)...`n" -ForegroundColor Yellow

$loginBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post -ContentType "application/json" -Body $loginBody
    
    if ($response.data.requiresTwoFactor) {
        Write-Host "✅ Correct! Server is asking for 2FA code" -ForegroundColor Green
        Write-Host "   Response: requiresTwoFactor = true`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Unexpected: 2FA not required (is 2FA enabled?)`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Step 2: Login with 2FA code
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`n📝 Step 2: Login with 2FA code...`n" -ForegroundColor Yellow

Write-Host "📱 Open Google Authenticator on your phone" -ForegroundColor White
Write-Host "   Look for: Guest Blog Validation (superadmin@guestblog.com)`n" -ForegroundColor White

$code = Read-Host "Enter the 6-digit code from Google Authenticator"

if ($code.Length -ne 6) {
    Write-Host "`n❌ Error: Code must be exactly 6 digits`n" -ForegroundColor Red
    exit 1
}

$login2faBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = $code
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post -ContentType "application/json" -Body $login2faBody
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ 2FA LOGIN SUCCESSFUL!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
    Write-Host "`n📊 User Information:" -ForegroundColor Cyan
    Write-Host "  • Email: $($response.data.user.email)" -ForegroundColor White
    Write-Host "  • Name: $($response.data.user.firstName) $($response.data.user.lastName)" -ForegroundColor White
    Write-Host "  • Role: $($response.data.user.role)" -ForegroundColor White
    Write-Host "  • Active: $($response.data.user.isActive)`n" -ForegroundColor White
    
    Write-Host "🔑 JWT Token (first 50 chars):" -ForegroundColor Cyan
    Write-Host "  $($response.data.token.Substring(0, 50))...`n" -ForegroundColor Gray
    
    # Save token for further testing
    $global:token = $response.data.token
    $global:headers = @{ Authorization = "Bearer $global:token" }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🎉 2FA is working perfectly!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`n📋 What you can do now:" -ForegroundColor Yellow
    Write-Host "  1. Test backup code login: .\test-backup-code.ps1" -ForegroundColor White
    Write-Host "  2. View activity logs to see 2FA events" -ForegroundColor White
    Write-Host "  3. Regenerate backup codes if needed" -ForegroundColor White
    Write-Host "  4. Continue to Phase 5 (CSV Upload)`n" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ 2FA Login Failed:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Invalid 2FA code*") {
        Write-Host "💡 Tips:" -ForegroundColor Yellow
        Write-Host "   • Make sure your phone's time is set to automatic" -ForegroundColor White
        Write-Host "   • Wait for the next code (codes change every 30 seconds)" -ForegroundColor White
        Write-Host "   • Try using a backup code instead`n" -ForegroundColor White
    }
    
    exit 1
}
