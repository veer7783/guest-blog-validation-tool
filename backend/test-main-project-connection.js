const axios = require('axios');

async function testConnection() {
  try {
    console.log('\n=== Testing Main Project Connection ===\n');
    
    const baseURL = process.env.MAIN_PROJECT_API_URL?.replace('/api/guest-sites-api', '') || 'http://localhost:3001';
    console.log('Base URL:', baseURL);
    
    // Test 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: process.env.MAIN_PROJECT_SERVICE_EMAIL || 'validation-service@usehypwave.com',
      password: process.env.MAIN_PROJECT_SERVICE_PASSWORD || '3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
      
      const token = loginResponse.data.token;
      
      // Test 2: Test bulk import endpoint
      console.log('\n2. Testing bulk-import endpoint...');
      const testSite = {
        site_url: 'test-validation-tool.com',
        publisher_email: 'test@example.com',
        publisher_name: 'Test Publisher',
        da: 50,
        dr: 45,
        ahrefs_traffic: 10000,
        category: 'GENERAL',
        country: 'US',
        site_language: 'en',
        tat: '3-5 days',
        base_price: 100,
        status: 'ACTIVE',
        negotiation_status: 'DONE'
      };
      
      const importResponse = await axios.post(
        `${baseURL}/api/guest-sites-api/bulk-import`,
        {
          sites: [testSite],
          autoCreatePublisher: true,
          source: 'validation-tool-test'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Bulk import endpoint accessible');
      console.log('Response:', JSON.stringify(importResponse.data, null, 2));
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Main project is not running!');
      console.error('Please start the main project on http://localhost:3001');
    }
  }
}

testConnection();
