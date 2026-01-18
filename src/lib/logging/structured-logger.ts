/**
 * Structured Logger
 * Production-grade logging with context, tracing, and multiple output formats
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  orgId?: string;
  service?: string;
  component?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const isProduction = process.env.NODE_ENV === 'production';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext,
  error?: unknown,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: {
      service: 'qetta-mvp',
      ...context,
    },
    error: formatError(error),
    metadata,
  };
}

function outputLog(entry: LogEntry): void {
  if (isProduction) {
    // JSON format for production (log aggregators)
    const logMethod = entry.level === 'error' ? console.error
      : entry.level === 'warn' ? console.warn
      : console.log;

    logMethod(JSON.stringify(entry));
  } else {
    // Human-readable format for development
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    const contextStr = entry.context.requestId
      ? ` [${entry.context.requestId}]`
      : '';
    const componentStr = entry.context.component
      ? ` (${entry.context.component})`
      : '';

    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}${contextStr}${componentStr}`;

    if (entry.level === 'error') {
      console.error(`${prefix} ${entry.message}`);
      if (entry.error?.stack) {
        console.error(entry.error.stack);
      }
    } else if (entry.level === 'warn') {
      console.warn(`${prefix} ${entry.message}`);
    } else {
      console.log(`${prefix} ${entry.message}`);
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', JSON.stringify(entry.metadata, null, 2));
    }
  }
}

export class StructuredLogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): StructuredLogger {
    return new StructuredLogger({
      ...this.context,
      ...additionalContext,
    });
  }

  /**
   * Set request ID for this logger instance
   */
  withRequestId(requestId: string): StructuredLogger {
    return this.child({ requestId });
  }

  /**
   * Set user context for this logger instance
   */
  withUser(userId: string, orgId?: string): StructuredLogger {
    return this.child({ userId, orgId });
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!shouldLog('debug')) return;
    const entry = createLogEntry('debug', message, this.context, undefined, metadata);
    outputLog(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!shouldLog('info')) return;
    const entry = createLogEntry('info', message, this.context, undefined, metadata);
    outputLog(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!shouldLog('warn')) return;
    const entry = createLogEntry('warn', message, this.context, undefined, metadata);
    outputLog(entry);
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    if (!shouldLog('error')) return;
    const entry = createLogEntry('error', message, this.context, error, metadata);
    outputLog(entry);
  }

  /**
   * Log with timing information
   */
  timed<T>(
    message: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): T | Promise<T> {
    const startTime = Date.now();

    const logCompletion = (result: T) => {
      const duration = Date.now() - startTime;
      this.info(`${message} completed`, { ...metadata, duration });
      return result;
    };

    const logError = (error: unknown) => {
      const duration = Date.now() - startTime;
      this.error(`${message} failed`, error, { ...metadata, duration });
      throw error;
    };

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.then(logCompletion).catch(logError) as Promise<T>;
      }

      return logCompletion(result);
    } catch (error) {
      logError(error);
      throw error; // TypeScript needs this even though logError throws
    }
  }
}

// Default logger instance
export const logger = new StructuredLogger();

// Named exports for common logging patterns
export const createLogger = (context: LogContext): StructuredLogger =>
  new StructuredLogger(context);

export const createComponentLogger = (component: string): StructuredLogger =>
  new StructuredLogger({ component });

export const createApiLogger = (endpoint: string): StructuredLogger =>
  new StructuredLogger({ component: `api:${endpoint}` });
