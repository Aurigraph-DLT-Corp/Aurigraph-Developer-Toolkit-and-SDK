"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const inversify_1 = require("inversify");
let Logger = (() => {
    let _classDecorators = [(0, inversify_1.injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Logger = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Logger = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger;
        component;
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
    return Logger = _classThis;
})();
exports.Logger = Logger;
