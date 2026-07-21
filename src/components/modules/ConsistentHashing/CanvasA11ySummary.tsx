"use client";

import { useHashRingStore } from "@/stores/hashRingStore";

export function CanvasA11ySummary() {
  const { nodes, ring, keys, metrics, lastMovedKeys, lastMigrationPercent } = useHashRingStore();

  const totalKeys = keys.length;
  const nodesCount = nodes.length;
  const vnodesCount = ring.length;
  const stdDev = metrics.stdDev.toFixed(2);

  let summaryText = `Consistent hashing ring with ${nodesCount} physical nodes, ${vnodesCount} total virtual nodes, and ${totalKeys} keys. `;
  summaryText += `Key distribution standard deviation is ${stdDev}. `;

  if (lastMovedKeys.length > 0) {
    summaryText += `Last rebalance migrated ${lastMovedKeys.length} keys, which is ${lastMigrationPercent.toFixed(1)}% of total keys.`;
  }

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {summaryText}
    </div>
  );
}
