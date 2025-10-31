/**
 * Authentication Manager
 * Handles API key, JWT, OAuth2, and wallet-based authentication
 */

import { sign, verify, decode } from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthCredentials, AuthError, AurigraphConfig } from '../types/index';

export class AuthManager {
  private apiKey?: string;
  private token?: string;
  private privateKey?: string;
  private oauth?: any;
  private tokenExpiry?: number;
  private refreshPromise?: Promise<string>;

  constructor(credentials: AuthCredentials) {
    this.apiKey = credentials.apiKey;
    this.token = credentials.token;
    this.privateKey = credentials.privateKey;
    this.oauth = credentials.oauth;

    if (this.token) {
      this.validateAndSetToken(this.token);
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): Record<string, string> {
    if (this.apiKey) {
      return {
        'X-API-Key': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
      };
    }

    if (this.token) {
      // Refresh token if close to expiry (within 5 minutes)
      if (this.isTokenExpiringSoon()) {
        throw new AuthError('Token expired. Please refresh authentication.');
      }
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }

    throw new AuthError('No authentication credentials configured');
  }

  /**
   * Validate JWT token and extract claims
   */
  validateToken(token: string): Record<string, any> {
    try {
      const decoded = decode(token, { complete: true });
      if (!decoded) {
        throw new AuthError('Invalid token format');
      }

      const payload = decoded.payload as Record<string, any>;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new AuthError('Token has expired');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(`Token validation failed: ${error}`);
    }
  }

  /**
   * Sign data with private key for transaction authentication
   */
  signTransaction(data: string | Buffer): string {
    if (!this.privateKey) {
      throw new AuthError('Private key not configured for signing');
    }

    try {
      const bufferData = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      const sign = crypto.createSign('sha256');
      sign.update(bufferData);
      return sign.sign(this.privateKey, 'hex');
    } catch (error) {
      throw new AuthError(`Failed to sign transaction: ${error}`);
    }
  }

  /**
   * Verify signed data with public key
   */
  verifySignature(data: string | Buffer, signature: string, publicKey: string): boolean {
    try {
      const bufferData = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      const verify = crypto.createVerify('sha256');
      verify.update(bufferData);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate API key hash for secure storage
   */
  hashAPIKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Create request signature for HMAC authentication
   */
  createHMACSignature(
    method: string,
    path: string,
    body?: string,
    timestamp?: number
  ): string {
    if (!this.apiKey) {
      throw new AuthError('API key required for HMAC signature');
    }

    const ts = timestamp || Date.now();
    const message = `${method}${path}${body || ''}${ts}`;
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Request OAuth2 token using client credentials
   */
  async requestOAuthToken(baseURL: string): Promise<string> {
    if (!this.oauth) {
      throw new AuthError('OAuth configuration not provided');
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${baseURL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: this.oauth.grantType,
            client_id: this.oauth.clientId,
            client_secret: this.oauth.clientSecret,
            scope: (this.oauth.scope || []).join(' '),
          }).toString(),
        });

        if (!response.ok) {
          throw new AuthError(`OAuth token request failed: ${response.statusText}`);
        }

        const data = await response.json();
        this.token = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        return this.token;
      } finally {
        this.refreshPromise = undefined;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Check if token is expiring soon (within 5 minutes)
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) {
      return false;
    }

    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes

    return now + expiryBuffer > this.tokenExpiry;
  }

  /**
   * Validate and set token with expiry tracking
   */
  private validateAndSetToken(token: string): void {
    try {
      const payload = this.validateToken(token);
      this.token = token;

      if (payload.exp) {
        this.tokenExpiry = payload.exp * 1000;
      }
    } catch (error) {
      throw new AuthError(`Invalid token provided: ${error}`);
    }
  }

  /**
   * Clear all credentials
   */
  clear(): void {
    this.apiKey = undefined;
    this.token = undefined;
    this.privateKey = undefined;
    this.oauth = undefined;
    this.tokenExpiry = undefined;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.apiKey || this.token || this.oauth || this.privateKey);
  }

  /**
   * Get authentication method type
   */
  getAuthType(): 'api_key' | 'jwt' | 'oauth' | 'private_key' | 'none' {
    if (this.apiKey) return 'api_key';
    if (this.token) return 'jwt';
    if (this.oauth) return 'oauth';
    if (this.privateKey) return 'private_key';
    return 'none';
  }
}
