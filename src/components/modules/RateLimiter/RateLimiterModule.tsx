"use client";

import { PipelineCanvas } from "./PipelineCanvas";
import { Controls } from "./Controls";
import { ThroughputChart } from "./ThroughputChart";
import { UnderTheHood } from "./UnderTheHood";
import { GuidedScenario } from "./GuidedScenario";
import { CanvasA11ySummary } from "./CanvasA11ySummary";

export default function RateLimiterModule() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Accessibility summary */}
      <CanvasA11ySummary />

      {/* Top section: Pipeline rendering & side panel controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col h-full">
          <PipelineCanvas />
        </div>
        <div className="flex flex-col gap-6 justify-between">
          <GuidedScenario />
          <Controls />
        </div>
      </div>

      {/* Metrics throughput history and under-the-hood code */}
      <div className="flex flex-col gap-6">
        <ThroughputChart />
        <UnderTheHood />
      </div>
    </div>
  );
}
