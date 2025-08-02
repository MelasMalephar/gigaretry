// types/index.d.ts

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  attempts?: number;
  
  /** Delay between retries in milliseconds (default: 1000) */
  delay?: number;
  
  /** Use exponential backoff for delays (default: false) */
  exponential?: boolean;
  
  /** Maximum timeout cap when using exponential backoff in milliseconds (default: 10000) */
  maxTimeout?: number;
  
  /** Enable console logging of retry attempts (default: false) */
  log?: boolean;
  
  /** Execute function in isolated child process for better error isolation (default: false) */
  childProcess?: boolean;
}

/**
 * Retries a function with customizable strategies including exponential backoff, 
 * logging, timeout controls, and optional child process isolation.
 *
 * @template T - The return type of the operation function
 * @param operation - The function to retry (can be sync or async)
 * @param args - Arguments to pass to the function (default: [])
 * @param options - Retry behavior configuration options
 * @returns Promise that resolves to the operation result or rejects after all attempts fail
 * 
 * @example
 * ```typescript
 * // Basic retry with default options
 * const result = await retryOperation(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return response.json();
 * });
 * 
 * // Advanced retry with child process isolation
 * const userData = await retryOperation(
 *   async (userId: string) => {
 *     const axios = require('axios');
 *     const response = await axios.get(`/users/${userId}`);
 *     return response.data;
 *   },
 *   ['123'],
 *   {
 *     attempts: 5,
 *     delay: 1000,
 *     exponential: true,
 *     maxTimeout: 30000,
 *     childProcess: true,
 *     log: true
 *   }
 * );
 * ```
 */
export function retryOperation<T = any>(
  operation: (...args: any[]) => Promise<T> | T,
  args?: any[],
  options?: RetryOptions
): Promise<T>;

/**
 * Runs a function in an isolated child process
 * 
 * @template T - The return type of the operation function
 * @param operation - The function to run in child process
 * @param args - Arguments to pass to the function
 * @returns Promise that resolves to the operation result
 */
export function runInChild<T = any>(
  operation: (...args: any[]) => Promise<T> | T,
  args?: any[]
): Promise<T>;

/**
 * Default export containing all functions
 */
declare const gigaretry: {
  retryOperation: typeof retryOperation;
  runInChild: typeof runInChild;
};

export default gigaretry;