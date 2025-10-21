/**
 * Conditional logger utility that only logs in development mode
 * Helps improve performance in production by removing console calls
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// For video recorder specific logging with context
export const createVideoRecorderLogger = (context: string) => ({
  log: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[${context}] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[${context}] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`[${context}] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[${context}] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[${context}] ${message}`, ...args);
    }
  }
});

