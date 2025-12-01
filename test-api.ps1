# Test Main Project API - Check Duplicates Endpoint

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Testing Main Project API - Check Duplicates              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Configuration
$apiUrl = "http://localhost:3001/api/guest-sites-api/check-duplicates"
$serviceEmail = "validation-service@usehypwave.com"
$servicePassword = "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   API URL: $apiUrl"
Write-Host "   Service Email: $serviceEmail`n"

# Test data
$body = @{
    websiteUrls = @("example.com", "test.com", "google.com")
} | ConvertTo-Json

Write-Host "🧪 Test Domains: example.com, test.com, google.com" -ForegroundColor Yellow
Write-Host "`n⏳ Sending request...`n" -ForegroundColor Yellow

# Create credentials
$securePassword = ConvertTo-SecureString $servicePassword -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($serviceEmail, $securePassword)

try {
    # Make API request
    $response = Invoke-RestMethod -Uri $apiUrl `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -Credential $credential `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS! API is working!`n" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "📊 Response:" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    Write-Host "Success: $($response.success)"
    Write-Host "`nResults:"
    
    if ($response.data) {
        $index = 1
        foreach ($result in $response.data) {
            Write-Host "`n$index. $($result.websiteUrl)"
            if ($result.isDuplicate) {
                Write-Host "   Is Duplicate: ✅ YES (exists in main project)" -ForegroundColor Yellow
                if ($result.existingId) {
                    Write-Host "   Existing ID: $($result.existingId)"
                }
            } else {
                Write-Host "   Is Duplicate: ❌ NO (new domain)" -ForegroundColor Green
            }
            $index++
        }
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "`n✅ Main Project API is WORKING correctly!" -ForegroundColor Green
    Write-Host "✅ The check-duplicates endpoint is accessible and responding.`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR! API is NOT working!`n" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "📊 Error Details:" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Server Error:" -ForegroundColor Red
        Write-Host "   Status Code: $statusCode"
        Write-Host "   Message: $($_.Exception.Message)"
    } else {
        Write-Host "❌ Connection Error:" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)"
        Write-Host "`n   Possible reasons:"
        Write-Host "   - Main project server is not running on port 3001"
        Write-Host "   - Wrong API URL"
        Write-Host "   - Network/firewall issues"
        Write-Host "   - Service account credentials are invalid"
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "`n🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if main project server is running on port 3001"
    Write-Host "   2. Verify the API endpoint exists: POST /api/guest-sites-api/check-duplicates"
    Write-Host "   3. Verify service account credentials in backend/.env"
    Write-Host "   4. Check if main project accepts Basic Auth"
    Write-Host "   5. Test main project health: http://localhost:3001/api/health"
    Write-Host ""
}
