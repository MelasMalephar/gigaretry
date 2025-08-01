const { retryOperation } = require('../src/index');

describe('retryOperation', () => {
  // Your existing tests
  test('should retry flakyFunction until success', async () => {
    let count = 0;

    async function flakyFunction() {
      count++;
      if (count < 3) throw new Error('Failed');
      return 'Success';
    }

    const result = await retryOperation(flakyFunction, [], {
      attempts: 5,
      delay: 100,
      log: false,
    });

    expect(result).toBe('Success');
    expect(count).toBe(3);
  });

  test('should fail after max retries', async () => {
    let count = 0;

    async function alwaysFailing() {
      count++;
      throw new Error('Always fails');
    }

    await expect(
      retryOperation(alwaysFailing, [], { attempts: 3, delay: 50, log: false })
    ).rejects.toThrow('Always fails');

    expect(count).toBe(3);
  });

  // New comprehensive test cases
  describe('Basic Functionality', () => {
    test('should succeed on first attempt', async () => {
      let count = 0;
      
      async function successFunction() {
        count++;
        return 'Immediate success';
      }

      const result = await retryOperation(successFunction, [], {
        attempts: 3,
        delay: 100,
        log: false,
      });

      expect(result).toBe('Immediate success');
      expect(count).toBe(1);
    });

    test('should work with synchronous functions that throw', async () => {
      let count = 0;

      function syncFunction() {
        count++;
        if (count < 2) throw new Error('Sync error');
        return 'Sync success';
      }

      const result = await retryOperation(syncFunction, [], {
        attempts: 3,
        delay: 50,
        log: false,
      });

      expect(result).toBe('Sync success');
      expect(count).toBe(2);
    });

    test('should handle functions that return promises', async () => {
      let count = 0;

      function promiseFunction() {
        count++;
        if (count < 3) {
          return Promise.reject(new Error('Promise rejected'));
        }
        return Promise.resolve('Promise resolved');
      }

      const result = await retryOperation(promiseFunction, [], {
        attempts: 5,
        delay: 50,
        log: false,
      });

      expect(result).toBe('Promise resolved');
      expect(count).toBe(3);
    });
  });

  describe('Arguments Handling', () => {
    test('should pass arguments correctly to the operation', async () => {
      let receivedArgs = [];

      async function argFunction(a, b, c) {
        receivedArgs = [a, b, c];
        return `Args: ${a}, ${b}, ${c}`;
      }

      const result = await retryOperation(argFunction, ['hello', 42, true], {
        attempts: 1,
        log: false,
      });

      expect(result).toBe('Args: hello, 42, true');
      expect(receivedArgs).toEqual(['hello', 42, true]);
    });

    test('should work with no arguments', async () => {
      async function noArgFunction() {
        return 'No args needed';
      }

      const result = await retryOperation(noArgFunction, [], {
        attempts: 1,
        log: false,
      });

      expect(result).toBe('No args needed');
    });

    test('should work when args parameter is undefined', async () => {
      async function testFunction() {
        return 'Works without args array';
      }

      const result = await retryOperation(testFunction, undefined, {
        attempts: 1,
        log: false,
      });

      expect(result).toBe('Works without args array');
    });
  });

  describe('Exponential Backoff', () => {
    test('should implement exponential backoff correctly', async () => {
      let count = 0;
      const timestamps = [];

      async function exponentialTest() {
        timestamps.push(Date.now());
        count++;
        if (count < 4) throw new Error('Exponential test');
        return 'Exponential success';
      }

      const startTime = Date.now();
      const result = await retryOperation(exponentialTest, [], {
        attempts: 5,
        delay: 100,
        exponential: true,
        log: false,
      });

      expect(result).toBe('Exponential success');
      expect(count).toBe(4);
      
      // Your implementation: delay * Math.pow(2, attempt - 1)
      // Attempt 1: no delay before first try
      // After attempt 1 fails: delay = 100 * 2^0 = 100ms
      // After attempt 2 fails: delay = 100 * 2^1 = 200ms  
      // After attempt 3 fails: delay = 100 * 2^2 = 400ms
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0]; // Should be ~100ms
        const delay2 = timestamps[2] - timestamps[1]; // Should be ~200ms
        
        // Allow for timing variance but check exponential growth
        expect(delay1).toBeGreaterThan(80);
        expect(delay1).toBeLessThan(150);
        expect(delay2).toBeGreaterThan(180);
        expect(delay2).toBeLessThan(250);
      }
    });

    test('should respect maxTimeout with exponential backoff', async () => {
      let count = 0;
      const timestamps = [];

      async function maxTimeoutTest() {
        timestamps.push(Date.now());
        count++;
        if (count < 3) throw new Error('Max timeout test');
        return 'Max timeout success';
      }

      await retryOperation(maxTimeoutTest, [], {
        attempts: 4,
        delay: 1000,
        exponential: true,
        maxTimeout: 1500, // Cap at 1.5 seconds
        log: false,
      });

      // Verify the delay didn't exceed maxTimeout
      if (timestamps.length >= 2) {
        const delays = [];
        for (let i = 1; i < timestamps.length; i++) {
          delays.push(timestamps[i] - timestamps[i - 1]);
        }
        delays.forEach(delay => {
          expect(delay).toBeLessThanOrEqual(1600); // 1500ms + small buffer
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('should preserve the original error message', async () => {
      const customError = new Error('Custom error message');
      
      async function customErrorFunction() {
        throw customError;
      }

      await expect(
        retryOperation(customErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        })
      ).rejects.toThrow('Custom error message');
    });

    test('should handle different error types', async () => {
      async function typeErrorFunction() {
        throw new TypeError('Type error occurred');
      }

      await expect(
        retryOperation(typeErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        })
      ).rejects.toThrow(TypeError);
    });

    test('should handle non-Error objects thrown', async () => {
      async function stringErrorFunction() {
        throw 'String error';
      }

      await expect(
        retryOperation(stringErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        })
      ).rejects.toBe('String error');
    });
  });

  describe('Default Options', () => {
    test('should work with minimal options', async () => {
      let count = 0;

      async function minimalTest() {
        count++;
        if (count < 2) throw new Error('Minimal test');
        return 'Minimal success';
      }

      const result = await retryOperation(minimalTest, [], {
        log: false, // Only specify log to avoid console output
      });

      expect(result).toBe('Minimal success');
      expect(count).toBe(2);
    });

    test('should work with no options object', async () => {
      async function noOptionsTest() {
        return 'No options success';
      }

      const result = await retryOperation(noOptionsTest);
      expect(result).toBe('No options success');
    });
  });

  describe('Timing and Performance', () => {
    test('should respect minimum delay between retries', async () => {
      let count = 0;
      const timestamps = [];

      async function timingTest() {
        timestamps.push(Date.now());
        count++;
        if (count < 3) throw new Error('Timing test');
        return 'Timing success';
      }

      await retryOperation(timingTest, [], {
        attempts: 4,
        delay: 200,
        log: false,
      });

      // Check that delays are at least the specified amount
      for (let i = 1; i < timestamps.length; i++) {
        const actualDelay = timestamps[i] - timestamps[i - 1];
        expect(actualDelay).toBeGreaterThanOrEqual(190); // Allow 10ms variance
      }
    });

    test('should handle very small delays', async () => {
      let count = 0;

      async function smallDelayTest() {
        count++;
        if (count < 3) throw new Error('Small delay test');
        return 'Small delay success';
      }

      const startTime = Date.now();
      const result = await retryOperation(smallDelayTest, [], {
        attempts: 4,
        delay: 1, // 1ms delay
        log: false,
      });
      const endTime = Date.now();

      expect(result).toBe('Small delay success');
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero attempts', async () => {
      async function zeroAttemptsTest() {
        return 'Should not run';
      }

      // With your implementation, zero attempts means the loop never runs
      // Since the loop condition is `attempt <= attempts` and starts at 1,
      // when attempts = 0, the loop body never executes, so nothing is returned
      // This will likely return undefined or throw due to no return
      const result = await retryOperation(zeroAttemptsTest, [], {
        attempts: 0,
        log: false,
      });
      
      // Based on your implementation, this should return undefined
      // since the function completes without returning anything
      expect(result).toBeUndefined();
    });

    test('should handle single attempt', async () => {
      let count = 0;

      async function singleAttemptFail() {
        count++;
        throw new Error('Single attempt fail');
      }

      await expect(
        retryOperation(singleAttemptFail, [], {
          attempts: 1,
          delay: 100,
          log: false,
        })
      ).rejects.toThrow('Single attempt fail');

      expect(count).toBe(1);
    });

    test('should handle very large number of attempts', async () => {
      let count = 0;

      async function largeAttemptsTest() {
        count++;
        if (count < 5) throw new Error('Large attempts test');
        return 'Large attempts success';
      }

      const result = await retryOperation(largeAttemptsTest, [], {
        attempts: 1000, // Very large number
        delay: 10,
        log: false,
      });

      expect(result).toBe('Large attempts success');
      expect(count).toBe(5); // Should stop when successful
    });
  });

  describe('Return Values', () => {
    test('should return complex objects', async () => {
      const complexObject = {
        data: [1, 2, 3],
        meta: { status: 'success' },
        nested: { deep: { value: 'test' } }
      };

      async function complexReturnTest() {
        return complexObject;
      }

      const result = await retryOperation(complexReturnTest, [], {
        attempts: 1,
        log: false,
      });

      expect(result).toEqual(complexObject);
    });

    test('should return null and undefined correctly', async () => {
      async function nullReturnTest() {
        return null;
      }

      async function undefinedReturnTest() {
        return undefined;
      }

      const nullResult = await retryOperation(nullReturnTest, [], {
        attempts: 1,
        log: false,
      });

      const undefinedResult = await retryOperation(undefinedReturnTest, [], {
        attempts: 1,
        log: false,
      });

      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    test('should return primitive values correctly', async () => {
      async function numberTest() { return 42; }
      async function stringTest() { return 'test string'; }
      async function booleanTest() { return true; }

      const numberResult = await retryOperation(numberTest, [], { log: false });
      const stringResult = await retryOperation(stringTest, [], { log: false });
      const booleanResult = await retryOperation(booleanTest, [], { log: false });

      expect(numberResult).toBe(42);
      expect(stringResult).toBe('test string');
      expect(booleanResult).toBe(true);
    });
  });

  describe('Implementation-Specific Tests', () => {
    test('should handle negative attempts', async () => {
      async function negativeAttemptsTest() {
        return 'Should not run';
      }

      // With negative attempts, the loop condition `attempt <= attempts` 
      // where attempt starts at 1, means the loop never runs
      const result = await retryOperation(negativeAttemptsTest, [], {
        attempts: -1,
        log: false,
      });
      
      expect(result).toBeUndefined();
    });

    test('should handle fractional attempts', async () => {
      let count = 0;
      
      async function fractionalTest() {
        count++;
        if (count < 2) throw new Error('Fractional test');
        return 'Fractional success';
      }

      // 2.5 attempts should still work as the loop uses <=
      const result = await retryOperation(fractionalTest, [], {
        attempts: 2.5,
        delay: 50,
        log: false,
      });

      expect(result).toBe('Fractional success');
      expect(count).toBe(2);
    });

    test('should handle maxTimeout correctly with exponential backoff', async () => {
      let count = 0;
      const delays = [];
      const originalWait = require('util').promisify(setTimeout);
      
      // Mock the wait function to capture delays
      jest.mock('../src/index', () => {
        const actual = jest.requireActual('../src/index');
        return {
          ...actual,
          // We can't easily mock the internal wait function, so we'll test behavior
        };
      });

      async function maxTimeoutTest() {
        count++;
        if (count < 4) throw new Error('Max timeout test');
        return 'Max timeout success';
      }

      // delay=100, exponential=true, maxTimeout=150
      // Attempt 1: 100 * 2^0 = 100ms (within limit)
      // Attempt 2: 100 * 2^1 = 200ms -> capped to 150ms
      // Attempt 3: 100 * 2^2 = 400ms -> capped to 150ms
      const startTime = Date.now();
      const result = await retryOperation(maxTimeoutTest, [], {
        attempts: 5,
        delay: 100,
        exponential: true,
        maxTimeout: 150,
        log: false,
      });
      const endTime = Date.now();

      expect(result).toBe('Max timeout success');
      expect(count).toBe(4);
      
      // Total time should be roughly: 100 + 150 + 150 = 400ms + function execution time
      // Allow generous buffer for test execution
      expect(endTime - startTime).toBeGreaterThan(350);
      expect(endTime - startTime).toBeLessThan(600);
    });

    test('should work with default parameters when no options provided', async () => {
      let count = 0;

      async function defaultTest() {
        count++;
        if (count < 2) throw new Error('Default test');
        return 'Default success';
      }

      // Should use defaults: attempts=3, delay=1000, exponential=false, etc.
      const result = await retryOperation(defaultTest);
      
      expect(result).toBe('Default success');
      expect(count).toBe(2);
    });

    test('should handle empty args array vs undefined args', async () => {
      async function argsTest(a, b) {
        return `Args: ${a}, ${b}`;
      }

      // Both should work the same way according to your implementation
      const result1 = await retryOperation(argsTest, [], { log: false });
      const result2 = await retryOperation(argsTest, undefined, { log: false });

      expect(result1).toBe('Args: undefined, undefined');
      expect(result2).toBe('Args: undefined, undefined');
    });
  });

  describe('Logging', () => {
    test('should not log when log option is false', async () => {
      // Your implementation uses console.error for logging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let count = 0;

      async function noLogTest() {
        count++;
        if (count < 3) throw new Error('No log test');
        return 'No log success';
      }

      await retryOperation(noLogTest, [], {
        attempts: 4,
        delay: 50,
        log: false,
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log when log option is true', async () => {
      // Your implementation uses console.error, not console.log
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let count = 0;

      async function logTest() {
        count++;
        if (count < 2) throw new Error('Log test');
        return 'Log success';
      }

      await retryOperation(logTest, [], {
        attempts: 3,
        delay: 50,
        log: true,
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Attempt 1 failed: Log test');
      consoleSpy.mockRestore();
    });
  });
});