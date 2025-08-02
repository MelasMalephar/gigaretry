// examples/child-process.ts
const { retryOperation } = require('../src/index.js');

// Child process for API calls
async function isolatedApiCall() {
  const result = await retryOperation(
    async (endpoint: string) => {
      const axios = require('axios');
      const response = await axios.get(endpoint);
      return response.data;
    },
    ['https://jsonplaceholder.typicode.com/posts/1'],
    {
      attempts: 5,
      delay: 1000,
      childProcess: true, // Run in isolated process
      exponential: true,
      log: true
    }
  );
  
  console.log('API Result:', result);
}

// Heavy computation in child process
async function heavyComputation() {
  const result = await retryOperation(
    async (data: number[]) => {
      // Simulate heavy computation
      const sum = data.reduce((acc, num) => acc + num, 0);
      const squared = data.map(num => num ** 2);
      
      return {
        sum,
        squared,
        average: sum / data.length,
        processPid: process.pid
      };
    },
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
    {
      attempts: 3,
      childProcess: true, // Isolate heavy work
      delay: 500
    }
  );
  
  console.log('Computation Result:', result);
  console.log('Main Process PID:', process.pid);
}

// Database operations in child process
async function databaseOperation() {
  const result = await retryOperation(
    async (query: string) => {
      // Simulate database operation
      const fs = require('fs');
      const data = {
        query,
        timestamp: new Date().toISOString(),
        result: 'Database operation completed'
      };
      
      return data;
    },
    ['SELECT * FROM users WHERE active = true'],
    {
      attempts: 8,
      delay: 2000,
      exponential: true,
      maxTimeout: 30000,
      childProcess: true,
      log: true
    }
  );
  
  console.log('Database Result:', result);
}

// Run examples
async function runExamples() {
  console.log('🔒 Child Process Examples\n');
  
  try {
    console.log('1. Isolated API Call:');
    await isolatedApiCall();
    
    console.log('\n2. Heavy Computation:');
    await heavyComputation();
    
    console.log('\n3. Database Operation:');
    await databaseOperation();
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

if (require.main === module) {
  runExamples();
}