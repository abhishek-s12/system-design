"use client";

import { useRateLimiterStore, TrafficType, RateLimiterId } from "@/stores/rateLimiterStore";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Zap, RefreshCw } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

export function Controls() {
  const {
    comparisonMode,
    activeLimiterId,
    capacity,
    ratePerSec,
    trafficRate,
    trafficType,
    setComparisonMode,
    setActiveLimiterId,
    setCapacity,
    setRatePerSec,
    setTrafficRate,
    setTrafficType,
    triggerBurst,
    reset,
  } = useRateLimiterStore();

  const limiterTabs = [
    { id: "token-bucket" as const, label: "Token Bucket" },
    { id: "leaky-bucket" as const, label: "Leaky Bucket" },
    { id: "sliding-window" as const, label: "Sliding Window" },
  ];

  const trafficTypeTabs = [
    { id: "constant" as const, label: "Constant" },
    { id: "bursty" as const, label: "Bursty" },
    { id: "sinusoidal" as const, label: "Sinusoidal" },
  ];

  return (
    <div className="flex flex-col gap-5 bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5">
      <h3 className="text-sm font-semibold font-mono text-[#3DC9B0] uppercase tracking-wider">
        Traffic Controls
      </h3>

      {/* Mode Toggles */}
      <div className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Visualization Mode</span>
        <div className="flex gap-2">
          <Button
            variant={comparisonMode ? "primary" : "secondary"}
            onClick={() => setComparisonMode(true)}
            className="flex-1 py-1.5 font-mono text-xs cursor-pointer"
          >
            Compare All 3
          </Button>
          <Button
            variant={!comparisonMode ? "primary" : "secondary"}
            onClick={() => setComparisonMode(false)}
            className="flex-1 py-1.5 font-mono text-xs cursor-pointer"
          >
            Single View
          </Button>
        </div>

        {/* If single view, show tabs to switch active algorithm */}
        {!comparisonMode && (
          <div className="mt-3">
            <span className="text-[10px] text-[#E8E6E1]/50 block mb-1">Select Algorithm</span>
            <Tabs
              items={limiterTabs}
              activeId={activeLimiterId}
              onChange={(id) => setActiveLimiterId(id as RateLimiterId)}
            />
          </div>
        )}
      </div>

      {/* Limiter Parameters */}
      <div className="flex flex-col gap-4 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Limiter Configuration</span>
        <Slider
          label="Bucket Capacity (Limit)"
          min={1}
          max={30}
          value={capacity}
          onChange={setCapacity}
        />
        <Slider
          label="Refill / Outflow Rate (req/sec)"
          min={1}
          max={20}
          value={ratePerSec}
          onChange={setRatePerSec}
        />
      </div>

      {/* Traffic Parameters */}
      <div className="flex flex-col gap-4 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Traffic Ingestion</span>
        <Slider
          label="Ingress Traffic Rate (req/sec)"
          min={1}
          max={20}
          value={trafficRate}
          onChange={setTrafficRate}
        />
        
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#E8E6E1]/50">Traffic Pattern</span>
          <Tabs
            items={trafficTypeTabs}
            activeId={trafficType}
            onChange={(id) => setTrafficType(id as TrafficType)}
          />
        </div>
      </div>

      {/* Trigger Actions */}
      <div className="flex gap-2">
        <Button
          onClick={triggerBurst}
          className="flex-grow font-mono text-xs py-2 bg-[#E85D5D]/10 text-[#E85D5D] border border-[#E85D5D]/20 hover:bg-[#E85D5D]/20 cursor-pointer"
        >
          <Zap size={14} className="inline mr-1" /> Inject Burst
        </Button>
        <Button variant="secondary" onClick={reset} className="font-mono text-xs py-2 cursor-pointer">
          <RefreshCw size={12} className="inline mr-1" /> Reset Stats
        </Button>
      </div>
    </div>
  );
}
