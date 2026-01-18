/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unhealthy
 */

import { metrics } from '@/lib/metrics';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Name for identification and metrics */
  name: string;
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms before attempting to close the circuit */
  resetTimeout: number;
  /** Number of successful calls in half-open state before closing */
  successThreshold: number;
  /** Optional timeout for operations in ms */
  operationTimeout?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_OPTIONS: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  operationTimeout: 10000, // 10 seconds
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private nextAttempt: Date | null = null;

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<CircuitBreakerOptions>;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half-open');
      } else {
        throw new CircuitOpenError(
          `Circuit ${this.options.name} is open`,
          this.nextAttempt
        );
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute with optional timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.operationTimeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Operation timed out after ${this.options.operationTimeout}ms`));
        }, this.options.operationTimeout);
      }),
    ]);
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt !== null && new Date() >= this.nextAttempt;
  }

  private onSuccess(): void {
    this.lastSuccess = new Date();
    this.totalSuccesses++;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo('closed');
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(_error: unknown): void {
    this.lastFailure = new Date();
    this.totalFailures++;
    this.failures++;

    if (this.state === 'half-open') {
      this.transitionTo('open');
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo('open');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    // Record metrics
    metrics.circuitBreakerStateChange(this.options.name, newState);

    if (newState === 'open') {
      this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
      this.successes = 0;
    } else if (newState === 'closed') {
      this.failures = 0;
      this.successes = 0;
      this.nextAttempt = null;
    } else if (newState === 'half-open') {
      this.successes = 0;
    }

    console.log(
      `[CircuitBreaker:${this.options.name}] State transition: ${oldState} -> ${newState}`
    );
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo('closed');
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is allowing requests
   */
  isAvailable(): boolean {
    return this.state !== 'open' || this.shouldAttemptReset();
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: Date | null
  ) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Error thrown when operation times out
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Pre-configured circuit breakers for common services
export const circuitBreakers = {
  supabase: new CircuitBreaker({
    name: 'supabase',
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
    operationTimeout: 15000,
  }),
  claude: new CircuitBreaker({
    name: 'claude',
    failureThreshold: 3,
    resetTimeout: 60000,
    successThreshold: 1,
    operationTimeout: 120000,
  }),
  external: new CircuitBreaker({
    name: 'external',
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
    operationTimeout: 30000,
  }),
};

/**
 * Create a new circuit breaker with custom options
 */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}
