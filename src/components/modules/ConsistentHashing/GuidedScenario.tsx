"use client";

import { useState } from "react";
import { useHashRingStore } from "@/stores/hashRingStore";
import { Button } from "@/components/ui/Button";
import { HelpCircle, ArrowRight, Check } from "lucide-react";

export function GuidedScenario() {
  const [step, setStep] = useState(1);
  const { addNode, reset } = useHashRingStore();

  const handleStart = () => {
    reset(); // Reset ring to 4 nodes & 60 keys
    setStep(2);
  };

  const handleNext = () => {
    if (step === 2) {
      addNode("Node-E");
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleReset = () => {
    reset();
    setStep(1);
  };

  return (
    <div className="bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="text-[#E8A33D]" />
        <h3 className="text-sm font-semibold font-mono text-[#E8A33D] uppercase tracking-wider">
          Guided Scenario: Scale Up Rebalance
        </h3>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            Learn how consistent hashing minimizes key migrations when scaling a cluster. We start with a 4-node ring (Node-A, B, C, D) and 60 active keys.
          </p>
          <Button onClick={handleStart} className="w-full font-mono text-xs py-1.5 mt-1">
            Start Walkthrough <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 1: Check Current Balance.</strong> Look at the <strong>Metrics Panel</strong>. The keys are spread across our nodes, and we have a specific Standard Deviation. Next, we&apos;ll scale our cluster by adding a 5th node: <strong>Node-E</strong>.
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" onClick={handleReset} className="font-mono text-xs py-1 flex-1">
              Reset
            </Button>
            <Button onClick={handleNext} className="font-mono text-xs py-1 flex-1">
              Add Node-E <ArrowRight size={12} className="inline ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 2: Observe Rebalancing.</strong> Node-E has been added to the ring. Notice the orange particles flowing along the ring—only keys that are now closer clockwise to Node-E&apos;s virtual nodes are migrating. Keys belonging to other nodes do not move!
          </p>
          <Button onClick={handleNext} className="w-full font-mono text-xs py-1.5 mt-1">
            Analyze Metrics <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 3: Scenario Complete.</strong> Node-E successfully integrated. Check the migration banner—only a fraction of keys moved (about ~17%). Under traditional <code>hash(key) % N</code> routing, adding a node triggers <strong>~80% key migration</strong>, which can crash databases in production.
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" onClick={handleReset} className="font-mono text-xs py-1 flex-grow">
              Run Again
            </Button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded select-none">
              <Check size={12} /> Free-Play Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
