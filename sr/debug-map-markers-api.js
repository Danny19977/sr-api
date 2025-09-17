/**
 * Debug script for Map Markers API endpoint
 * This script helps identify the exact cause of the 500 error
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://127.0.0.1:8001/api';  // Using localhost IP from error log
const endpoint = '/visite-data/map-markers';

// Function to test the API endpoint
async function debugMapMarkersAPI() {
  console.log('🔍 Debug Map Markers API Endpoint');
  console.log('====================================');
  console.log(`Target URL: ${API_BASE_URL}${endpoint}`);
  console.log('');

  try {
    // First, test without authentication to see if endpoint exists
    console.log('1️⃣ Testing endpoint without authentication...');
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      timeout: 10000,
      validateStatus: (status) => status < 600 // Accept all status codes
    });

    console.log(`✅ Response Status: ${response.status}`);
    console.log(`📄 Response Headers:`, response.headers);
    console.log(`📦 Response Data:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔐 Authentication required. Testing with mock token...');
      await testWithAuthentication();
    }
  }
}

// Function to test with authentication
async function testWithAuthentication() {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': 'Bearer mock-token-for-testing',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000,
      validateStatus: (status) => status < 600
    });

    console.log(`✅ Auth Response Status: ${response.status}`);
    console.log(`📦 Auth Response Data:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Auth Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Function to test basic connectivity
async function testBasicConnectivity() {
  console.log('\n2️⃣ Testing basic API connectivity...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
      validateStatus: (status) => status < 600
    });
    console.log(`✅ Health check status: ${response.status}`);
  } catch (error) {
    console.log('❌ Basic connectivity failed:', error.message);
    
    // Try alternative URLs
    const alternatives = [
      'http://localhost:8001/api',
      'http://127.0.0.1:8001',
      'http://localhost:8001'
    ];
    
    for (const alt of alternatives) {
      try {
        console.log(`Trying: ${alt}/health`);
        const resp = await axios.get(`${alt}/health`, { timeout: 3000 });
        console.log(`✅ Alternative URL works: ${alt} (Status: ${resp.status})`);
        return;
      } catch (e) {
        console.log(`❌ ${alt} failed`);
      }
    }
  }
}

// Function to suggest solutions
function suggestSolutions() {
  console.log('\n💡 Suggested Solutions:');
  console.log('=======================');
  console.log('1. Check if backend server is running on port 8001');
  console.log('2. Verify database connection in backend');
  console.log('3. Check if visite_data table exists and has correct structure');
  console.log('4. Verify JWT middleware is properly configured');
  console.log('5. Check backend logs for detailed error information');
  console.log('6. Ensure Go dependencies are installed (go mod tidy)');
  console.log('7. Verify database schema matches the SQL query in GetMapMarkers');
  console.log('\n📝 Backend table structure should include:');
  console.log('   - visite_data table (or visite_datas)');
  console.log('   - countries table');
  console.log('   - provinces table');
  console.log('   - areas table');
  console.log('   - Required joins for country_name, province_name, area_name');
}

// Main execution
async function main() {
  await debugMapMarkersAPI();
  await testBasicConnectivity();
  suggestSolutions();
}

main().catch(console.error);
