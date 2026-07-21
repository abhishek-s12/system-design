"use client";

import { useRateLimiterStore } from "@/stores/rateLimiterStore";

export function CanvasA11ySummary() {
  const { comparisonMode, activeLimiterId, stats } = useRateLimiterStore();

  let summaryText = "";
  if (comparisonMode) {
    summaryText += "Comparing 3 rate limiting pipelines. ";
    summaryText += `Token Bucket: ${stats["token-bucket"].admittedCount} admitted, ${stats["token-bucket"].droppedCount} dropped in active window. `;
    summaryText += `Leaky Bucket: ${stats["leaky-bucket"].admittedCount} admitted, ${stats["leaky-bucket"].droppedCount} dropped. `;
    summaryText += `Sliding Window Log: ${stats["sliding-window"].admittedCount} admitted, ${stats["sliding-window"].droppedCount} dropped.`;
  } else {
    const activeStats = stats[activeLimiterId];
    summaryText += `Active rate limiter is ${activeLimiterId.replace("-", " ")}. `;
    summaryText += `Current metrics: ${activeStats.admittedCount} admitted, ${activeStats.droppedCount} dropped in active window.`;
  }

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="false">
      {summaryText}
    </div>
  );
}
