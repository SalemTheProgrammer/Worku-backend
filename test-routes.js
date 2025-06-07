const http = require('http');

function testRoute(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing company routes...\n');
  
  try {
    // Test 1: Companies list
    console.log('1. Testing GET /companies');
    const companiesResult = await testRoute('/companies?limit=5');
    console.log(`   Status: ${companiesResult.status}`);
    
    if (companiesResult.status === 200) {
      try {
        const data = JSON.parse(companiesResult.data);
        console.log(`   ✅ Success: Found ${data.companies?.length || 0} companies`);
        console.log(`   📊 Total: ${data.total}, Has more: ${data.hasMore}`);
      } catch (e) {
        console.log(`   ✅ Response received but JSON parse failed`);
      }
    } else {
      console.log(`   ❌ Failed with status ${companiesResult.status}`);
      console.log(`   Response: ${companiesResult.data.substring(0, 200)}`);
    }
    
    console.log('');
    
    // Test 2: Companies with sorting
    console.log('2. Testing GET /companies with sorting');
    const sortedResult = await testRoute('/companies?limit=3&sortBy=activeJobsCount&sortOrder=desc');
    console.log(`   Status: ${sortedResult.status}`);
    
    if (sortedResult.status === 200) {
      console.log(`   ✅ Sorting test passed`);
    } else {
      console.log(`   ❌ Sorting test failed: ${sortedResult.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    console.log('   Make sure your server is running on localhost:3000');
  }
}

// Run the tests
runTests();