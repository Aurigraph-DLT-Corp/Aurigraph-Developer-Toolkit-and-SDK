/**
 * Twitter (X.com) API v2 Client
 *
 * REST API client for Twitter API v2 with retry logic and rate limiting
 *
 * @see https://developer.twitter.com/en/docs/twitter-api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { TwitterApiResponse, TwitterApiTweet } from '../types/api';

export interface TwitterClientConfig {
  baseUrl?: string;
  bearerToken: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TwitterSearchParams {
  query: string;
  maxResults?: number; // 10-100, default 10
  startTime?: string; // ISO 8601 format
  endTime?: string; // ISO 8601 format
  sinceId?: string; // Returns results with ID greater than this
  untilId?: string; // Returns results with ID less than this
}

export interface TwitterTimelineParams {
  userId: string;
  maxResults?: number; // 5-100, default 10
  startTime?: string;
  endTime?: string;
  sinceId?: string;
  untilId?: string;
}

/**
 * Twitter API v2 Client
 */
export class TwitterClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  private readonly rateLimitPer15Min: number = 15; // requests per 15 minutes

  constructor(config: TwitterClientConfig) {
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.client = axios.create({
      baseURL: config.baseUrl ?? 'https://api.twitter.com/2',
      timeout: config.timeout ?? 10000,
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Twitter API Error:', error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Rate limiting - Twitter has 15-minute windows
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 15 * 60 * 1000; // 15 minutes in ms

    // Reset window if needed
    if (now - this.windowStart > windowDuration) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.rateLimitPer15Min) {
      const timeToWait = windowDuration - (now - this.windowStart);
      console.warn(`Twitter API rate limit reached. Waiting ${timeToWait}ms...`);
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
      this.requestCount = 0;
      this.windowStart = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<T> {
    await this.applyRateLimit();

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await this.client.get<T>(url, { params });
        return response.data;
      } catch (error) {
        if (attempt < this.retryAttempts - 1) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
          );
        } else {
          throw error;
        }
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Search recent tweets
   *
   * @param params - Search parameters
   * @returns Search results
   */
  async searchRecentTweets(params: TwitterSearchParams): Promise<TwitterApiResponse> {
    const queryParams: Record<string, any> = {
      query: params.query,
      max_results: params.maxResults ?? 10,
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username,name,verified',
      expansions: 'author_id',
    };

    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.sinceId) queryParams.since_id = params.sinceId;
    if (params.untilId) queryParams.until_id = params.untilId;

    const response = await this.fetchWithRetry<any>('/tweets/search/recent', queryParams);

    // Transform response to match our interface
    return this.transformResponse(response);
  }

  /**
   * Get user timeline (tweets by user)
   *
   * @param params - Timeline parameters
   * @returns User timeline tweets
   */
  async getUserTimeline(params: TwitterTimelineParams): Promise<TwitterApiResponse> {
    const queryParams: Record<string, any> = {
      max_results: params.maxResults ?? 10,
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username,name,verified',
      expansions: 'author_id',
    };

    if (params.startTime) queryParams.start_time = params.startTime;
    if (params.endTime) queryParams.end_time = params.endTime;
    if (params.sinceId) queryParams.since_id = params.sinceId;
    if (params.untilId) queryParams.until_id = params.untilId;

    const response = await this.fetchWithRetry<any>(
      `/users/${params.userId}/tweets`,
      queryParams
    );

    return this.transformResponse(response);
  }

  /**
   * Get tweets by IDs
   *
   * @param tweetIds - Array of tweet IDs
   * @returns Tweet data
   */
  async getTweets(tweetIds: string[]): Promise<TwitterApiResponse> {
    const ids = tweetIds.join(',');
    const response = await this.fetchWithRetry<any>('/tweets', {
      ids,
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username,name,verified',
      expansions: 'author_id',
    });

    return this.transformResponse(response);
  }

  /**
   * Transform API response to our interface
   */
  private transformResponse(response: any): TwitterApiResponse {
    // Create user map for easy lookup
    const users = new Map();
    if (response.includes?.users) {
      for (const user of response.includes.users) {
        users.set(user.id, user);
      }
    }

    // Transform tweets
    const tweets: TwitterApiTweet[] = (response.data || []).map((tweet: any) => {
      const author = users.get(tweet.author_id) || {
        id: tweet.author_id,
        username: 'unknown',
        name: 'Unknown',
        verified: false,
      };

      return {
        id: tweet.id,
        text: tweet.text,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          verified: author.verified || false,
        },
        public_metrics: tweet.public_metrics || {
          retweet_count: 0,
          reply_count: 0,
          like_count: 0,
          quote_count: 0,
        },
        created_at: tweet.created_at,
      };
    });

    return {
      data: tweets,
      meta: {
        result_count: response.meta?.result_count || tweets.length,
        newest_id: response.meta?.newest_id || (tweets[0]?.id ?? ''),
        oldest_id: response.meta?.oldest_id || (tweets[tweets.length - 1]?.id ?? ''),
      },
    };
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    remaining: number;
    total: number;
    resetTime: Date;
  } {
    const windowDuration = 15 * 60 * 1000;
    return {
      remaining: Math.max(0, this.rateLimitPer15Min - this.requestCount),
      total: this.rateLimitPer15Min,
      resetTime: new Date(this.windowStart + windowDuration),
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data || error.message;

      switch (status) {
        case 401:
          return new Error('Twitter API: Unauthorized - check your bearer token');
        case 403:
          return new Error('Twitter API: Forbidden - insufficient permissions');
        case 429:
          return new Error('Twitter API: Rate limit exceeded - try again later');
        case 500:
          return new Error('Twitter API: Internal server error');
        default:
          return new Error(`Twitter API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      return new Error('Twitter API: No response from server - check your network connection');
    } else {
      // Error setting up request
      return new Error(`Twitter API: ${error.message}`);
    }
  }
}

// Export singleton instance (requires configuration)
let twitterClientInstance: TwitterClient | null = null;

export const initializeTwitterClient = (config: TwitterClientConfig): TwitterClient => {
  twitterClientInstance = new TwitterClient(config);
  return twitterClientInstance;
};

export const getTwitterClient = (): TwitterClient => {
  if (!twitterClientInstance) {
    throw new Error('TwitterClient not initialized. Call initializeTwitterClient first.');
  }
  return twitterClientInstance;
};

export default TwitterClient;
