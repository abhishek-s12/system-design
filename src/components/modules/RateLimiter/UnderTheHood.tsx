"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export function UnderTheHood() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlg, setSelectedAlg] = useState<"token" | "leaky" | "sliding">("token");

  const codeBlocks = {
    token: `// Token Bucket Request Check
function tryRequest(timestampMs: number): boolean {
  // Refill tokens based on time elapsed
  const delta = timestampMs - lastRefillTime;
  if (delta > 0) {
    tokens = Math.min(capacity, tokens + delta * refillRate);
    lastRefillTime = timestampMs;
  }
  
  // Admit request if token is available
  if (tokens >= 1) {
    tokens -= 1;
    return true; // Admitted
  }
  return false; // Dropped (Rate Limited)
}`,
    leaky: `// Leaky Bucket Request Check
function tryRequest(timestampMs: number): boolean {
  // Leak water based on time elapsed
  const delta = timestampMs - lastLeakTime;
  if (delta > 0) {
    water = Math.max(0, water - delta * outflowRate);
    lastLeakTime = timestampMs;
  }
  
  // Accept if bucket does not overflow
  if (water + 1 <= capacity) {
    water += 1;
    return true; // Admitted
  }
  return false; // Dropped (Rate Limited)
}`,
    sliding: `// Sliding Window Log Check
function tryRequest(timestampMs: number): boolean {
  const cutoff = timestampMs - windowMs;
  
  // Prune all timestamps older than window boundary
  logs = logs.filter(t => t > cutoff);
  
  // Admit if within window capacity limits
  if (logs.length < maxRequests) {
    logs.push(timestampMs);
    return true; // Admitted
  }
  return false; // Dropped (Rate Limited)
}`,
  };

  return (
    <div className="flex flex-col bg-[#17181B] border border-[#8B8D93]/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-4 font-mono text-xs font-semibold text-[#E8E6E1]/80 hover:text-[#E8E6E1] transition-colors cursor-pointer select-none"
      >
        <span>UNDER THE HOOD: RATE LIMITING CODES</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="border-t border-[#8B8D93]/10 p-5 flex flex-col gap-5">
          {/* Tabs for selecting code block */}
          <div className="flex bg-[#0E0F11] border border-[#8B8D93]/10 rounded p-1 max-w-sm">
            {(["token", "leaky", "sliding"] as const).map((alg) => (
              <button
                key={alg}
                onClick={() => setSelectedAlg(alg)}
                className={`flex-1 py-1 font-mono text-[10px] rounded transition-all select-none cursor-pointer ${
                  selectedAlg === alg
                    ? "bg-[#17181B] text-[#E8E6E1]"
                    : "text-[#E8E6E1]/50 hover:text-[#E8E6E1]"
                }`}
              >
                {alg === "token"
                  ? "Token Bucket"
                  : alg === "leaky"
                  ? "Leaky Bucket"
                  : "Sliding Log"}
              </button>
            ))}
          </div>

          {/* Code block display */}
          <div className="bg-[#0E0F11] border border-[#8B8D93]/10 rounded p-4 font-mono text-[11px] leading-5 text-[#E8E6E1]/90">
            <pre className="whitespace-pre overflow-x-auto">{codeBlocks[selectedAlg]}</pre>
          </div>

          {/* Production callout */}
          <div className="bg-[#0E0F11]/40 border border-[#8B8D93]/10 rounded p-4 text-xs text-[#E8E6E1]/80">
            <h4 className="font-semibold font-mono text-[#3DC9B0] uppercase tracking-wider mb-2 text-[10px]">
              What would break in production
            </h4>
            <p className="leading-relaxed">
              In a distributed system, running rate limiters at scale introduces synchronization and memory bottlenecks. A Sliding Window Log provides absolute accuracy but consumes significant memory (O(N) where N is requests count), making it vulnerable to DDoS state attacks. Token Bucket is memory-efficient (O(1) storage) but requires active locking or distributed counter updates (e.g., via Redis or atomic operations) across cluster nodes, leading to performance write-throughput ceilings or split-brain sync inconsistencies under high traffic.
            </p>
            <div className="mt-3 flex items-center">
              <a
                href="https://konghq.com/blog/engineering/how-we-built-rate-limiting-at-scale"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#3DC9B0] hover:underline font-medium font-mono text-[10px]"
              >
                Read Kong&apos;s Distributed Rate Limiting Write-up <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
