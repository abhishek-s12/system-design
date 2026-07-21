"use client";

import { useState } from "react";
import { useRateLimiterStore } from "@/stores/rateLimiterStore";
import { Button } from "@/components/ui/Button";
import { HelpCircle, ArrowRight, Check } from "lucide-react";

export function GuidedScenario() {
  const [step, setStep] = useState(1);
  const {
    setCapacity,
    setRatePerSec,
    setTrafficRate,
    setTrafficType,
    setComparisonMode,
    triggerBurst,
    reset,
  } = useRateLimiterStore();

  const handleStart = () => {
    reset(); // start from initial state
    setComparisonMode(true);
    setCapacity(10);
    setRatePerSec(3); // slow refill
    setTrafficRate(1); // slow ingress
    setTrafficType("constant");
    setStep(2);
  };

  const handleBurstTrigger = () => {
    triggerBurst();
    setStep(3);
  };

  const handleReset = () => {
    reset();
    setStep(1);
  };

  return (
    <div className="bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="text-[#3DC9B0]" />
        <h3 className="text-sm font-semibold font-mono text-[#3DC9B0] uppercase tracking-wider">
          Guided Scenario: Burst Handling
        </h3>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            See how Token Bucket, Leaky Bucket, and Sliding Window Log handle traffic spikes differently.
          </p>
          <Button onClick={handleStart} className="w-full font-mono text-xs py-1.5 mt-1">
            Start Walkthrough <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 1: Ingesting Idle State.</strong> The pipelines are in comparison mode with capacity 10 and rate 3/sec. Ingress traffic is quiet (1 req/sec). Next, we will inject a sudden burst of 12 requests.
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" onClick={handleReset} className="font-mono text-xs py-1 flex-1">
              Reset
            </Button>
            <Button onClick={handleBurstTrigger} className="font-mono text-xs py-1 flex-1">
              Inject 12 Reqs <ArrowRight size={12} className="inline ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 2: Observe Behavior.</strong> A wave of 12 packets hit the limiters.
            Notice that **Token Bucket** absorbs the burst instantly (accepting 10, dropping 2) because it has stored tokens.
            **Leaky Bucket** accepts them but smooths/shapes the output egress, while **Sliding Window Log** strictly enforces limits using stored timestamps.
          </p>
          <Button onClick={() => setStep(4)} className="w-full font-mono text-xs py-1.5 mt-1">
            Summary <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 3: Complete.</strong> Token buckets allow spikes for fast APIs, leaky buckets shape traffic to prevent backend load spikes, and sliding logs enforce precise limits at the cost of O(N) memory logs storage.
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" onClick={handleReset} className="font-mono text-xs py-1 flex-grow">
              Run Again
            </Button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-teal-400 px-3 bg-teal-500/10 border border-teal-500/20 rounded select-none">
              <Check size={12} /> Free-Play Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
