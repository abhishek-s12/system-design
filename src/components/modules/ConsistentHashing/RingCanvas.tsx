"use client";

import { useRef, useEffect } from "react";
import { useHashRingStore } from "@/stores/hashRingStore";
import { useCanvasResize } from "@/lib/hooks/useCanvasResize";
import { useCanvasLoop } from "@/lib/hooks/useCanvasLoop";
import { fnv1a } from "@/lib/algorithms/consistent-hash";

interface MigrationParticle {
  keyId: string;
  fromAngle: number;
  toAngle: number;
  progress: number; // 0 to 1
  color: string;
}

export function RingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { ring, nodes, keys, lastMovedKeys, lastMigrationPercent } = useHashRingStore();
  const dimensions = useCanvasResize(canvasRef, containerRef);

  // Store lists in refs for access in the canvas loop (prevents re-triggering loop)
  const ringRef = useRef(ring);
  const nodesRef = useRef(nodes);
  const keysRef = useRef(keys);
  const particlesRef = useRef<MigrationParticle[]>([]);

  // Offscreen canvas caching for static ring background (boosts performance significantly)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenNeedsRedrawRef = useRef(true);

  useEffect(() => {
    ringRef.current = ring;
  }, [ring]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  // Mark offscreen canvas for redraw when ring parameters or dimensions change
  useEffect(() => {
    offscreenNeedsRedrawRef.current = true;
  }, [ring, nodes, dimensions.width, dimensions.height]);

  // Handle new migrations
  useEffect(() => {
    if (lastMovedKeys.length === 0) return;

    const newParticles: MigrationParticle[] = [];
    const MAX_PARTICLES = 100; // limit particle count to protect performance

    lastMovedKeys.slice(0, MAX_PARTICLES).forEach((move) => {
      const keyHash = fnv1a(move.key);

      // Find node angles on the ring (estimate angle of the closest vnode of each node)
      const fromVNodes = ringRef.current.filter((vn) => vn.nodeId === move.from);
      const toVNodes = ringRef.current.filter((vn) => vn.nodeId === move.to);

      if (fromVNodes.length > 0 && toVNodes.length > 0) {
        // Find closest vnode to the key for starting and ending points
        const getClosestVNodeAngle = (vnodes: typeof ring, targetHash: number) => {
          let closest = vnodes[0];
          let minDist = Math.abs(closest.hash - targetHash);
          vnodes.forEach((vn) => {
            const dist = Math.abs(vn.hash - targetHash);
            if (dist < minDist) {
              minDist = dist;
              closest = vn;
            }
          });
          return (closest.hash / 4294967295) * 2 * Math.PI;
        };

        const fromAngle = getClosestVNodeAngle(fromVNodes, keyHash);
        const toAngle = getClosestVNodeAngle(toVNodes, keyHash);

        newParticles.push({
          keyId: move.key,
          fromAngle,
          toAngle,
          progress: 0,
          color: "#E8A33D", // Amber migration accent
        });
      }
    });

    particlesRef.current = newParticles;
  }, [lastMovedKeys]);

  useCanvasLoop(canvasRef, (ctx, deltaTime, reducedMotion) => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const ringRadius = Math.min(width, height) * 0.3;
    const serverRadius = ringRadius * 1.35;

    const currentNodes = nodesRef.current;
    const currentRing = ringRef.current;
    const currentKeys = keysRef.current;

    // Calculate fixed angles for physical servers outside the ring
    const nodePositions = new Map<string, { x: number; y: number; angle: number }>();
    currentNodes.forEach((node, idx) => {
      const angle = (idx / currentNodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * serverRadius;
      const y = centerY + Math.sin(angle) * serverRadius;
      nodePositions.set(node.id, { x, y, angle });
    });

    // Redraw offscreen static layer if parameters changed
    if (offscreenNeedsRedrawRef.current) {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenCanvasRef.current;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      offscreen.width = width * dpr;
      offscreen.height = height * dpr;

      const oCtx = offscreen.getContext("2d");
      if (oCtx) {
        oCtx.resetTransform();
        oCtx.scale(dpr, dpr);

        // Render static background
        oCtx.fillStyle = "#0E0F11";
        oCtx.fillRect(0, 0, width, height);

        // Draw Ring Circle
        oCtx.beginPath();
        oCtx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
        oCtx.strokeStyle = "#8B8D93";
        oCtx.lineWidth = 1.5;
        oCtx.globalAlpha = 0.15;
        oCtx.stroke();
        oCtx.globalAlpha = 1.0;

        // Draw lines from physical servers to their virtual nodes on the ring
        // Batch physical node primary links
        oCtx.beginPath();
        currentRing.forEach((vnode) => {
          if (!vnode.isVirtual) {
            const pos = nodePositions.get(vnode.nodeId);
            if (pos) {
              const vnodeAngle = (vnode.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
              const vx = centerX + Math.cos(vnodeAngle) * ringRadius;
              const vy = centerY + Math.sin(vnodeAngle) * ringRadius;
              oCtx.moveTo(pos.x, pos.y);
              oCtx.lineTo(vx, vy);
            }
          }
        });
        oCtx.strokeStyle = "#E8A33D";
        oCtx.lineWidth = 0.5;
        oCtx.globalAlpha = 0.12;
        oCtx.stroke();

        // Batch virtual node secondary links
        oCtx.beginPath();
        currentRing.forEach((vnode) => {
          if (vnode.isVirtual) {
            const pos = nodePositions.get(vnode.nodeId);
            if (pos) {
              const vnodeAngle = (vnode.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
              const vx = centerX + Math.cos(vnodeAngle) * ringRadius;
              const vy = centerY + Math.sin(vnodeAngle) * ringRadius;
              oCtx.moveTo(pos.x, pos.y);
              oCtx.lineTo(vx, vy);
            }
          }
        });
        oCtx.strokeStyle = "#E8A33D";
        oCtx.lineWidth = 0.5;
        oCtx.globalAlpha = 0.03;
        oCtx.stroke();
        oCtx.globalAlpha = 1.0;

        // Draw virtual node dots
        oCtx.beginPath();
        currentRing.forEach((vnode) => {
          if (vnode.isVirtual) {
            const angle = (vnode.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            oCtx.moveTo(x + 2, y);
            oCtx.arc(x, y, 2, 0, 2 * Math.PI);
          }
        });
        oCtx.fillStyle = "#E8A33D";
        oCtx.globalAlpha = 0.35;
        oCtx.fill();

        // Draw physical node dots on the ring
        oCtx.beginPath();
        currentRing.forEach((vnode) => {
          if (!vnode.isVirtual) {
            const angle = (vnode.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            oCtx.moveTo(x + 3.5, y);
            oCtx.arc(x, y, 3.5, 0, 2 * Math.PI);
          }
        });
        oCtx.fillStyle = "#E8A33D";
        oCtx.globalAlpha = 0.9;
        oCtx.fill();

        // Borders for physical node dots
        oCtx.globalAlpha = 1.0;
        currentRing.forEach((vnode) => {
          if (!vnode.isVirtual) {
            const angle = (vnode.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            oCtx.beginPath();
            oCtx.arc(x, y, 3.5, 0, 2 * Math.PI);
            oCtx.strokeStyle = "#0E0F11";
            oCtx.lineWidth = 1.2;
            oCtx.stroke();
          }
        });
      }
      offscreenNeedsRedrawRef.current = false;
    }

    // 1. Draw static pre-rendered background layer
    ctx.drawImage(offscreenCanvasRef.current!, 0, 0, width, height);

    // 2. Draw active static keys
    ctx.beginPath();
    const animatingKeyIds = new Set(particlesRef.current.map((p) => p.keyId));
    currentKeys.forEach((k) => {
      if (!animatingKeyIds.has(k.id)) {
        const angle = (k.hash / 4294967295) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (ringRadius + 6);
        const y = centerY + Math.sin(angle) * (ringRadius + 6);
        ctx.moveTo(x + 1.5, y);
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      }
    });
    ctx.fillStyle = "#E8E6E1";
    ctx.globalAlpha = 0.65;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 5. Update and draw migration particles (unless prefers-reduced-motion is true)
    if (!reducedMotion) {
      const particles = particlesRef.current;
      particlesRef.current = particles
        .map((p) => {
          // Advance progress (complete transition in ~0.25 seconds: speed = 4)
          const nextProgress = p.progress + deltaTime * 4.0;
          return { ...p, progress: nextProgress };
        })
        .filter((p) => p.progress < 1.0);

      particlesRef.current.forEach((p) => {
        // Interpolate angle
        const currentAngle = p.fromAngle + (p.toAngle - p.fromAngle) * p.progress - Math.PI / 2;
        const x = centerX + Math.cos(currentAngle) * (ringRadius + 6);
        const y = centerY + Math.sin(currentAngle) * (ringRadius + 6);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // Draw brief trail
        ctx.beginPath();
        const prevAngle = p.fromAngle + (p.toAngle - p.fromAngle) * Math.max(0, p.progress - 0.08) - Math.PI / 2;
        const px = centerX + Math.cos(prevAngle) * (ringRadius + 6);
        const py = centerY + Math.sin(prevAngle) * (ringRadius + 6);
        ctx.moveTo(x, y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;
    } else {
      // Clear particles instantly if reduced motion is toggle-swapped mid-animation
      particlesRef.current = [];
    }

    // 6. Draw physical server nodes outside the ring
    nodePositions.forEach((pos, nodeId) => {
      // Server circle background
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, 2 * Math.PI);
      ctx.fillStyle = "#17181B";
      ctx.strokeStyle = "#8B8D93";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Inner server core (Amber)
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "#E8A33D";
      ctx.fill();

      // Text label
      ctx.fillStyle = "#E8E6E1";
      ctx.font = "bold 11px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nodeId, pos.x, pos.y + 36);

      // Display key count for this node
      const nodeCounts = useHashRingStore.getState().metrics.counts;
      const count = nodeCounts[nodeId] || 0;
      ctx.fillStyle = "#E8E6E1";
      ctx.globalAlpha = 0.5;
      ctx.font = "9px var(--font-geist-mono), monospace";
      ctx.fillText(`${count} keys`, pos.x, pos.y + 48);
      ctx.globalAlpha = 1.0;
    });
  });

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[360px] md:min-h-[440px] flex-grow select-none bg-[#0E0F11] rounded-lg border border-[#8B8D93]/10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {lastMigrationPercent > 0 && lastMovedKeys.length > 0 && (
        <div className="absolute top-4 left-4 font-mono text-[10px] text-[#E8A33D] bg-[#17181B]/90 border border-[#E8A33D]/20 px-2 py-1 rounded shadow-md">
          REBALANCE: {lastMovedKeys.length} keys migrated ({lastMigrationPercent.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}
