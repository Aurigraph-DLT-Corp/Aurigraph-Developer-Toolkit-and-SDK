/**
 * Console Logger with Error Suppression
 *
 * Filters out expected/non-critical errors in development:
 * - Chrome extension messaging errors
 * - WebSocket endpoint unavailable (expected in dev)
 * - Microphone permissions policy violations
 * - Back/forward cache port closure errors
 */

interface LoggerConfig {
  enableSuppression: boolean;
  suppressedPatterns: RegExp[];
  enableConsoleLogging: boolean;
}

class ConsoleLogger {
  private config: LoggerConfig;
  private originalError = console.error;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableSuppression: true,
      enableConsoleLogging: true,
      suppressedPatterns: [
        // Chrome extension messaging errors
        /No tab with id:/,
        /Unchecked runtime\.lastError/,
        /The page keeping the extension port is moved into back\/forward cache/,
        /the message channel is closed/,
        
        // Expected development warnings
        /WebSocket endpoint not available/i,
        /WebSocket endpoint unavailable/i,
        /using.*simulation mode/i,
        /using.*demo.*mode/i,
        /backend.*endpoint not available/i,
        /Connection refused/i,
        
        // Permissions policy
        /Potential permissions policy violation/i,
        /microphone is not allowed/i,
      ],
      ...config,
    };

    this.setupInterceptors();
  }

  /**
   * Setup console interceptors
   */
  private setupInterceptors() {
    // Intercept console.error
    console.error = (...args: any[]) => {
      if (this.shouldSuppress(args)) {
        // Silently suppress
        return;
      }
      this.originalError.apply(console, args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      if (this.shouldSuppress(args)) {
        // Silently suppress
        return;
      }
      // Also apply original warn
      const originalWarn = window.console.warn;
      if (originalWarn && originalWarn !== console.warn) {
        originalWarn.apply(console, args);
      }
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.shouldSuppress([event.reason])) {
        event.preventDefault();
      }
    });
  }

  /**
   * Check if error message matches suppressed patterns
   */
  private shouldSuppress(args: any[]): boolean {
    if (!this.config.enableSuppression) {
      return false;
    }

    const message = args.map((arg) => String(arg)).join(' ');
    return this.config.suppressedPatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Restore original console methods
   */
  restoreConsole() {
    console.error = this.originalError;
  }

  /**
   * Update suppression config
   */
  updateConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// Initialize logger immediately
const consoleLogger = new ConsoleLogger({
  enableSuppression: process.env.NODE_ENV === 'production' || process.env.VITE_SUPPRESS_ERRORS === 'true',
  enableConsoleLogging: process.env.NODE_ENV !== 'production',
});

export default consoleLogger;
