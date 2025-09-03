"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
class Logger {
    logger;
    component;
    constructor(component) {
        this.component = component;
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let logMessage = `[${timestamp}] ${level.toUpperCase()} [${this.component}]: ${message}`;
            if (Object.keys(meta).length > 0) {
                logMessage += ` ${JSON.stringify(meta)}`;
            }
            if (stack) {
                logMessage += `\n${stack}`;
            }
            return logMessage;
        }));
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
                }),
                new winston_1.default.transports.File({
                    filename: `logs/${this.component.toLowerCase()}.log`,
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5,
                    tailable: true
                })
            ]
        });
        if (process.env.NODE_ENV === 'production') {
            this.logger.add(new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 10 * 1024 * 1024,
                maxFiles: 10
            }));
        }
    }
    info(message, ...meta) {
        this.logger.info(message, ...meta);
    }
    warn(message, ...meta) {
        this.logger.warn(message, ...meta);
    }
    error(message, error, ...meta) {
        if (error instanceof Error) {
            this.logger.error(message, { error: error.message, stack: error.stack }, ...meta);
        }
        else if (error) {
            this.logger.error(message, { error }, ...meta);
        }
        else {
            this.logger.error(message, ...meta);
        }
    }
    debug(message, ...meta) {
        this.logger.debug(message, ...meta);
    }
    verbose(message, ...meta) {
        this.logger.verbose(message, ...meta);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map