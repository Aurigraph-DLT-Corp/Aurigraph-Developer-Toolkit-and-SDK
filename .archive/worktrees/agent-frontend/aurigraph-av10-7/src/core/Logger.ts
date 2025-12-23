import winston from 'winston';
import { injectable } from 'inversify';

@injectable()
export class Logger {
  private logger: winston.Logger;
  private component: string;

  constructor(component: string) {
    this.component = component;
    
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const emoji = this.getEmoji(level);
        let logMessage = `[${timestamp}] ${emoji} [${this.component}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
          logMessage += `\n${stack}`;
        }
        
        return logMessage;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        }),
        new winston.transports.File({
          filename: `logs/av10-7.log`,
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
          tailable: true
        })
      ]
    });

    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 50 * 1024 * 1024,
        maxFiles: 10
      }));
    }
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return '📘';
      case 'debug': return '🔍';
      default: return '📝';
    }
  }

  info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, error?: Error | any, ...meta: any[]): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack }, ...meta);
    } else if (error) {
      this.logger.error(message, { error }, ...meta);
    } else {
      this.logger.error(message, ...meta);
    }
  }

  debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }
}