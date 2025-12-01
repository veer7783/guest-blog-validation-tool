const axios = require('axios');

async function testDuplicateCheck() {
  try {
    console.log('🔍 Testing Main Project API Duplicate Check for techcrunch.com\n');
    
    const baseURL = process.env.MAIN_PROJECT_API_URL?.replace('/api/guest-sites-api', '') || 'http://localhost:3001';
    const apiURL = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3001/api/guest-sites-api';
    
    console.log('📡 Main Project Base URL:', baseURL);
    console.log('📡 API URL:', apiURL);
    console.log('');
    
    // Step 1: Login to get token
    console.log('Step 1: Logging in to Main Project...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: process.env.MAIN_PROJECT_SERVICE_EMAIL || 'validation-service@usehypwave.com',
      password: process.env.MAIN_PROJECT_SERVICE_PASSWORD || '3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928'
    });
    
    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received\n');
    
    // Step 2: Check duplicate for techcrunch.com
    console.log('Step 2: Checking if techcrunch.com exists in Main Project...');
    const duplicateResponse = await axios.post(
      `${apiURL}/check-duplicates`,
      { domains: ['techcrunch.com', 'https://techcrunch.com', 'www.techcrunch.com'] },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n📊 API Response:');
    console.log(JSON.stringify(duplicateResponse.data, null, 2));
    
    if (duplicateResponse.data.success && duplicateResponse.data.data) {
      const data = duplicateResponse.data.data;
      
      console.log('\n📋 Results:');
      console.log('Existing Domains:', data.existingDomains);
      console.log('New Domains:', data.newDomains);
      
      if (data.existingSites && data.existingSites.length > 0) {
        console.log('\n🔍 Existing Sites Details:');
        data.existingSites.forEach(site => {
          console.log(`  - ID: ${site.id}`);
          console.log(`    URL: ${site.site_url}`);
          console.log(`    Status: ${site.status}`);
          console.log('');
        });
      }
      
      // Check if techcrunch.com is in existing domains
      const isTechCrunchDuplicate = data.existingDomains?.some(domain => 
        domain.toLowerCase().includes('techcrunch.com')
      );
      
      console.log('\n🎯 Final Result:');
      if (isTechCrunchDuplicate) {
        console.log('✅ techcrunch.com EXISTS in Main Project - Should be SKIPPED');
      } else {
        console.log('❌ techcrunch.com NOT FOUND in Main Project - Would be added');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testDuplicateCheck();
