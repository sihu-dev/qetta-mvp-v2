/**
 * Metrics Collector
 * In-memory metrics collection with Prometheus-compatible export format
 */

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricLabel {
  name: string;
  value: string;
}

export interface Metric {
  name: string;
  type: MetricType;
  help: string;
  labels: MetricLabel[];
  value: number;
  timestamp?: number;
}

export interface HistogramMetric extends Metric {
  type: 'histogram';
  buckets: Map<number, number>;
  sum: number;
  count: number;
}

// Predefined histogram buckets for common use cases
export const HTTP_LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
export const API_LATENCY_BUCKETS = [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];

/**
 * In-memory metrics storage
 * Note: In production with multiple instances, consider using Redis
 */
class MetricsStore {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, { buckets: Map<number, number>; sum: number; count: number }> =
    new Map();
  private metadata: Map<string, { type: MetricType; help: string }> = new Map();

  private getKey(name: string, labels: MetricLabel[]): string {
    if (labels.length === 0) return name;
    const labelStr = labels.map((l) => `${l.name}="${l.value}"`).join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Register metric metadata
   */
  register(name: string, type: MetricType, help: string): void {
    this.metadata.set(name, { type, help });
  }

  /**
   * Increment a counter
   */
  incCounter(name: string, labels: MetricLabel[] = [], value: number = 1): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, labels: MetricLabel[] = [], value: number): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Increment a gauge
   */
  incGauge(name: string, labels: MetricLabel[] = [], value: number = 1): void {
    const key = this.getKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current + value);
  }

  /**
   * Decrement a gauge
   */
  decGauge(name: string, labels: MetricLabel[] = [], value: number = 1): void {
    const key = this.getKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current - value);
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(
    name: string,
    labels: MetricLabel[] = [],
    value: number,
    buckets: number[] = HTTP_LATENCY_BUCKETS
  ): void {
    const key = this.getKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        buckets: new Map(buckets.map((b) => [b, 0])),
        sum: 0,
        count: 0,
      };
      this.histograms.set(key, histogram);
    }

    histogram.sum += value;
    histogram.count += 1;

    for (const bucket of buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, (histogram.buckets.get(bucket) || 0) + 1);
      }
    }
  }

  /**
   * Export metrics in Prometheus text format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters) {
      const name = key.split('{')[0];
      const meta = this.metadata.get(name);
      if (meta && !lines.includes(`# HELP ${name} ${meta.help}`)) {
        lines.push(`# HELP ${name} ${meta.help}`);
        lines.push(`# TYPE ${name} counter`);
      }
      lines.push(`${key} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges) {
      const name = key.split('{')[0];
      const meta = this.metadata.get(name);
      if (meta && !lines.includes(`# HELP ${name} ${meta.help}`)) {
        lines.push(`# HELP ${name} ${meta.help}`);
        lines.push(`# TYPE ${name} gauge`);
      }
      lines.push(`${key} ${value}`);
    }

    // Export histograms
    for (const [key, histogram] of this.histograms) {
      const name = key.split('{')[0];
      const labelPart = key.includes('{') ? key.slice(key.indexOf('{')) : '';
      const meta = this.metadata.get(name);

      if (meta && !lines.includes(`# HELP ${name} ${meta.help}`)) {
        lines.push(`# HELP ${name} ${meta.help}`);
        lines.push(`# TYPE ${name} histogram`);
      }

      // Export bucket values
      const sortedBuckets = Array.from(histogram.buckets.entries()).sort((a, b) => a[0] - b[0]);
      let cumulative = 0;
      for (const [bucket, count] of sortedBuckets) {
        cumulative += count;
        const bucketLabel = labelPart
          ? labelPart.replace('}', `,le="${bucket}"}`)
          : `{le="${bucket}"}`;
        lines.push(`${name}_bucket${bucketLabel} ${cumulative}`);
      }

      // Add +Inf bucket
      const infLabel = labelPart ? labelPart.replace('}', ',le="+Inf"}') : '{le="+Inf"}';
      lines.push(`${name}_bucket${infLabel} ${histogram.count}`);

      // Add sum and count
      const sumKey = labelPart ? `${name}_sum${labelPart}` : `${name}_sum`;
      const countKey = labelPart ? `${name}_count${labelPart}` : `${name}_count`;
      lines.push(`${sumKey} ${histogram.sum}`);
      lines.push(`${countKey} ${histogram.count}`);
    }

    return lines.join('\n');
  }

  /**
   * Get all metrics as JSON (for debugging)
   */
  toJSON(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { sum: number; count: number; buckets: Record<string, number> }>;
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [
          k,
          {
            sum: v.sum,
            count: v.count,
            buckets: Object.fromEntries(v.buckets),
          },
        ])
      ),
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Global metrics store instance
export const metricsStore = new MetricsStore();

