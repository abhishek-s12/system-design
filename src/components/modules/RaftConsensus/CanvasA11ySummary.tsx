"use client";

import { useRaftStore } from "@/stores/raftStore";

export function CanvasA11ySummary() {
  const { nodes, partitions } = useRaftStore();

  const totalNodes = nodes.length;
  const aliveNodes = nodes.filter((n) => n.isAlive).length;
  
  const leader = nodes.find((n) => n.role === "leader" && n.isAlive);
  const partitionCount = partitions.length;

  let summaryText = `Raft cluster with ${totalNodes} nodes, ${aliveNodes} alive. `;
  if (leader) {
    summaryText += `Active leader is ${leader.id} at Term ${leader.currentTerm}. `;
  } else {
    summaryText += `No active leader currently elected. `;
  }

  if (partitionCount > 1) {
    summaryText += `The network is partitioned into ${partitionCount} isolated groups.`;
  } else {
    summaryText += `The network is healthy with no partitions.`;
  }

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="false">
      {summaryText}
    </div>
  );
}
