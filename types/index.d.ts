export interface RetryOptions {
  attempts?: number;
  delay?: number;
  exponential?: boolean;
  maxTimeout?: number;
  log?: boolean;
  childProcess?: boolean;
}

/**
 * Retries a function with custom strategies like exponential backoff, logging, and optional child process support.
 *
 * @param operation - The async function to retry.
 * @param args - Arguments to pass to the function.
 * @param options - Retry behavior configuration.
 * @returns The result of the operation if successful, or throws an error after exhausting attempts.
 */


export function retryOperation<T = any>(
  operation: (...args: any[]) => Promise<T> | T,
  args?: any[],
  options?: RetryOptions
): Promise<T>;
