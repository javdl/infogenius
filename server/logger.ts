/**
 * Simple structured logger for observability
 * Outputs JSON logs for easy parsing by log aggregators
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const formatLog = (level: LogLevel, message: string, meta?: Record<string, unknown>): string => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog('debug', message, meta));
    }
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(formatLog('info', message, meta));
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatLog('warn', message, meta));
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(formatLog('error', message, meta));
  },

  // Request logging helper
  request: (method: string, path: string, meta?: Record<string, unknown>) => {
    console.log(formatLog('info', `${method} ${path}`, { type: 'request', method, path, ...meta }));
  },

  // Response logging helper
  response: (method: string, path: string, statusCode: number, durationMs: number, meta?: Record<string, unknown>) => {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    console.log(formatLog(level, `${method} ${path} ${statusCode}`, {
      type: 'response',
      method,
      path,
      statusCode,
      durationMs,
      ...meta
    }));
  },
};

export default logger;
