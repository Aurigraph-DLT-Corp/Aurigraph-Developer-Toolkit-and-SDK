"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSPMiddleware = void 0;
/**
 * Universal CSP Middleware for all Aurigraph projects
 * Fixes font loading, data URIs, and common web development CSP issues
 */
class CSPMiddleware {
    /**
     * Standard CSP configuration for web applications with font support
     */
    static getWebAppCSP() {
        return [
            "default-src 'self'",
            "font-src 'self' data: https: blob:",
            "style-src 'self' 'unsafe-inline' https:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' ws: wss: https:",
            "media-src 'self' data: blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'"
        ].join('; ');
    }
    /**
     * Strict CSP configuration for API-only servers
     */
    static getAPIServerCSP() {
        return [
            "default-src 'self'",
            "font-src 'self' data: https:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self'",
            "img-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'"
        ].join('; ');
    }
    /**
     * Development-friendly CSP (less restrictive for local development)
     */
    static getDevCSP() {
        return [
            "default-src 'self'",
            "font-src 'self' data: https: blob: *",
            "style-src 'self' 'unsafe-inline' *",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
            "img-src 'self' data: https: blob: *",
            "connect-src 'self' ws: wss: https: *",
            "media-src 'self' data: blob: *"
        ].join('; ');
    }
    /**
     * Express middleware for web applications
     */
    static webApp() {
        return (req, res, next) => {
            res.setHeader('Content-Security-Policy', CSPMiddleware.getWebAppCSP());
            next();
        };
    }
    /**
     * Express middleware for API servers
     */
    static apiServer() {
        return (req, res, next) => {
            res.setHeader('Content-Security-Policy', CSPMiddleware.getAPIServerCSP());
            next();
        };
    }
    /**
     * Express middleware for development environments
     */
    static development() {
        return (req, res, next) => {
            res.setHeader('Content-Security-Policy', CSPMiddleware.getDevCSP());
            next();
        };
    }
    /**
     * Override any existing CSP headers (use as last middleware)
     */
    static forceOverride(csp) {
        return (req, res, next) => {
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;
            // Override CSP header on all response methods
            res.send = function (body) {
                res.setHeader('Content-Security-Policy', csp);
                return originalSend.call(this, body);
            };
            res.json = function (obj) {
                res.setHeader('Content-Security-Policy', csp);
                return originalJson.call(this, obj);
            };
            res.end = function (chunk, encoding) {
                res.setHeader('Content-Security-Policy', csp);
                return originalEnd.call(this, chunk, encoding);
            };
            next();
        };
    }
}
exports.CSPMiddleware = CSPMiddleware;
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
//# sourceMappingURL=CSPMiddleware.js.map