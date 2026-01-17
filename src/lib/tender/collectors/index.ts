/**
 * Tender Collectors - 입찰 공고 수집기 모듈
 */

export { BaseCollector } from './base-collector';
export { G2BCollector } from './g2b-collector';
// export { UNGMCollector } from './ungm-collector';  // P1
// export { SAMCollector } from './sam-collector';     // P2
// export { KZCollector } from './kz-collector';       // P2

import type { BidSource } from '../types';
import { G2BCollector } from './g2b-collector';
import { BaseCollector } from './base-collector';

/**
 * Create collector by source type
 */
export function createCollector(
  source: BidSource,
  config: { apiKey: string }
): BaseCollector {
  switch (source) {
    case 'g2b':
      return new G2BCollector(config.apiKey);
    case 'ungm':
    case 'sam':
    case 'kz':
      throw new Error(`Collector for ${source} is not yet implemented`);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}
