"use client";

import { useHashRingStore } from "@/stores/hashRingStore";
import { MetricBadge } from "@/components/ui/MetricBadge";

export function MetricsHUD() {
  const { ring, keys, metrics } = useHashRingStore();

  const totalKeys = keys.length;
  const avgKeys = metrics.average;
  const stdDev = metrics.stdDev;
  const totalVNodes = ring.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-4">
      <MetricBadge label="Active Keys" value={totalKeys} />
      <MetricBadge label="Total VNodes" value={totalVNodes} />
      <MetricBadge label="Avg Keys / Node" value={avgKeys.toFixed(1)} />
      <MetricBadge
        label="Std Dev (Balance)"
        value={stdDev.toFixed(2)}
        className={
          stdDev > 25
            ? "border-coral/20 text-[#E85D5D]"
            : "border-teal/20 text-[#3DC9B0]"
        }
      />
    </div>
  );
}
