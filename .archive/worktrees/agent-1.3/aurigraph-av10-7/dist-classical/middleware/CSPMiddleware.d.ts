import { Request, Response, NextFunction } from 'express';
/**
 * Universal CSP Middleware for all Aurigraph projects
 * Fixes font loading, data URIs, and common web development CSP issues
 */
export declare class CSPMiddleware {
    /**
     * Standard CSP configuration for web applications with font support
     */
    static getWebAppCSP(): string;
    /**
     * Strict CSP configuration for API-only servers
     */
    static getAPIServerCSP(): string;
    /**
     * Development-friendly CSP (less restrictive for local development)
     */
    static getDevCSP(): string;
    /**
     * Express middleware for web applications
     */
    static webApp(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Express middleware for API servers
     */
    static apiServer(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Express middleware for development environments
     */
    static development(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Override any existing CSP headers (use as last middleware)
     */
    static forceOverride(csp: string): (req: Request, res: Response, next: NextFunction) => void;
}
/**
 * Quick usage examples:
 *
 * // For web apps with UI
 * app.use(CSPMiddleware.webApp());
 *
 * // For API-only servers
 * app.use(CSPMiddleware.apiServer());
 *
 * // For development (less restrictive)
 * app.use(CSPMiddleware.development());
 *
 * // Force override any existing CSP
 * app.use(CSPMiddleware.forceOverride(CSPMiddleware.getWebAppCSP()));
 */ 
//# sourceMappingURL=CSPMiddleware.d.ts.map