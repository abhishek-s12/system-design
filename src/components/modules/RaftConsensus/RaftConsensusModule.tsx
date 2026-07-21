"use client";

import { ScopeBadge } from "./ScopeBadge";
import { ClusterCanvas } from "./ClusterCanvas";
import { Controls } from "./Controls";
import { QuorumBadge } from "./QuorumBadge";
import { UnderTheHood } from "./UnderTheHood";
import { GuidedScenario } from "./GuidedScenario";
import { CanvasA11ySummary } from "./CanvasA11ySummary";

export default function RaftConsensusModule() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Scope disclaimer badge */}
      <ScopeBadge />

      {/* Screen reader helper */}
      <CanvasA11ySummary />

      {/* Visualizer & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col h-full">
          <ClusterCanvas />
        </div>
        <div className="flex flex-col gap-6 justify-between">
          <GuidedScenario />
          <Controls />
        </div>
      </div>

      {/* Quorum Badge & Code Details */}
      <div className="flex flex-col gap-6">
        <QuorumBadge />
        <UnderTheHood />
      </div>
    </div>
  );
}
