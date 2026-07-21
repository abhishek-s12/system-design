export interface RateLimiter {
  tryRequest(timestampMs: number): boolean;
}

/**
 * Token Bucket Algorithm
 * - Tokens are added to the bucket at a constant refill rate.
 * - When a request arrives, we attempt to draw 1 token from the bucket.
 * - Allows bursts up to the bucket's capacity.
 */
export class TokenBucket implements RateLimiter {
  capacity: number;
  refillRate: number; // tokens per millisecond
  tokens: number;
  lastRefillTime: number;

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec / 1000;
    this.tokens = capacity;
    this.lastRefillTime = 0;
  }

  tryRequest(timestampMs: number): boolean {
    if (this.lastRefillTime === 0) {
      this.lastRefillTime = timestampMs;
      this.tokens = this.capacity;
    }

    const delta = timestampMs - this.lastRefillTime;
    if (delta > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillRate);
      this.lastRefillTime = timestampMs;
    }

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

/**
 * Leaky Bucket Algorithm (as a Meter)
 * - Requests fill the bucket (represented as water).
 * - Water leaks out of the bucket at a constant outflow rate.
 * - If the bucket overflows, requests are rejected.
 * - Smooths out requests over time.
 */
export class LeakyBucket implements RateLimiter {
  capacity: number;
  outflowRate: number; // leaks per millisecond
  water: number;
  lastLeakTime: number;

  constructor(capacity: number, outflowRatePerSec: number) {
    this.capacity = capacity;
    this.outflowRate = outflowRatePerSec / 1000;
    this.water = 0;
    this.lastLeakTime = 0;
  }

  tryRequest(timestampMs: number): boolean {
    if (this.lastLeakTime === 0) {
      this.lastLeakTime = timestampMs;
      this.water = 0;
    }

    const delta = timestampMs - this.lastLeakTime;
    if (delta > 0) {
      this.water = Math.max(0, this.water - delta * this.outflowRate);
      this.lastLeakTime = timestampMs;
    }

    if (this.water + 1 <= this.capacity) {
      this.water += 1;
      return true;
    }
    return false;
  }
}

/**
 * Sliding Window Log Algorithm
 * - Saves a log of timestamps for all admitted requests.
 * - When a request arrives, we prune logs older than the sliding window boundary.
 * - If logs count is within limit, we admit the request.
 * - Extremely accurate, but high memory footprint.
 */
export class SlidingWindowLog implements RateLimiter {
  windowMs: number;
  maxRequests: number;
  logs: number[] = [];

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  tryRequest(timestampMs: number): boolean {
    const cutoff = timestampMs - this.windowMs;
    this.logs = this.logs.filter((t) => t > cutoff);

    if (this.logs.length < this.maxRequests) {
      this.logs.push(timestampMs);
      return true;
    }
    return false;
  }
}
