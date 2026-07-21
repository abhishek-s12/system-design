"use client";

import { useRef, useEffect, useState } from "react";
import { useRaftStore, RaftStoreNode } from "@/stores/raftStore";
import { useCanvasResize } from "@/lib/hooks/useCanvasResize";
import { useCanvasLoop } from "@/lib/hooks/useCanvasLoop";


interface AnimatedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  term: number;
  progress: number; // 0 to 1
}

export function ClusterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { nodes, partitions, activeMessages, tick, toggleNodeAlive } = useRaftStore();
  const dimensions = useCanvasResize(canvasRef, containerRef);

  const nodesRef = useRef(nodes);
  const partitionsRef = useRef(partitions);
  const animMessagesRef = useRef<AnimatedMessage[]>([]);
  const lastTickTimeRef = useRef<number>(0);

  // Keyboard navigation helpers
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    partitionsRef.current = partitions;
  }, [partitions]);

  // Capture new messages to animate
  useEffect(() => {
    if (activeMessages.length === 0) return;

    activeMessages.forEach((msg) => {
      // Avoid duplicate animation triggers
      if (!animMessagesRef.current.some((m) => m.id === msg.id)) {
        animMessagesRef.current.push({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          type: msg.type,
          term: msg.term,
          progress: 0,
        });
      }
    });
  }, [activeMessages]);

  useCanvasLoop(canvasRef, (ctx, deltaTime, reducedMotion) => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const layoutRadius = Math.min(width, height) * 0.32;

    // 1. Tick the cluster logically (every 300ms)
    const tickRate = 350; // ms
    const now = performance.now();
    if (now - lastTickTimeRef.current > tickRate) {
      tick();
      lastTickTimeRef.current = now;
    }

    // Clear background (#0E0F11)
    ctx.fillStyle = "#0E0F11";
    ctx.fillRect(0, 0, width, height);

    const currentNodes = nodesRef.current;

    // Compute coordinate positions of the 5 nodes in a ring layout
    const nodeCoords = new Map<string, { x: number; y: number; angle: number; node: RaftStoreNode }>();
    currentNodes.forEach((node, idx) => {
      const angle = (idx / currentNodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * layoutRadius;
      const y = centerY + Math.sin(angle) * layoutRadius;
      nodeCoords.set(node.id, { x, y, angle, node });
    });

    // Helper to check if two nodes are partitioned
    const areConnected = (id1: string, id2: string) => {
      return partitionsRef.current.some((group) => group.includes(id1) && group.includes(id2));
    };

    // 2. Draw connection links between nodes
    ctx.lineWidth = 1;
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const id1 = currentNodes[i].id;
        const id2 = currentNodes[j].id;
        const c1 = nodeCoords.get(id1);
        const c2 = nodeCoords.get(id2);

        if (c1 && c2) {
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c2.x, c2.y);

          const connected = areConnected(id1, id2);
          if (connected) {
            ctx.strokeStyle = "#8B8D93";
            ctx.globalAlpha = 0.12; // faint gray link
            ctx.stroke();
          } else {
            // Partitioned: draw dotted red line
            ctx.strokeStyle = "#E85D5D"; // Coral
            ctx.globalAlpha = 0.25;
            ctx.setLineDash([2, 4]);
            ctx.stroke();
            ctx.setLineDash([]); // reset
          }
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // 3. Draw partition boundary visualizer if partitioned
    if (partitionsRef.current.length > 1) {
      ctx.strokeStyle = "#E85D5D";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      // Draw horizontal or diagonal separating line
      ctx.moveTo(centerX - layoutRadius * 1.3, centerY);
      ctx.lineTo(centerX + layoutRadius * 1.3, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // Draw partition text
      ctx.fillStyle = "#E85D5D";
      ctx.font = "9px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillText("PARTITION BOUNDARY", centerX, centerY - 8);
    }

    // 4. Update and draw animating messages
    if (!reducedMotion) {
      animMessagesRef.current.forEach((m) => {
        // travel speed
        m.progress += deltaTime * 2.5; 
      });

      // Filter out completed animations
      animMessagesRef.current = animMessagesRef.current.filter((m) => m.progress < 1.0);

      animMessagesRef.current.forEach((m) => {
        const start = nodeCoords.get(m.senderId);
        const end = nodeCoords.get(m.receiverId);

        if (start && end && areConnected(m.senderId, m.receiverId)) {
          // Linear interpolation of position
          const px = start.x + (end.x - start.x) * m.progress;
          const py = start.y + (end.y - start.y) * m.progress;

          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
          
          if (m.type.startsWith("RequestVote")) {
            ctx.fillStyle = "#E8A33D"; // Amber Candidate requests
          } else {
            ctx.fillStyle = "#9B7EE8"; // Violet Heartbeats
          }
          ctx.fill();
        }
      });
    } else {
      animMessagesRef.current = []; // instantly consume
    }

    // 5. Draw Raft Nodes
    nodeCoords.forEach((coord, id) => {
      const node = coord.node;
      const isFocused = focusedNodeId === id;

      // Highlight focus outline
      if (isFocused) {
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 28, 0, 2 * Math.PI);
        ctx.strokeStyle = "#9B7EE8";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Outer status ring representing terms & timeouts
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 22, 0, 2 * Math.PI);
      
      // Node core backgrounds
      ctx.fillStyle = "#17181B";
      ctx.lineWidth = 2;

      // Outer color outline based on role
      if (!node.isAlive) {
        ctx.strokeStyle = "#8B8D93";
        ctx.globalAlpha = 0.2;
      } else if (node.role === "leader") {
        ctx.strokeStyle = "#9B7EE8"; // Violet leader
        ctx.globalAlpha = 0.95;
      } else if (node.role === "candidate") {
        ctx.strokeStyle = "#E8A33D"; // Amber candidate
        ctx.globalAlpha = 0.95;
      } else {
        ctx.strokeStyle = "#8B8D93"; // Gray follower
        ctx.globalAlpha = 0.65;
      }
      
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Render Dead node cross visual
      if (!node.isAlive) {
        ctx.strokeStyle = "#E85D5D";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(coord.x - 6, coord.y - 6);
        ctx.lineTo(coord.x + 6, coord.y + 6);
        ctx.moveTo(coord.x + 6, coord.y - 6);
        ctx.lineTo(coord.x - 6, coord.y + 6);
        ctx.stroke();
      } else if (node.role === "leader") {
        // Render simple Leader star/crown dot
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#9B7EE8";
        ctx.fill();
      }

      // Draw Node ID label
      ctx.fillStyle = node.isAlive ? "#E8E6E1" : "#E8E6E1";
      ctx.globalAlpha = node.isAlive ? 1.0 : 0.35;
      ctx.font = "bold 10px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, coord.x, coord.y + 34);

      // Draw Term info
      ctx.font = "9px var(--font-geist-mono), monospace";
      ctx.fillStyle = "#E8E6E1";
      ctx.globalAlpha = node.isAlive ? 0.45 : 0.25;
      ctx.fillText(`Term ${node.currentTerm}`, coord.x, coord.y + 45);

      // Role badge label
      ctx.font = "7px var(--font-geist-mono), monospace";
      ctx.fillStyle = node.role === "leader" ? "#9B7EE8" : node.role === "candidate" ? "#E8A33D" : "#8B8D93";
      ctx.fillText(node.isAlive ? node.role.toUpperCase() : "DEAD", coord.x, coord.y + 55);
      ctx.globalAlpha = 1.0;
    });
  });

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[360px] md:min-h-[440px] flex-grow select-none bg-[#0E0F11] rounded-lg border border-[#8B8D93]/10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Accessible Keyboard Overlay Overlay Buttons (invisible, for screen readers/tabs) */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        {nodes.map((node, idx) => {
          // Match circular angles to calculate absolute % offsets for overlays
          const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const radiusPercent = 32; // layout radius is ~32%
          const xPercent = 50 + Math.cos(angle) * radiusPercent;
          const yPercent = 50 + Math.sin(angle) * radiusPercent;

          return (
            <button
              key={node.id}
              onClick={() => toggleNodeAlive(node.id)}
              onFocus={() => setFocusedNodeId(node.id)}
              onBlur={() => setFocusedNodeId(null)}
              className="absolute w-12 h-12 rounded-full cursor-pointer pointer-events-auto opacity-0 focus:opacity-10 focus:bg-[#9B7EE8]/30 transition-all border border-[#9B7EE8] flex items-center justify-center text-[8px] text-white"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: "translate(-50%, -50%)",
              }}
              aria-label={`Node ${node.id}, role ${node.role}, term ${node.currentTerm}, ${
                node.isAlive ? "alive" : "dead"
              }. Press Enter to toggle status.`}
            >
              Node
            </button>
          );
        })}
      </div>
    </div>
  );
}
