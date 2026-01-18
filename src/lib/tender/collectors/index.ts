/**
 * Tender Collectors - 입찰 공고 수집기 모듈
 */

export { BaseCollector } from './base-collector';
export { G2BCollector } from './g2b-collector';
export { UNGMCollector } from './ungm-collector';
export { SAMCollector } from './sam-collector';
export { KZCollector } from './kz-collector';

import type { BidSource } from '../types';
import { G2BCollector } from './g2b-collector';
import { UNGMCollector } from './ungm-collector';
import { SAMCollector } from './sam-collector';
import { KZCollector } from './kz-collector';
import { BaseCollector } from './base-collector';

/**
 * Collector configuration by source
 */
export interface CollectorOptions {
  apiKey?: string;
}

/**
 * Create collector by source type
 */
export function createCollector(
  source: BidSource,
  options: CollectorOptions = {}
): BaseCollector {
  switch (source) {
    case 'g2b':
      if (!options.apiKey) {
        throw new Error('G2B collector requires API key');
      }
      return new G2BCollector(options.apiKey);

    case 'ungm':
      // UNGM doesn't require API key for public notices
      return new UNGMCollector();

    case 'sam':
      if (!options.apiKey) {
        throw new Error('SAM.gov collector requires API key');
      }
      return new SAMCollector(options.apiKey);

    case 'kz':
      if (!options.apiKey) {
        throw new Error('KZ Goszakup collector requires API key');
      }
      return new KZCollector(options.apiKey);

    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

/**
 * Get required environment variable name for each source
 */
export function getApiKeyEnvName(source: BidSource): string | null {
  switch (source) {
    case 'g2b':
      return 'G2B_API_KEY';
    case 'ungm':
      return null; // No API key required
    case 'sam':
      return 'SAM_API_KEY';
    case 'kz':
      return 'KZ_GOSZAKUP_API_KEY';
    default:
      return null;
  }
}

/**
 * Check if a source is available (has required config)
 */
export function isSourceAvailable(source: BidSource): boolean {
  const envName = getApiKeyEnvName(source);
  if (envName === null) return true; // No key required
  return !!process.env[envName];
}

/**
 * Get all available sources
 */
export function getAvailableSources(): BidSource[] {
  const allSources: BidSource[] = ['g2b', 'ungm', 'sam', 'kz'];
  return allSources.filter(isSourceAvailable);
}
