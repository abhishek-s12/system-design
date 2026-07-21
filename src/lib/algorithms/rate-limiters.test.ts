import { describe, it, expect } from "vitest";
import { TokenBucket, LeakyBucket, SlidingWindowLog } from "./rate-limiters";

describe("TokenBucket Rate Limiter", () => {
  it("admits bursts up to capacity and limits subsequent requests", () => {
    // Capacity 5, refill rate 1 per second (0.001 per ms)
    const limiter = new TokenBucket(5, 1);
    
    // Test: burst of 10 requests at timestamp 1000
    let admitted = 0;
    for (let i = 0; i < 10; i++) {
      if (limiter.tryRequest(1000)) {
        admitted++;
      }
    }
    // Capacity is 5, so exactly 5 must be admitted
    expect(admitted).toBe(5);

    // Immediate next request at 1000 must be rejected
    expect(limiter.tryRequest(1000)).toBe(false);

    // Request at 2000 (1 second later) should refill 1 token and be admitted
    expect(limiter.tryRequest(2000)).toBe(true);
    expect(limiter.tryRequest(2000)).toBe(false); // second one rejected
  });
});

describe("LeakyBucket Rate Limiter", () => {
  it("leaks over time at a constant rate", () => {
    // Capacity 3, outflow rate 2 per second (0.002 per ms)
    const limiter = new LeakyBucket(3, 2);

    expect(limiter.tryRequest(1000)).toBe(true); // water = 1
    expect(limiter.tryRequest(1000)).toBe(true); // water = 2
    expect(limiter.tryRequest(1000)).toBe(true); // water = 3
    expect(limiter.tryRequest(1000)).toBe(false); // full!

    // Wait 500ms (1000 -> 1500). Bucket leaks delta * outflow = 500 * 0.002 = 1.0 unit.
    // Water level drops from 3 to 2.
    expect(limiter.tryRequest(1500)).toBe(true); // water becomes 3 again.
    expect(limiter.tryRequest(1500)).toBe(false); // rejected.
  });
});

describe("SlidingWindowLog Rate Limiter", () => {
  it("includes/excludes requests straddling window boundaries correctly", () => {
    // Window: 1000ms, Max requests: 3
    const limiter = new SlidingWindowLog(1000, 3);

    // All within window
    expect(limiter.tryRequest(100)).toBe(true);
    expect(limiter.tryRequest(200)).toBe(true);
    expect(limiter.tryRequest(300)).toBe(true);
    expect(limiter.tryRequest(400)).toBe(false); // limit reached

    // Prune check: timestamp 1050
    // Logs older than cutoff (1050 - 1000 = 50) are pruned.
    // Logs are [100, 200, 300]. All are > 50, so no prune, request rejected.
    expect(limiter.tryRequest(1050)).toBe(false);

    // Timestamp 1150: cutoff is 150.
    // Log 100 is pruned. Active logs: [200, 300]. Count = 2.
    // Admitted! Active logs: [200, 300, 1150].
    expect(limiter.tryRequest(1150)).toBe(true);
    expect(limiter.tryRequest(1150)).toBe(false); // Rejected (count = 3)

    // Timestamp 1301: cutoff is 301.
    // Logs 200 and 300 are pruned. Active logs: [1150].
    // We can admit up to 2 more requests.
    expect(limiter.tryRequest(1301)).toBe(true); // admitted
    expect(limiter.tryRequest(1301)).toBe(true); // admitted
    expect(limiter.tryRequest(1301)).toBe(false); // rejected
  });
});
