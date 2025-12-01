# Test Duplicate Check for techcrunch.com in Main Project

Write-Host "🔍 Testing Main Project API Duplicate Check for techcrunch.com`n" -ForegroundColor Cyan

$baseURL = "http://localhost:3001"
$apiURL = "http://localhost:3001/api/guest-sites-api"
$email = "validation-service@usehypwave.com"
$password = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"

Write-Host "📡 Main Project Base URL: $baseURL" -ForegroundColor Yellow
Write-Host "📡 API URL: $apiURL`n" -ForegroundColor Yellow

try {
    # Step 1: Login
    Write-Host "Step 1: Logging in to Main Project..." -ForegroundColor Green
    
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseURL/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    if (-not $loginResponse.token) {
        Write-Host "❌ Login failed - no token received" -ForegroundColor Red
        exit 1
    }
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful, token received`n" -ForegroundColor Green
    
    # Step 2: Check duplicates
    Write-Host "Step 2: Checking if techcrunch.com exists in Main Project..." -ForegroundColor Green
    
    $checkBody = @{
        domains = @("techcrunch.com", "https://techcrunch.com", "www.techcrunch.com")
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $duplicateResponse = Invoke-RestMethod -Uri "$apiURL/check-duplicates" `
        -Method Post `
        -Body $checkBody `
        -Headers $headers
    
    Write-Host "`n📊 API Response:" -ForegroundColor Cyan
    $duplicateResponse | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($duplicateResponse.success -and $duplicateResponse.data) {
        $data = $duplicateResponse.data
        
        Write-Host "`n📋 Results:" -ForegroundColor Cyan
        Write-Host "Existing Domains: $($data.existingDomains -join ', ')" -ForegroundColor Yellow
        Write-Host "New Domains: $($data.newDomains -join ', ')" -ForegroundColor Yellow
        
        if ($data.existingSites -and $data.existingSites.Count -gt 0) {
            Write-Host "`n🔍 Existing Sites Details:" -ForegroundColor Cyan
            foreach ($site in $data.existingSites) {
                Write-Host "  - ID: $($site.id)" -ForegroundColor White
                Write-Host "    URL: $($site.site_url)" -ForegroundColor White
                Write-Host "    Status: $($site.status)`n" -ForegroundColor White
            }
        }
        
        # Check if techcrunch.com is in existing domains
        $isTechCrunchDuplicate = $false
        if ($data.existingDomains) {
            $isTechCrunchDuplicate = $data.existingDomains | Where-Object { $_ -like "*techcrunch.com*" }
        }
        
        Write-Host "`n🎯 Final Result:" -ForegroundColor Cyan
        if ($isTechCrunchDuplicate) {
            Write-Host "✅ techcrunch.com EXISTS in Main Project - Should be SKIPPED" -ForegroundColor Green
        } else {
            Write-Host "❌ techcrunch.com NOT FOUND in Main Project - Would be added" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Data: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n✅ Test completed" -ForegroundColor Green
