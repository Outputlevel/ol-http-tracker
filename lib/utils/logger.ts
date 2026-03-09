/**
 * Logger utility for consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

/**
 * Simple logger with module support
 */
class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  /**
   * Format log message with module context
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.module}] ${message}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    const formatted = this.formatMessage('debug', message);
    if (data) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    const formatted = this.formatMessage('info', message);
    if (data) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    const formatted = this.formatMessage('warn', message);
    if (data) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    const formatted = this.formatMessage('error', message);
    if (error) {
      if (error instanceof Error) {
        console.error(formatted, {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error(formatted, error);
      }
    } else {
      console.error(formatted);
    }
  }
}

/**
 * Create a logger instance for a module
 *
 * @param module - Module name
 * @returns Logger instance
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}

// Export default instance for convenience
export const logger = createLogger('http-tracker');
