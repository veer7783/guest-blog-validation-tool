# Debug test for Main Project API

Write-Host "=== Main Project API Debug Test ===" -ForegroundColor Cyan

$baseURL = "http://localhost:3001"
$apiURL = "http://localhost:3001/api/guest-sites-api"

# Login
$loginBody = @{
    email = "validation-service@usehypwave.com"
    password = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseURL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Check with exact database format
Write-Host "`n--- Test 1: Exact database format ---" -ForegroundColor Yellow
$test1 = @{ domains = @("https://techcrunch.com/") } | ConvertTo-Json
$response1 = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $test1 -Headers $headers
Write-Host "Input: https://techcrunch.com/"
Write-Host "Existing: $($response1.data.existing)" -ForegroundColor $(if ($response1.data.existing -gt 0) { "Green" } else { "Red" })
Write-Host "Existing Domains: $($response1.data.existingDomains -join ', ')"

# Test 2: Without trailing slash
Write-Host "`n--- Test 2: Without trailing slash ---" -ForegroundColor Yellow
$test2 = @{ domains = @("https://techcrunch.com") } | ConvertTo-Json
$response2 = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $test2 -Headers $headers
Write-Host "Input: https://techcrunch.com"
Write-Host "Existing: $($response2.data.existing)" -ForegroundColor $(if ($response2.data.existing -gt 0) { "Green" } else { "Red" })
Write-Host "Existing Domains: $($response2.data.existingDomains -join ', ')"

# Test 3: Just domain
Write-Host "`n--- Test 3: Just domain name ---" -ForegroundColor Yellow
$test3 = @{ domains = @("techcrunch.com") } | ConvertTo-Json
$response3 = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $test3 -Headers $headers
Write-Host "Input: techcrunch.com"
Write-Host "Existing: $($response3.data.existing)" -ForegroundColor $(if ($response3.data.existing -gt 0) { "Green" } else { "Red" })
Write-Host "Existing Domains: $($response3.data.existingDomains -join ', ')"

# Test 4: Check if endpoint is even hitting the database
Write-Host "`n--- Test 4: Test with known non-existent domain ---" -ForegroundColor Yellow
$test4 = @{ domains = @("this-domain-definitely-does-not-exist-12345.com") } | ConvertTo-Json
$response4 = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $test4 -Headers $headers
Write-Host "Input: this-domain-definitely-does-not-exist-12345.com"
Write-Host "Existing: $($response4.data.existing)" -ForegroundColor Yellow
Write-Host "New: $($response4.data.new)" -ForegroundColor Yellow

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If ALL tests show 'Existing: 0', the API fix may not be applied or server not restarted" -ForegroundColor Yellow
Write-Host "Check:" -ForegroundColor Yellow
Write-Host "  1. Did you restart the Main Project server?" -ForegroundColor White
Write-Host "  2. Is the fix in the correct file/endpoint?" -ForegroundColor White
Write-Host "  3. Are there any errors in the Main Project console?" -ForegroundColor White
