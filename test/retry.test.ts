const { retryOperation } = require('../src/index.js');
import { RetryOptions } from '../types/index';

// Define a type for the test functions to ensure type safety
type TestFunction<T> = (...args: any[]) => Promise<T> | T;

describe('retryOperation with TypeScript', () => {
  // Your existing tests
  test('should retry flakyFunction until success', async () => {
    let count = 0;

    const flakyFunction: TestFunction<string> = async () => {
      count++;
      if (count < 3) throw new Error('Failed');
      return 'Success';
    };

    const result = await retryOperation(flakyFunction, [], {
      attempts: 5,
      delay: 100,
      log: false,
    } as RetryOptions);

    expect(result).toBe('Success');
    expect(count).toBe(3);
  });

  test('should fail after max retries', async () => {
    let count = 0;

    const alwaysFailing: TestFunction<never> = async () => {
      count++;
      throw new Error('Always fails');
    };

    await expect(
      retryOperation(alwaysFailing, [], { attempts: 3, delay: 50, log: false } as RetryOptions)
    ).rejects.toThrow('Always fails');

    expect(count).toBe(3);
  });

  // New comprehensive test cases
  describe('Basic Functionality', () => {
    test('should succeed on first attempt', async () => {
      let count = 0;

      const successFunction: TestFunction<string> = async () => {
        count++;
        return 'Immediate success';
      };

      const result = await retryOperation(successFunction, [], {
        attempts: 3,
        delay: 100,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Immediate success');
      expect(count).toBe(1);
    });

    test('should work with synchronous functions that throw', async () => {
      let count = 0;

      const syncFunction: TestFunction<string> = () => {
        count++;
        if (count < 2) throw new Error('Sync error');
        return 'Sync success';
      };

      const result = await retryOperation(syncFunction, [], {
        attempts: 3,
        delay: 50,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Sync success');
      expect(count).toBe(2);
    });

    test('should handle functions that return promises', async () => {
      let count = 0;

      const promiseFunction: TestFunction<string> = () => {
        count++;
        if (count < 3) {
          return Promise.reject(new Error('Promise rejected'));
        }
        return Promise.resolve('Promise resolved');
      };

      const result = await retryOperation(promiseFunction, [], {
        attempts: 5,
        delay: 50,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Promise resolved');
      expect(count).toBe(3);
    });
  });

  describe('Arguments Handling', () => {
    test('should pass arguments correctly to the operation', async () => {
      let receivedArgs: any[] = [];

      const argFunction: TestFunction<string> = async (a, b, c) => {
        receivedArgs = [a, b, c];
        return `Args: ${a}, ${b}, ${c}`;
      };

      const result = await retryOperation(argFunction, ['hello', 42, true], {
        attempts: 1,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Args: hello, 42, true');
      expect(receivedArgs).toEqual(['hello', 42, true]);
    });

    test('should work with no arguments', async () => {
      const noArgFunction: TestFunction<string> = async () => {
        return 'No args needed';
      };

      const result = await retryOperation(noArgFunction, [], {
        attempts: 1,
        log: false,
      } as RetryOptions);

      expect(result).toBe('No args needed');
    });

    test('should work when args parameter is undefined', async () => {
      const testFunction: TestFunction<string> = async () => {
        return 'Works without args array';
      };

      const result = await retryOperation(testFunction, undefined, {
        attempts: 1,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Works without args array');
    });
  });

  describe('Exponential Backoff', () => {
    test('should implement exponential backoff correctly', async () => {
      let count = 0;
      const timestamps: number[] = [];

      const exponentialTest: TestFunction<string> = async () => {
        timestamps.push(Date.now());
        count++;
        if (count < 4) throw new Error('Exponential test');
        return 'Exponential success';
      };

      const startTime = Date.now();
      const result = await retryOperation(exponentialTest, [], {
        attempts: 5,
        delay: 100,
        exponential: true,
        log: false,
      } as RetryOptions);

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
      const timestamps: number[] = [];

      const maxTimeoutTest: TestFunction<string> = async () => {
        timestamps.push(Date.now());
        count++;
        if (count < 3) throw new Error('Max timeout test');
        return 'Max timeout success';
      };

      await retryOperation(maxTimeoutTest, [], {
        attempts: 4,
        delay: 1000,
        exponential: true,
        maxTimeout: 1500, // Cap at 1.5 seconds
        log: false,
      } as RetryOptions);

      // Verify the delay didn't exceed maxTimeout
      if (timestamps.length >= 2) {
        const delays: number[] = [];
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

      const customErrorFunction: TestFunction<never> = async () => {
        throw customError;
      };

      await expect(
        retryOperation(customErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        } as RetryOptions)
      ).rejects.toThrow('Custom error message');
    });

    test('should handle different error types', async () => {
      const typeErrorFunction: TestFunction<never> = async () => {
        throw new TypeError('Type error occurred');
      };

      await expect(
        retryOperation(typeErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        } as RetryOptions)
      ).rejects.toThrow(TypeError);
    });

    test('should handle non-Error objects thrown', async () => {
      const stringErrorFunction: TestFunction<never> = async () => {
        throw 'String error';
      };

      await expect(
        retryOperation(stringErrorFunction, [], {
          attempts: 2,
          delay: 50,
          log: false,
        } as RetryOptions)
      ).rejects.toBe('String error');
    });
  });

  describe('Default Options', () => {
    test('should work with minimal options', async () => {
      let count = 0;

      const minimalTest: TestFunction<string> = async () => {
        count++;
        if (count < 2) throw new Error('Minimal test');
        return 'Minimal success';
      };

      const result = await retryOperation(minimalTest, [], {
        log: false, // Only specify log to avoid console output
      } as RetryOptions);

      expect(result).toBe('Minimal success');
      expect(count).toBe(2);
    });

    test('should work with no options object', async () => {
      const noOptionsTest: TestFunction<string> = async () => {
        return 'No options success';
      };

      const result = await retryOperation(noOptionsTest);
      expect(result).toBe('No options success');
    });
  });

  describe('Timing and Performance', () => {
    test('should respect minimum delay between retries', async () => {
      let count = 0;
      const timestamps: number[] = [];

      const timingTest: TestFunction<string> = async () => {
        timestamps.push(Date.now());
        count++;
        if (count < 3) throw new Error('Timing test');
        return 'Timing success';
      };

      await retryOperation(timingTest, [], {
        attempts: 4,
        delay: 200,
        log: false,
      } as RetryOptions);

      // Check that delays are at least the specified amount
      for (let i = 1; i < timestamps.length; i++) {
        const actualDelay = timestamps[i] - timestamps[i - 1];
        expect(actualDelay).toBeGreaterThanOrEqual(190); // Allow 10ms variance
      }
    });

    test('should handle very small delays', async () => {
      let count = 0;

      const smallDelayTest: TestFunction<string> = async () => {
        count++;
        if (count < 3) throw new Error('Small delay test');
        return 'Small delay success';
      };

      const startTime = Date.now();
      const result = await retryOperation(smallDelayTest, [], {
        attempts: 4,
        delay: 1, // 1ms delay
        log: false,
      } as RetryOptions);
      const endTime = Date.now();

      expect(result).toBe('Small delay success');
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero attempts', async () => {
      const zeroAttemptsTest: TestFunction<string> = async () => {
        return 'Should not run';
      };

      const result = await retryOperation(zeroAttemptsTest, [], {
        attempts: 0,
        log: false,
      } as RetryOptions);

      expect(result).toBeUndefined();
    });

    test('should handle single attempt', async () => {
      let count = 0;

      const singleAttemptFail: TestFunction<never> = async () => {
        count++;
        throw new Error('Single attempt fail');
      };

      await expect(
        retryOperation(singleAttemptFail, [], {
          attempts: 1,
          delay: 100,
          log: false,
        } as RetryOptions)
      ).rejects.toThrow('Single attempt fail');

      expect(count).toBe(1);
    });

    test('should handle very large number of attempts', async () => {
      let count = 0;

      const largeAttemptsTest: TestFunction<string> = async () => {
        count++;
        if (count < 5) throw new Error('Large attempts test');
        return 'Large attempts success';
      };

      const result = await retryOperation(largeAttemptsTest, [], {
        attempts: 1000, // Very large number
        delay: 10,
        log: false,
      } as RetryOptions);

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

      const complexReturnTest: TestFunction<typeof complexObject> = async () => {
        return complexObject;
      };

      const result = await retryOperation(complexReturnTest, [], {
        attempts: 1,
        log: false,
      } as RetryOptions);

      expect(result).toEqual(complexObject);
    });

    test('should return null and undefined correctly', async () => {
      const nullReturnTest: TestFunction<null> = async () => {
        return null;
      };

      const undefinedReturnTest: TestFunction<undefined> = async () => {
        return undefined;
      };

      const nullResult = await retryOperation(nullReturnTest, [], {
        attempts: 1,
        log: false,
      } as RetryOptions);

      const undefinedResult = await retryOperation(undefinedReturnTest, [], {
        attempts: 1,
        log: false,
      } as RetryOptions);

      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    test('should return primitive values correctly', async () => {
      const numberTest: TestFunction<number> = async () => { return 42; };
      const stringTest: TestFunction<string> = async () => { return 'test string'; };
      const booleanTest: TestFunction<boolean> = async () => { return true; };

      const numberResult = await retryOperation(numberTest, [], { log: false } as RetryOptions);
      const stringResult = await retryOperation(stringTest, [], { log: false } as RetryOptions);
      const booleanResult = await retryOperation(booleanTest, [], { log: false } as RetryOptions);

      expect(numberResult).toBe(42);
      expect(stringResult).toBe('test string');
      expect(booleanResult).toBe(true);
    });
  });

  describe('Implementation-Specific Tests', () => {
    test('should handle negative attempts', async () => {
      const negativeAttemptsTest: TestFunction<string> = async () => {
        return 'Should not run';
      };

      const result = await retryOperation(negativeAttemptsTest, [], {
        attempts: -1,
        log: false,
      } as RetryOptions);

      expect(result).toBeUndefined();
    });

    test('should handle fractional attempts', async () => {
      let count = 0;

      const fractionalTest: TestFunction<string> = async () => {
        count++;
        if (count < 2) throw new Error('Fractional test');
        return 'Fractional success';
      };

      const result = await retryOperation(fractionalTest, [], {
        attempts: 2.5,
        delay: 50,
        log: false,
      } as RetryOptions);

      expect(result).toBe('Fractional success');
      expect(count).toBe(2);
    });

    test('should handle maxTimeout correctly with exponential backoff', async () => {
      let count = 0;
      const delays: number[] = [];

      const maxTimeoutTest: TestFunction<string> = async () => {
        count++;
        if (count < 4) throw new Error('Max timeout test');
        return 'Max timeout success';
      };

      const startTime = Date.now();
      const result = await retryOperation(maxTimeoutTest, [], {
        attempts: 5,
        delay: 100,
        exponential: true,
        maxTimeout: 150,
        log: false,
      } as RetryOptions);
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

      const defaultTest: TestFunction<string> = async () => {
        count++;
        if (count < 2) throw new Error('Default test');
        return 'Default success';
      };

      const result = await retryOperation(defaultTest);
      expect(result).toBe('Default success');
      expect(count).toBe(2);
    });

    test('should handle empty args array vs undefined args', async () => {
      const argsTest: TestFunction<string> = async (a, b) => {
        return `Args: ${a}, ${b}`;
      };

      const result1 = await retryOperation(argsTest, [], { log: false } as RetryOptions);
      const result2 = await retryOperation(argsTest, undefined, { log: false } as RetryOptions);

      expect(result1).toBe('Args: undefined, undefined');
      expect(result2).toBe('Args: undefined, undefined');
    });
  });

  describe('Logging', () => {
    test('should not log when log option is false', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let count = 0;

      const noLogTest: TestFunction<string> = async () => {
        count++;
        if (count < 3) throw new Error('No log test');
        return 'No log success';
      };

      await retryOperation(noLogTest, [], {
        attempts: 4,
        delay: 50,
        log: false,
      } as RetryOptions);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log when log option is true', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let count = 0;

      const logTest: TestFunction<string> = async () => {
        count++;
        if (count < 2) throw new Error('Log test');
        return 'Log success';
      };

      await retryOperation(logTest, [], {
        attempts: 3,
        delay: 50,
        log: true,
      } as RetryOptions);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Attempt 1 failed: Log test');
      consoleSpy.mockRestore();
    });
  });

  describe('retryOperation with childProcess', () => {
    test('should succeed on first attempt (child process)', async () => {
      const testFunction: TestFunction<string> = async () => {
        return 'Immediate success from child';
      };

      const result = await retryOperation(testFunction, [], {
        attempts: 3,
        delay: 100,
        childProcess: true,
        log: true,
      } as RetryOptions);

      expect(result).toBe('Immediate success from child');
    });

    test('should retry and then succeed (child process)', async () => {
      const testFunction: TestFunction<string> = async () => {
        const now = Date.now();
        if (now % 100 < 50) {
          throw new Error('Simulated failure');
        }
        return 'Child process success';
      };

      const result = await retryOperation(testFunction, [], {
        attempts: 10,
        delay: 10,
        childProcess: true,
        log: true,
      } as RetryOptions);

      expect(result).toBe('Child process success');
    }, 15000); // Increase timeout

    test('should handle function with arguments (child process)', async () => {
      const testFunction: TestFunction<string> = async (name: string, age: number) => {
        return `Hello ${name}, you are ${age} years old`;
      };

      const result = await retryOperation(testFunction, ['Alice', 30], {
        attempts: 3,
        delay: 100,
        childProcess: true,
      } as RetryOptions);

      expect(result).toBe('Hello Alice, you are 30 years old');
    });

    test('should handle function returning object (child process)', async () => {
      interface Result {
        success: boolean;
        message: string;
      }
      const testFunction: TestFunction<Result> = async () => {
        return { success: true, message: 'Operation completed' };
      };

      const result = await retryOperation(testFunction, [], {
        attempts: 3,
        delay: 100,
        childProcess: true,
      } as RetryOptions);

      expect(result).toEqual({ success: true, message: 'Operation completed' });
    });

    test('should fail after all attempts (child process)', async () => {
      const testFunction: TestFunction<never> = async () => {
        throw new Error('Always fails');
      };

      await expect(
        retryOperation(testFunction, [], {
          attempts: 3,
          delay: 50,
          childProcess: true,
        } as RetryOptions)
      ).rejects.toThrow('Function execution failed: Always fails');
    });
  });
});