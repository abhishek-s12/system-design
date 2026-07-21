"use client";

import { RingCanvas } from "./RingCanvas";
import { Controls } from "./Controls";
import { MetricsHUD } from "./MetricsHUD";
import { UnderTheHood } from "./UnderTheHood";
import { GuidedScenario } from "./GuidedScenario";
import { CanvasA11ySummary } from "./CanvasA11ySummary";

export default function ConsistentHashingModule() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hidden screen-reader info */}
      <CanvasA11ySummary />

      {/* Top Section: Ring visualizer and Side panel controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col h-full">
          <RingCanvas />
        </div>
        <div className="flex flex-col gap-6 justify-between">
          <GuidedScenario />
          <Controls />
        </div>
      </div>

      {/* Metrics and Code Panels */}
      <div className="flex flex-col gap-6">
        <MetricsHUD />
        <UnderTheHood />
      </div>
    </div>
  );
}
