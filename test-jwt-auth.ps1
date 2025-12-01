# Test JWT Authentication with Main Project API

Write-Host "Testing JWT Authentication with Main Project" -ForegroundColor Cyan
Write-Host ""

$mainProjectUrl = "http://localhost:3001"
$serviceEmail = "validation-service@usehypwave.com"
$servicePassword = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"

Write-Host "Step 1: Login to get JWT token" -ForegroundColor Yellow
Write-Host "URL: $mainProjectUrl/api/auth/login" -ForegroundColor Gray
Write-Host ""

try {
    # Step 1: Login
    $loginBody = @{
        email = $serviceEmail
        password = $servicePassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$mainProjectUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    if ($loginResponse.token) {
        Write-Host "SUCCESS! Got JWT token" -ForegroundColor Green
        Write-Host "Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host ""
        
        $token = $loginResponse.token
        $headers = @{
            Authorization = "Bearer $token"
        }
        
        # Step 2: Test check-duplicates
        Write-Host "Step 2: Test check-duplicates endpoint" -ForegroundColor Yellow
        Write-Host "URL: $mainProjectUrl/api/guest-sites-api/check-duplicates" -ForegroundColor Gray
        Write-Host ""
        
        $checkBody = @{
            domains = @("example.com", "test.com")
        } | ConvertTo-Json
        
        $checkResponse = Invoke-RestMethod -Uri "$mainProjectUrl/api/guest-sites-api/check-duplicates" -Method POST -Headers $headers -Body $checkBody -ContentType "application/json" -ErrorAction Stop
        
        Write-Host "SUCCESS! check-duplicates working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Green
        Write-Host "  Total: $($checkResponse.data.total)"
        Write-Host "  Existing: $($checkResponse.data.existing)"
        Write-Host "  New: $($checkResponse.data.new)"
        Write-Host "  Existing Domains: $($checkResponse.data.existingDomains -join ', ')"
        Write-Host "  New Domains: $($checkResponse.data.newDomains -join ', ')"
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Main Project API is working correctly with JWT authentication!" -ForegroundColor Green
        Write-Host "The validation tool will now be able to check duplicates." -ForegroundColor Green
        
    } else {
        Write-Host "ERROR: No token received from login" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure main project server is running on port 3001"
    Write-Host "  2. Verify service account credentials"
    Write-Host "  3. Check if login endpoint exists: POST /api/auth/login"
    Write-Host ""
}
