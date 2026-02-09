/**
 * Centralized logging utility with environment-aware output.
 * In production, debug and info logs are suppressed.
 * Warnings and errors always log for monitoring purposes.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  prefix: string;
}

const config: LoggerConfig = {
  enabled: import.meta.env.DEV,
  prefix: '[CollectRoom]',
};

const formatMessage = (level: LogLevel, message: string): string => {
  return `${config.prefix} [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  /**
   * Debug-level logging. Only visible in development.
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (config.enabled) {
      console.log(formatMessage('debug', message), ...args);
    }
  },

  /**
   * Info-level logging. Only visible in development.
   */
  info: (message: string, ...args: unknown[]): void => {
    if (config.enabled) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  /**
   * Warning-level logging. Always visible.
   */
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(formatMessage('warn', message), ...args);
  },

  /**
   * Error-level logging. Always visible.
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(formatMessage('error', message), ...args);
  },

  /**
   * Group related logs together. Only visible in development.
   */
  group: (label: string): void => {
    if (config.enabled) {
      console.group(formatMessage('debug', label));
    }
  },

  /**
   * End a log group.
   */
  groupEnd: (): void => {
    if (config.enabled) {
      console.groupEnd();
    }
  },
};

export default logger;
