/**
 * Calculates the delay for exponential backoff retry strategy
 * @param baseDelay - Base delay in milliseconds
 * @param attempt - Current attempt number (1-based)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function exponentialBackoff(
  baseDelay: number,
  attempt: number,
  maxDelay: number = 30000
): number {
  // Calculate exponential delay with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  
  return Math.floor(delay);
}