# Test with all URL variations sent together

Write-Host "Testing with all variations sent together..." -ForegroundColor Cyan

$baseURL = "http://localhost:3001"
$apiURL = "http://localhost:3001/api/guest-sites-api"

# Login
$loginBody = @{
    email = "validation-service@usehypwave.com"
    password = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseURL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Send all variations at once
$checkBody = @{
    domains = @(
        "techcrunch.com",
        "https://techcrunch.com",
        "https://techcrunch.com/",
        "http://techcrunch.com",
        "www.techcrunch.com"
    )
} | ConvertTo-Json

Write-Host "`nSending all variations together..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $checkBody -Headers $headers

Write-Host "`nFull Response:" -ForegroundColor Cyan
$response | ConvertTo-Json -Depth 5

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Existing Domains:" -ForegroundColor Green
if ($response.data.existingDomains) {
    $response.data.existingDomains | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
} else {
    Write-Host "  (none)" -ForegroundColor Red
}

Write-Host "`nExisting Sites:" -ForegroundColor Green
if ($response.data.existingSites) {
    $response.data.existingSites | ForEach-Object { 
        Write-Host "  - ID: $($_.id), URL: $($_.site_url)" -ForegroundColor Green 
    }
} else {
    Write-Host "  (none)" -ForegroundColor Red
}

Write-Host "`nNew Domains:" -ForegroundColor Yellow
if ($response.data.newDomains) {
    $response.data.newDomains | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
} else {
    Write-Host "  (none)" -ForegroundColor Yellow
}
