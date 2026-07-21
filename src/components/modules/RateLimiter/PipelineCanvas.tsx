"use client";

import { useRef, useEffect } from "react";
import { useRateLimiterStore, RateLimiterId } from "@/stores/rateLimiterStore";
import { useCanvasResize } from "@/lib/hooks/useCanvasResize";
import { useCanvasLoop } from "@/lib/hooks/useCanvasLoop";
import { TokenBucket, LeakyBucket, SlidingWindowLog } from "@/lib/algorithms/rate-limiters";

interface Packet {
  id: string;
  x: number; // progress from 0 (spawn) to 1 (exit)
  y: number; // current Y coordinate
  admitted: boolean | null; // null = in-flight, true = green, false = red
  timestamp: number;
  limiterId: string;
}

export function PipelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    comparisonMode,
    activeLimiterId,
    capacity,
    ratePerSec,
    trafficRate,
    trafficType,
    burstTriggerCount,
    updateStats,
  } = useRateLimiterStore();

  const dimensions = useCanvasResize(canvasRef, containerRef);

  // Instantiated algorithm engines kept in refs to persist state across frames
  const limitersRef = useRef<Record<string, TokenBucket | LeakyBucket | SlidingWindowLog>>({});
  const packetsRef = useRef<Packet[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastStatsUpdateTimeRef = useRef<number>(0);
  
  // Track counts locally for rolling stats
  const localStatsRef = useRef<Record<string, { admitted: number; dropped: number }>>({
    "token-bucket": { admitted: 0, dropped: 0 },
    "leaky-bucket": { admitted: 0, dropped: 0 },
    "sliding-window": { admitted: 0, dropped: 0 },
  });

  const historySeriesRef = useRef<Record<string, { timestamp: number; admitted: number; dropped: number }[]>>({
    "token-bucket": [],
    "leaky-bucket": [],
    "sliding-window": [],
  });

  // Track burst triggers
  const lastBurstTriggerRef = useRef<number>(0);

  // Initialize/reinitialize limiters when parameters change
  useEffect(() => {
    limitersRef.current = {
      "token-bucket": new TokenBucket(capacity, ratePerSec),
      "leaky-bucket": new LeakyBucket(capacity, ratePerSec),
      "sliding-window": new SlidingWindowLog(1000, capacity), // 1 second sliding window
    };
    // Reset packets and stats
    packetsRef.current = [];
    localStatsRef.current = {
      "token-bucket": { admitted: 0, dropped: 0 },
      "leaky-bucket": { admitted: 0, dropped: 0 },
      "sliding-window": { admitted: 0, dropped: 0 },
    };
    historySeriesRef.current = {
      "token-bucket": [],
      "leaky-bucket": [],
      "sliding-window": [],
    };
    updateStats({
      "token-bucket": { admittedCount: 0, droppedCount: 0, history: [] },
      "leaky-bucket": { admittedCount: 0, droppedCount: 0, history: [] },
      "sliding-window": { admittedCount: 0, droppedCount: 0, history: [] },
    });
  }, [capacity, ratePerSec, updateStats]);

  // Inject manual bursts
  useEffect(() => {
    if (burstTriggerCount === 0) return;
    
    // Inject a burst of 12 packets immediately in the next animation ticks
    const now = performance.now();
    for (let i = 0; i < 12; i++) {
      // stagger spawn slightly in virtual time
      const virtualTime = now + i * 20; 
      const newPacketId = `burst-${burstTriggerCount}-${i}`;
      
      const targetLimiters = comparisonMode
        ? ["token-bucket", "leaky-bucket", "sliding-window"]
        : [activeLimiterId];

      targetLimiters.forEach((limiterId) => {
        packetsRef.current.push({
          id: `${newPacketId}-${limiterId}`,
          x: 0.1,
          y: 0, // set dynamically in loop
          admitted: null,
          timestamp: virtualTime,
          limiterId,
        });
      });
    }
  }, [burstTriggerCount, comparisonMode, activeLimiterId]);

  useCanvasLoop(canvasRef, (ctx, deltaTime, reducedMotion) => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    // Clear background (dark charcoal base: #0E0F11)
    ctx.fillStyle = "#0E0F11";
    ctx.fillRect(0, 0, width, height);

    const now = performance.now();

    // 1. Spawning Packets according to Traffic configurations
    const spawnInterval = 1000 / trafficRate;
    const nextSpawnTime = lastSpawnTimeRef.current + spawnInterval;

    // Catch up if time delta is large, but limit batching to avoid clogging
    if (now - lastSpawnTimeRef.current > 2000) {
      lastSpawnTimeRef.current = now;
    }

    if (now >= nextSpawnTime) {
      let shouldSpawn = false;
      if (trafficType === "constant") {
        shouldSpawn = true;
      } else if (trafficType === "sinusoidal") {
        // Vary spawn rate as a wave
        const wave = Math.sin(now * 0.0015); // cycle every ~4s
        const threshold = (wave + 1) / 2; // [0, 1]
        shouldSpawn = Math.random() < threshold + 0.1;
      } else if (trafficType === "bursty") {
        // Occasional random bursts
        shouldSpawn = Math.random() < 0.15; // slow baseline
        if (Math.random() < 0.015 && now - lastBurstTriggerRef.current > 3000) {
          // Trigger a minor random burst
          lastBurstTriggerRef.current = now;
          for (let i = 0; i < 6; i++) {
            const targetLimiters = comparisonMode
              ? ["token-bucket", "leaky-bucket", "sliding-window"]
              : [activeLimiterId];

            targetLimiters.forEach((limiterId) => {
              packetsRef.current.push({
                id: `randburst-${now}-${i}-${limiterId}`,
                x: 0.1,
                y: 0,
                admitted: null,
                timestamp: now + i * 30,
                limiterId,
              });
            });
          }
        }
      }

      if (shouldSpawn) {
        const targetLimiters = comparisonMode
          ? ["token-bucket", "leaky-bucket", "sliding-window"]
          : [activeLimiterId];

        targetLimiters.forEach((limiterId) => {
          packetsRef.current.push({
            id: `packet-${now}-${limiterId}`,
            x: 0.1,
            y: 0,
            admitted: null,
            timestamp: now,
            limiterId,
          });
        });
        lastSpawnTimeRef.current = now;
      }
    }

    // 2. Define Pipelines layout
    const activeLimiters: { id: RateLimiterId; name: string }[] = comparisonMode
      ? [
          { id: "token-bucket", name: "Token Bucket" },
          { id: "leaky-bucket", name: "Leaky Bucket" },
          { id: "sliding-window", name: "Sliding Window Log" },
        ]
      : [
          activeLimiterId === "token-bucket"
            ? { id: "token-bucket", name: "Token Bucket" }
            : activeLimiterId === "leaky-bucket"
            ? { id: "leaky-bucket", name: "Leaky Bucket" }
            : { id: "sliding-window", name: "Sliding Window Log" },
        ];

    const pipelineCoords = activeLimiters.map((limiter, index) => {
      const cy =
        activeLimiters.length === 1
          ? height / 2
          : height * (0.2 + index * 0.3); // space pipelines vertically
      return {
        id: limiter.id,
        name: limiter.name,
        y: cy,
        left: width * 0.1,
        right: width * 0.9,
        evalX: width * 0.55,
      };
    });

    // 3. Draw pipeline tracks
    pipelineCoords.forEach((coord) => {
      // Pipeline track background
      ctx.beginPath();
      ctx.moveTo(coord.left, coord.y);
      ctx.lineTo(coord.right, coord.y);
      ctx.strokeStyle = "#8B8D93";
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Pipeline labels
      ctx.fillStyle = "#E8E6E1";
      ctx.font = "bold 11px var(--font-geist-mono), monospace";
      ctx.textAlign = "left";
      ctx.fillText(coord.name.toUpperCase(), coord.left, coord.y - 32);

      // Draw active parameters helper
      ctx.fillStyle = "#E8E6E1";
      ctx.globalAlpha = 0.4;
      ctx.font = "9px var(--font-geist-mono), monospace";
      if (coord.id === "sliding-window") {
        ctx.fillText(`Window: 1000ms | Limit: ${capacity} reqs`, coord.left, coord.y - 20);
      } else {
        ctx.fillText(`Capacity: ${capacity} | Rate: ${ratePerSec}/sec`, coord.left, coord.y - 20);
      }
      ctx.globalAlpha = 1.0;

      // Draw Algorithm visual states (Bucket, Queue, Window)
      const engineInstance = limitersRef.current[coord.id];
      if (engineInstance) {
        if (coord.id === "token-bucket") {
          // Refill bucket tokens visually
          const tb = engineInstance as TokenBucket;
          // Trigger internal tick for display update if no requests are coming
          tb.tryRequest(now); 
          const currentTokens = tb.tokens;

          // Draw physical bucket
          ctx.strokeStyle = "#8B8D93";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.3;
          ctx.strokeRect(coord.evalX - 15, coord.y - 12, 30, 24);
          ctx.globalAlpha = 1.0;

          // Render tokens (amber dots inside bucket)
          const dotsToDraw = Math.min(10, Math.floor(currentTokens));
          ctx.fillStyle = "#E8A33D"; // Amber tokens accent
          for (let i = 0; i < dotsToDraw; i++) {
            const dx = coord.evalX - 9 + (i % 4) * 6;
            const dy = coord.y + 6 - Math.floor(i / 4) * 6;
            ctx.beginPath();
            ctx.arc(dx, dy, 2, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Counter indicator
          ctx.fillStyle = "#E8E6E1";
          ctx.font = "9px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Tokens: ${currentTokens.toFixed(1)}`, coord.evalX, coord.y - 18);
        } else if (coord.id === "leaky-bucket") {
          const lb = engineInstance as LeakyBucket;
          lb.tryRequest(now); // update water level
          const currentWater = lb.water;

          // Draw physical funnel/bucket outline
          ctx.beginPath();
          ctx.moveTo(coord.evalX - 15, coord.y - 15);
          ctx.lineTo(coord.evalX + 15, coord.y - 15);
          ctx.lineTo(coord.evalX + 8, coord.y + 12);
          ctx.lineTo(coord.evalX - 8, coord.y + 12);
          ctx.closePath();
          ctx.strokeStyle = "#8B8D93";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Draw water level inside bucket (grayscale/blue shade)
          const fillRatio = Math.min(1, currentWater / capacity);
          if (fillRatio > 0) {
            ctx.beginPath();
            const wy = coord.y + 12 - fillRatio * 27;
            const topWidth = 8 + fillRatio * 7;
            ctx.moveTo(coord.evalX - topWidth, wy);
            ctx.lineTo(coord.evalX + topWidth, wy);
            ctx.lineTo(coord.evalX + 8, coord.y + 12);
            ctx.lineTo(coord.evalX - 8, coord.y + 12);
            ctx.closePath();
            ctx.fillStyle = "#3DC9B0"; // Teal water level
            ctx.globalAlpha = 0.35;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          // Render leaks (constant leaking particle)
          if (currentWater > 0 && now % 500 < 100) {
            ctx.fillStyle = "#3DC9B0";
            ctx.beginPath();
            ctx.arc(coord.evalX, coord.y + 18, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Counter
          ctx.fillStyle = "#E8E6E1";
          ctx.font = "9px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Water: ${currentWater.toFixed(1)}`, coord.evalX, coord.y - 20);
        } else if (coord.id === "sliding-window") {
          const swl = engineInstance as SlidingWindowLog;
          swl.tryRequest(now); // triggers prune
          const activeLogs = swl.logs;

          // Draw sliding window frame (a ruler timeline)
          const winWidth = 60;
          ctx.strokeStyle = "#8B8D93";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.3;
          ctx.strokeRect(coord.evalX - winWidth / 2, coord.y - 6, winWidth, 12);
          ctx.globalAlpha = 1.0;

          // Render ticks representing requests currently in the window logs
          ctx.strokeStyle = "#3DC9B0"; // Teal ticks
          ctx.lineWidth = 1.5;
          activeLogs.forEach((t) => {
            const timeDiff = now - t;
            if (timeDiff >= 0 && timeDiff <= 1000) {
              // Map time [0, 1000] to position [right, left]
              const tx = coord.evalX + winWidth / 2 - (timeDiff / 1000) * winWidth;
              ctx.beginPath();
              ctx.moveTo(tx, coord.y - 4);
              ctx.lineTo(tx, coord.y + 4);
              ctx.stroke();
            }
          });

          // Counter
          ctx.fillStyle = "#E8E6E1";
          ctx.font = "9px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Logs: ${activeLogs.length}`, coord.evalX, coord.y - 15);
        }
      }
    });

    // 4. Update and Draw Packets
    const packets = packetsRef.current;
    
    // Update positions
    packets.forEach((p) => {
      const coord = pipelineCoords.find((c) => c.id === p.limiterId);
      if (!coord) return;

      p.y = coord.y;
      
      // Travel speed (takes ~1.8 seconds to cross full pipeline)
      const speed = reducedMotion ? 1.5 : 0.45;
      p.x += deltaTime * speed;

      // When packet reaches the evaluation point
      const currentPhysicalX = coord.left + p.x * (coord.right - coord.left);
      if (p.admitted === null && currentPhysicalX >= coord.evalX) {
        // Run rate limiting evaluation
        const limiter = limitersRef.current[p.limiterId];
        if (limiter) {
          p.admitted = limiter.tryRequest(p.timestamp);
          
          // Log to local stats
          if (p.admitted) {
            localStatsRef.current[p.limiterId].admitted++;
          } else {
            localStatsRef.current[p.limiterId].dropped++;
          }
        } else {
          p.admitted = true;
        }
      }
    });

    // Clean up finished packets (pass coord.right)
    packetsRef.current = packets.filter((p) => p.x < 0.95);

    // Draw packets
    packets.forEach((p) => {
      const coord = pipelineCoords.find((c) => c.id === p.limiterId);
      if (!coord) return;

      const px = coord.left + p.x * (coord.right - coord.left);
      
      ctx.beginPath();
      ctx.arc(px, p.y, 4, 0, 2 * Math.PI);
      
      if (p.admitted === null) {
        ctx.fillStyle = "#8B8D93"; // Unprocessed (Gray)
      } else if (p.admitted) {
        ctx.fillStyle = "#3DC9B0"; // Admitted (Teal)
      } else {
        ctx.fillStyle = "#E85D5D"; // Dropped (Coral)
      }
      ctx.fill();
    });

    // 5. Update Zustand store stats periodically (~5x per second, to avoid choking UI)
    const statsUpdateInterval = 200; // ms
    if (now - lastStatsUpdateTimeRef.current > statsUpdateInterval) {
      lastStatsUpdateTimeRef.current = now;

      // Update history series (last 30 samples)
      activeLimiters.forEach((l) => {
        const counts = localStatsRef.current[l.id];
        const series = historySeriesRef.current[l.id];
        
        series.push({
          timestamp: now,
          admitted: counts.admitted,
          dropped: counts.dropped,
        });

        if (series.length > 40) {
          series.shift();
        }

        // Reset counts for the next interval
        localStatsRef.current[l.id] = { admitted: 0, dropped: 0 };
      });

      // Push copy to Zustand store
      const statsPayload: Record<
        string,
        {
          admittedCount: number;
          droppedCount: number;
          history: { timestamp: number; admitted: number; dropped: number }[];
        }
      > = {};
      Object.keys(localStatsRef.current).forEach((key) => {
        // Accumulate total admitted/dropped from history series
        const series = historySeriesRef.current[key];
        const totalAdmitted = series.reduce((sum, node) => sum + node.admitted, 0);
        const totalDropped = series.reduce((sum, node) => sum + node.dropped, 0);

        statsPayload[key] = {
          admittedCount: totalAdmitted,
          droppedCount: totalDropped,
          history: [...series],
        };
      });

      updateStats(statsPayload);
    }
  });

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[360px] md:min-h-[440px] flex-grow select-none bg-[#0E0F11] rounded-lg border border-[#8B8D93]/10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
