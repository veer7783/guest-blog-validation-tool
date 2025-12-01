# Test Main Project API

Write-Host "Testing Main Project API - Check Duplicates Endpoint" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:3001/api/guest-sites-api/check-duplicates"
$serviceEmail = "validation-service@usehypwave.com"
$servicePassword = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"

Write-Host "API URL: $apiUrl" -ForegroundColor Yellow
Write-Host "Service Email: $serviceEmail" -ForegroundColor Yellow
Write-Host ""

$body = @{
    websiteUrls = @("example.com", "test.com")
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host ""

$securePassword = ConvertTo-SecureString $servicePassword -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($serviceEmail, $securePassword)

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -Credential $credential -ErrorAction Stop
    
    Write-Host "SUCCESS! API is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    Write-Host "Success: $($response.success)"
    Write-Host ""
    
    if ($response.data) {
        Write-Host "Results:" -ForegroundColor Green
        foreach ($result in $response.data) {
            Write-Host "  Domain: $($result.websiteUrl)"
            Write-Host "  Is Duplicate: $($result.isDuplicate)"
            if ($result.existingId) {
                Write-Host "  Existing ID: $($result.existingId)"
            }
            Write-Host ""
        }
    }
    
    Write-Host "Main Project API is WORKING correctly!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR! API is NOT working!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  1. Main project server is not running on port 3001"
    Write-Host "  2. Wrong API URL or endpoint"
    Write-Host "  3. Invalid service account credentials"
    Write-Host "  4. Network/firewall issues"
    Write-Host ""
}
