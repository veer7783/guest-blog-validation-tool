# Simple test for techcrunch.com duplicate check

Write-Host "Testing Main Project API for techcrunch.com..." -ForegroundColor Cyan

$baseURL = "http://localhost:3001"
$apiURL = "http://localhost:3001/api/guest-sites-api"

# Step 1: Login
Write-Host "`nStep 1: Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "validation-service@usehypwave.com"
    password = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseURL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful!" -ForegroundColor Green
}
catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Check duplicate
Write-Host "`nStep 2: Checking techcrunch.com..." -ForegroundColor Yellow
$checkBody = @{
    domains = @("techcrunch.com")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $checkBody -Headers $headers
    
    Write-Host "`nAPI Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
    Write-Host "`nExisting Domains:" -ForegroundColor Yellow
    $response.data.existingDomains
    
    Write-Host "`nNew Domains:" -ForegroundColor Yellow
    $response.data.newDomains
    
    if ($response.data.existingDomains -contains "techcrunch.com") {
        Write-Host "`n✅ techcrunch.com EXISTS - Should be SKIPPED" -ForegroundColor Green
    }
    else {
        Write-Host "`n❌ techcrunch.com NOT FOUND - Would be added" -ForegroundColor Red
    }
}
catch {
    Write-Host "API call failed: $($_.Exception.Message)" -ForegroundColor Red
}
