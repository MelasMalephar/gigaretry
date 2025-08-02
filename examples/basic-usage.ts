const { retryOperation } = require('../src/index.js');
import { RetryOptions } from '../types/index';

// Basic retry example
async function basicExample() {
  const result = await retryOperation(
    async () => {
      const response = await fetch('https://api.example.com/data');
      return response.json();
    },
    [],
    {
      attempts: 3,
      delay: 1000,
      log: true
    }
  );
  
  console.log('Result:', result);
}

// With arguments
async function withArgumentsExample() {
  const userData = await retryOperation(
    async (userId: string) => {
      const response = await fetch(`https://api.example.com/users/${userId}`);
      return response.json();
    },
    ['123'],
    {
      attempts: 5,
      delay: 2000,
      exponential: true
    }
  );
  
  console.log('User:', userData);
}

basicExample().catch(console.error);
withArgumentsExample().catch(console.error);