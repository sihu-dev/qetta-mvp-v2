/**
 * Retry with Exponential Backoff
 * Automatically retries failed operations with increasing delays
 */

import { logger } from '@/lib/logging';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (e.g., 2 for exponential) */
  backoffMultiplier: number;
  /** Add random jitter to prevent thundering herd */
  jitter: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: defaultIsRetryable,
};

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Non-retryable errors
    if (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('not found') ||
      message.includes('bad request') ||
      message.includes('validation')
    ) {
      return false;
    }

    // Retryable errors
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('socket') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('service unavailable') ||
      message.includes('internal server error')
    ) {
      return true;
    }
  }

  // Default to retrying unknown errors
  return true;
}

/**
 * Calculate delay with optional jitter
 */
function calculateDelay(
  attempt: number,
  options: RetryOptions
): number {
  const exponentialDelay = Math.min(
    options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1),
    options.maxDelay
  );

  if (!options.jitter) {
    return exponentialDelay;
  }

  // Add jitter: random value between 0 and 50% of the delay
  const jitterRange = exponentialDelay * 0.5;
  const jitter = Math.random() * jitterRange;
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt > opts.maxRetries) {
        break;
      }

      const isRetryable = opts.isRetryable?.(error) ?? defaultIsRetryable(error);
      if (!isRetryable) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);

      // Callback before retry
      opts.onRetry?.(attempt, error, delay);

      logger.debug(
        `[Retry] Attempt ${attempt}/${opts.maxRetries} failed, retrying in ${delay}ms`,
        { error: error instanceof Error ? error.message : String(error) }
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of a function
 */
export function withRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: Partial<RetryOptions> = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}

/**
 * Retry decorator for class methods (TypeScript 5 decorator)
 */
export function Retryable(options: Partial<RetryOptions> = {}) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: T,
    context: ClassMethodDecoratorContext
  ): T {
    void context;
    return function (this: unknown, ...args: unknown[]) {
      return retry(() => target.apply(this, args) as Promise<unknown>, options);
    } as T;
  };
}

/**
 * Preset configurations for common use cases
 */
export const retryPresets = {
  /** Fast retry for quick operations */
  fast: {
    maxRetries: 2,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    jitter: true,
  } satisfies Partial<RetryOptions>,

  /** Standard retry for most operations */
  standard: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  } satisfies Partial<RetryOptions>,

  /** Patient retry for slow/expensive operations */
  patient: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
  } satisfies Partial<RetryOptions>,

  /** API retry for external API calls */
  api: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    isRetryable: (error: unknown) => {
      if (error instanceof Error) {
        // Don't retry client errors except rate limits
        const message = error.message.toLowerCase();
        if (message.includes('429') || message.includes('rate limit')) {
          return true;
        }
        if (message.includes('4')) {
          // 4xx errors
          return false;
        }
      }
      return defaultIsRetryable(error);
    },
  } satisfies Partial<RetryOptions>,
};
