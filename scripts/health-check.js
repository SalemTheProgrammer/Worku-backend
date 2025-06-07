#!/usr/bin/env node

/**
 * Production Health Check Script
 * Validates that all services are running correctly
 */

const http = require('http');
const https = require('https');

const config = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.HEALTH_CHECK_PORT || process.env.PORT || 8080,
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
  retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
  useHttps: process.env.HEALTH_CHECK_HTTPS === 'true'
};

async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const client = config.useHttps ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function checkHealth(attempt = 1) {
  try {
    console.log(`Health check attempt ${attempt}/${config.retries}...`);
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/health',
      method: 'GET',
      headers: {
        'User-Agent': 'Health-Check-Script'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      console.log('✅ Health check passed!');
      console.log(`Status: ${healthData.status}`);
      console.log(`Environment: ${healthData.env}`);
      console.log(`Uptime: ${Math.floor(healthData.uptime)}s`);
      console.log('Services:', healthData.services);
      
      if (healthData.status === 'degraded') {
        console.warn('⚠️  Application is running but some services are degraded');
        process.exit(1);
      }
      
      process.exit(0);
    } else {
      throw new Error(`Health check failed with status ${response.statusCode}`);
    }
    
  } catch (error) {
    console.error(`❌ Health check failed (attempt ${attempt}):`, error.message);
    
    if (attempt < config.retries) {
      console.log(`Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkHealth(attempt + 1);
    } else {
      console.error('❌ All health check attempts failed');
      process.exit(1);
    }
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Health check interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Health check terminated');
  process.exit(1);
});

// Start health check
console.log(`🔍 Starting health check for ${config.useHttps ? 'https' : 'http'}://${config.host}:${config.port}/health`);
checkHealth();