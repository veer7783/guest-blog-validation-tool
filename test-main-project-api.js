/**
 * Test Main Project API - Check Duplicates Endpoint
 * 
 * This script tests if the main project API is accessible and working
 */

const axios = require('axios');

// Configuration (update these with your actual values)
const MAIN_PROJECT_API_URL = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3001/api/guest-sites-api';
const SERVICE_EMAIL = process.env.MAIN_PROJECT_SERVICE_EMAIL || 'validation-service@usehypwave.com';
const SERVICE_PASSWORD = process.env.MAIN_PROJECT_SERVICE_PASSWORD || '3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Testing Main Project API - Check Duplicates              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log(`   API URL: ${MAIN_PROJECT_API_URL}`);
console.log(`   Service Email: ${SERVICE_EMAIL}`);
console.log(`   Endpoint: POST /check-duplicates\n`);

// Test data
const testDomains = [
  'example.com',
  'test.com',
  'google.com'
];

console.log('🧪 Test Domains:', testDomains.join(', '));
console.log('\n⏳ Sending request...\n');

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: MAIN_PROJECT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: SERVICE_EMAIL,
    password: SERVICE_PASSWORD
  }
});

// Test the API
async function testAPI() {
  try {
    const response = await apiClient.post('/check-duplicates', {
      websiteUrls: testDomains
    });

    console.log('✅ SUCCESS! API is working!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('\nResults:');
    
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.websiteUrl}`);
        console.log(`   Is Duplicate: ${result.isDuplicate ? '✅ YES (exists in main project)' : '❌ NO (new domain)'}`);
        if (result.existingId) {
          console.log(`   Existing ID: ${result.existingId}`);
        }
      });
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Main Project API is WORKING correctly!');
    console.log('✅ The check-duplicates endpoint is accessible and responding.');
    
  } catch (error) {
    console.log('❌ ERROR! API is NOT working!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Error Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (error.response) {
      // Server responded with error
      console.log('❌ Server Error:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
      console.log(`   Data:`, error.response.data);
    } else if (error.request) {
      // No response received
      console.log('❌ Connection Error:');
      console.log('   No response received from server');
      console.log('   Possible reasons:');
      console.log('   - Main project server is not running');
      console.log('   - Wrong API URL');
      console.log('   - Network/firewall issues');
      console.log(`   - Trying to connect to: ${MAIN_PROJECT_API_URL}`);
    } else {
      // Other error
      console.log('❌ Request Error:');
      console.log(`   ${error.message}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if main project server is running');
    console.log('   2. Verify MAIN_PROJECT_API_URL in backend/.env');
    console.log('   3. Verify service account credentials');
    console.log('   4. Check if endpoint exists in main project');
    console.log('   5. Check network connectivity\n');
    
    process.exit(1);
  }
}

// Run the test
testAPI();
