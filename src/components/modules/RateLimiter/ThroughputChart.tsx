"use client";

import { useEffect, useRef } from "react";
import { useRateLimiterStore, RateLimiterId } from "@/stores/rateLimiterStore";

interface ChartProps {
  limiterId: RateLimiterId;
  title: string;
}

export function ThroughputChart() {
  const { comparisonMode, activeLimiterId } = useRateLimiterStore();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {activeLimiters.map((limiter) => (
        <SingleChart key={limiter.id} limiterId={limiter.id} title={limiter.name} />
      ))}
    </div>
  );
}

function SingleChart({ limiterId, title }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stats = useRateLimiterStore((state) => state.stats[limiterId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Dark surface background
    ctx.fillStyle = "#17181B";
    ctx.fillRect(0, 0, width, height);

    // Padding settings
    const padding = { left: 24, right: 10, top: 22, bottom: 15 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Draw horizontal grid lines
    ctx.strokeStyle = "#8B8D93";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotHeight / 4) * i;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Draw axes Y labels
    ctx.fillStyle = "#E8E6E1";
    ctx.globalAlpha = 0.35;
    ctx.font = "8px var(--font-geist-mono), monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("20", padding.left - 4, padding.top);
    ctx.fillText("10", padding.left - 4, padding.top + plotHeight / 2);
    ctx.fillText("0", padding.left - 4, padding.top + plotHeight);
    ctx.globalAlpha = 1.0;

    // Draw Chart Title
    ctx.fillStyle = "#E8E6E1";
    ctx.font = "bold 9px var(--font-geist-mono), monospace";
    ctx.textAlign = "left";
    ctx.fillText(title.toUpperCase(), padding.left, padding.top - 8);

    // Draw series
    const history = stats.history || [];
    if (history.length < 2) return;

    const maxVal = 20; // Cap vertical graph scale at 20 requests per interval
    const maxSamples = 40;

    const getX = (idx: number) => padding.left + (plotWidth / (maxSamples - 1)) * idx;
    const getY = (val: number) =>
      padding.top + plotHeight - (Math.min(maxVal, val) / maxVal) * plotHeight;

    // Draw Admitted (Teal)
    ctx.beginPath();
    history.forEach((node, idx) => {
      const x = getX(idx);
      const y = getY(node.admitted);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#3DC9B0";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Draw Dropped (Coral)
    ctx.beginPath();
    history.forEach((node, idx) => {
      const x = getX(idx);
      const y = getY(node.dropped);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#E85D5D";
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }, [stats, title]);

  return (
    <div className="bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-3 flex flex-col h-32 md:h-36">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
