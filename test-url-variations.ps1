# Test different URL variations for techcrunch.com

Write-Host "Testing URL variations for techcrunch.com..." -ForegroundColor Cyan

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

# Test different variations
$variations = @(
    "techcrunch.com",
    "https://techcrunch.com",
    "https://techcrunch.com/",
    "http://techcrunch.com",
    "www.techcrunch.com"
)

foreach ($url in $variations) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "Testing: $url" -ForegroundColor Cyan
    
    $checkBody = @{
        domains = @($url)
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$apiURL/check-duplicates" -Method Post -Body $checkBody -Headers $headers
        
        Write-Host "Existing: $($response.data.existing)" -ForegroundColor $(if ($response.data.existing -gt 0) { "Green" } else { "Red" })
        Write-Host "New: $($response.data.new)" -ForegroundColor Yellow
        
        if ($response.data.existingDomains.Count -gt 0) {
            Write-Host "✅ Found as DUPLICATE" -ForegroundColor Green
            Write-Host "Existing domains: $($response.data.existingDomains -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "❌ NOT found (would be added as new)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Summary: Check which variation matches the database format" -ForegroundColor Cyan
