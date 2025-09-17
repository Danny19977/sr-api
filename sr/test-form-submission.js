// Test script for form submission API endpoints
// Run this with: node test-form-submission.js

const API_BASE_URL = 'http://localhost:8000/api';

// Test the form submission endpoint
async function testFormSubmission() {
  console.log('🧪 Testing Form Submission API...');
  
  try {
    // Step 1: Test getting forms
    console.log('\n1. Testing GET /forms/all');
    const formsResponse = await fetch(`${API_BASE_URL}/forms/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if you have one
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    if (!formsResponse.ok) {
      throw new Error(`HTTP ${formsResponse.status}: ${formsResponse.statusText}`);
    }
    
    const formsData = await formsResponse.json();
    console.log('✅ Forms API Response:', formsData);
    
    if (formsData.status === 'success' && formsData.data && formsData.data.length > 0) {
      const testForm = formsData.data[0];
      console.log(`📋 Using test form: ${testForm.title} (${testForm.uuid})`);
      
      // Step 2: Test form submission (VisiteHarder creation)
      console.log('\n2. Testing POST /public/form-submissions');
      const submissionData = {
        form_uuid: testForm.uuid,
        submitter_name: 'Test User',
        submitter_email: 'test@example.com',
        status: 'submitted',
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      const submissionResponse = await fetch(`${API_BASE_URL}/public/form-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        throw new Error(`HTTP ${submissionResponse.status}: ${errorText}`);
      }
      
      const submissionResult = await submissionResponse.json();
      console.log('✅ Form Submission Response:', submissionResult);
      
      if (submissionResult.status === 'success' && submissionResult.data) {
        const submissionUuid = submissionResult.data.uuid;
        console.log(`📝 Created submission with UUID: ${submissionUuid}`);
        
        // Step 3: Test bulk response submission
        console.log('\n3. Testing POST /public/form-responses/bulk');
        
        // Get form items to create responses
        console.log('\n3a. Getting form items');
        const itemsResponse = await fetch(`${API_BASE_URL}/public/forms/${testForm.uuid}/items`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          console.log('✅ Form Items Response:', itemsData);
          
          if (itemsData.status === 'success' && itemsData.data && itemsData.data.length > 0) {
            const testResponses = itemsData.data.slice(0, 2).map((item, index) => ({
              visite_harder_uuid: submissionUuid,
              form_item_uuid: item.uuid,
              text_value: `Test response ${index + 1}`,
              entry_order: index + 1,
              entry_label: `Test Entry ${index + 1}`,
              latitude: 40.7128,
              longitude: -74.0060
            }));
            
            const bulkData = {
              visite_harder_uuid: submissionUuid,
              responses: testResponses
            };
            
            const bulkResponse = await fetch(`${API_BASE_URL}/public/form-responses/bulk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(bulkData)
            });
            
            if (!bulkResponse.ok) {
              const errorText = await bulkResponse.text();
              throw new Error(`HTTP ${bulkResponse.status}: ${errorText}`);
            }
            
            const bulkResult = await bulkResponse.json();
            console.log('✅ Bulk Response Submission Result:', bulkResult);
          }
        } else {
          console.log('⚠️ Could not get form items, skipping bulk response test');
        }
      }
    } else {
      console.log('⚠️ No forms available for testing');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testFormSubmission();