// Pre-register common metrics
metricsStore.register('http_requests_total', 'counter', 'Total number of HTTP requests');
metricsStore.register(
  'http_request_duration_seconds',
  'histogram',
  'HTTP request latency in seconds'
);
metricsStore.register('http_request_errors_total', 'counter', 'Total number of HTTP request errors');
metricsStore.register('cache_hits_total', 'counter', 'Total number of cache hits');
metricsStore.register('cache_misses_total', 'counter', 'Total number of cache misses');
metricsStore.register(
  'circuit_breaker_state_changes_total',
  'counter',
  'Total number of circuit breaker state changes'
);
metricsStore.register(
  'rate_limit_exceeded_total',
  'counter',
  'Total number of rate limit exceeded events'
);
metricsStore.register(
  'external_api_requests_total',
  'counter',
  'Total number of external API requests'
);
metricsStore.register(
  'external_api_duration_seconds',
  'histogram',
  'External API request latency in seconds'
);
metricsStore.register('active_connections', 'gauge', 'Current number of active connections');

/**
 * Convenience functions for common metrics
 */
export const metrics = {
  /**
   * Record an HTTP request
   */
  httpRequest(method: string, path: string, statusCode: number, durationSeconds: number): void {
    const labels: MetricLabel[] = [
      { name: 'method', value: method },
      { name: 'path', value: path },
      { name: 'status', value: String(statusCode) },
    ];

    metricsStore.incCounter('http_requests_total', labels);
    metricsStore.observeHistogram(
      'http_request_duration_seconds',
      [
        { name: 'method', value: method },
        { name: 'path', value: path },
      ],
      durationSeconds
    );

    if (statusCode >= 400) {
      metricsStore.incCounter('http_request_errors_total', labels);
    }
  },

  /**
   * Record a cache hit
   */
  cacheHit(cacheName: string): void {
    metricsStore.incCounter('cache_hits_total', [{ name: 'cache', value: cacheName }]);
  },

  /**
   * Record a cache miss
   */
  cacheMiss(cacheName: string): void {
    metricsStore.incCounter('cache_misses_total', [{ name: 'cache', value: cacheName }]);
  },

  /**
   * Record a circuit breaker state change
   */
  circuitBreakerStateChange(name: string, state: string): void {
    metricsStore.incCounter('circuit_breaker_state_changes_total', [
      { name: 'circuit', value: name },
      { name: 'state', value: state },
    ]);
  },

  /**
   * Record a rate limit exceeded event
   */
  rateLimitExceeded(identifier: string): void {
    metricsStore.incCounter('rate_limit_exceeded_total', [
      { name: 'identifier', value: identifier },
    ]);
  },

  /**
   * Record an external API request
   */
  externalApiRequest(
    service: string,
    endpoint: string,
    statusCode: number,
    durationSeconds: number
  ): void {
    const labels: MetricLabel[] = [
      { name: 'service', value: service },
      { name: 'endpoint', value: endpoint },
      { name: 'status', value: String(statusCode) },
    ];

    metricsStore.incCounter('external_api_requests_total', labels);
    metricsStore.observeHistogram(
      'external_api_duration_seconds',
      [
        { name: 'service', value: service },
        { name: 'endpoint', value: endpoint },
      ],
      durationSeconds,
      API_LATENCY_BUCKETS
    );
  },

  /**
   * Update active connections gauge
   */
  setActiveConnections(count: number): void {
    metricsStore.setGauge('active_connections', [], count);
  },
};
