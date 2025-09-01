export declare class Logger {
    private logger;
    private component;
    constructor(component: string);
    private getEmoji;
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, error?: Error | any, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}
//# sourceMappingURL=Logger.d.ts.map