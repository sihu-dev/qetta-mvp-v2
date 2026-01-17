/**
 * Base Collector - 입찰 공고 수집기 베이스 클래스
 * All platform-specific collectors inherit from this
 */

import type { Bid, BidSource, CollectorConfig, CollectResult } from '../types';

export abstract class BaseCollector {
  protected config: CollectorConfig;

  constructor(config: CollectorConfig) {
    this.config = config;
  }

  /**
   * Collect bids from the platform
   */
  abstract collect(): Promise<CollectResult>;

  /**
   * Parse raw API response to Bid format
   */
  abstract parseBid(raw: unknown): Bid;

  /**
   * Get platform source identifier
   */
  get source(): BidSource {
    return this.config.source;
  }

  /**
   * Check if collector is enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Rate limit helper - delay between requests
   */
  protected async rateLimit(): Promise<void> {
    const delayMs = (60 * 1000) / this.config.rate_limit;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Create a collect result object
   */
  protected createResult(
    success: boolean,
    count: number,
    errors: string[] = []
  ): CollectResult {
    return {
      source: this.source,
      success,
      count,
      errors,
      collected_at: new Date().toISOString(),
    };
  }
}
