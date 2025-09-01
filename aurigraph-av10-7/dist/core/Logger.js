"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const inversify_1 = require("inversify");
let Logger = class Logger {
    constructor(component) {
        this.component = component;
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const emoji = this.getEmoji(level);
            let logMessage = `[${timestamp}] ${emoji} [${this.component}]: ${message}`;
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
                    filename: `logs/av10-7.log`,
                    maxsize: 50 * 1024 * 1024, // 50MB
                    maxFiles: 10,
                    tailable: true
                })
            ]
        });
        if (process.env.NODE_ENV === 'production') {
            this.logger.add(new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 50 * 1024 * 1024,
                maxFiles: 10
            }));
        }
    }
    getEmoji(level) {
        switch (level) {
            case 'error': return '❌';
            case 'warn': return '⚠️';
            case 'info': return '📘';
            case 'debug': return '🔍';
            default: return '📝';
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
};
exports.Logger = Logger;
exports.Logger = Logger = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [String])
], Logger);
