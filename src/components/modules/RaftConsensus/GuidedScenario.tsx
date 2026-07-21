"use client";

import { useState } from "react";
import { useRaftStore } from "@/stores/raftStore";
import { Button } from "@/components/ui/Button";
import { HelpCircle, ArrowRight, Check } from "lucide-react";

export function GuidedScenario() {
  const [step, setStep] = useState(1);
  const { setPartitions, healPartitions, reset } = useRaftStore();

  const handleStart = () => {
    reset(); // reset to clean state
    setStep(2);
  };

  const handleSplit = () => {
    // Partition into 3-2
    setPartitions([
      ["Node-1", "Node-2", "Node-3"],
      ["Node-4", "Node-5"],
    ]);
    setStep(3);
  };

  const handleHeal = () => {
    healPartitions();
    setStep(4);
  };

  const handleReset = () => {
    reset();
    setStep(1);
  };

  return (
    <div className="bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="text-[#9B7EE8]" />
        <h3 className="text-sm font-semibold font-mono text-[#9B7EE8] uppercase tracking-wider">
          Guided Scenario: Network Partition
        </h3>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            See how network splits affect leader elections and consensus quorum. We start with a healthy 5-node cluster.
          </p>
          <Button onClick={handleStart} className="w-full font-mono text-xs py-1.5 mt-1">
            Start Walkthrough <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 1: Healthy Consensus.</strong> The cluster is fully connected and a leader is sending heartbeat pulses. Next, we will split the network 3-2: Group A (Node-1,2,3) and Group B (Node-4,5).
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" onClick={handleReset} className="font-mono text-xs py-1 flex-1">
              Reset
            </Button>
            <Button onClick={handleSplit} className="font-mono text-xs py-1 flex-1">
              Split 3-2 <ArrowRight size={12} className="inline ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 2: Split Brain & Quorum.</strong> Look at the partition status. Group A has 3 alive nodes (majority), so it can successfully elect and maintain a leader. Group B has only 2 nodes (minority), meaning it lacks quorum and can **never** elect a leader.
          </p>
          <Button onClick={handleHeal} className="w-full font-mono text-xs py-1.5 mt-1">
            Heal Partition <ArrowRight size={12} className="inline ml-1" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#E8E6E1]/80 leading-relaxed">
            <strong>Step 3: Healing.</strong> The partition has healed. Observe how Group B nodes, having timed out and incremented their term count, broadcast their higher term. This forces the old leader to step down, and the entire cluster converges on a single, new leader!
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" onClick={handleReset} className="font-mono text-xs py-1 flex-grow">
              Run Again
            </Button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-violet-400 px-3 bg-violet-500/10 border border-violet-500/20 rounded select-none">
              <Check size={12} /> Free-Play Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
