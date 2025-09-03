export declare class Logger {
    private logger;
    private component;
    constructor(component: string);
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, error?: Error | any, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
    verbose(message: string, ...meta: any[]): void;
}
//# sourceMappingURL=Logger.d.ts.map