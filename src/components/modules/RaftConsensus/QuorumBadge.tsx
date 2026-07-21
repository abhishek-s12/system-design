"use client";

import { useRaftStore } from "@/stores/raftStore";

export function QuorumBadge() {
  const { partitions, nodes } = useRaftStore();

  const totalNodesCount = nodes.length; // 5
  const majorityThreshold = Math.floor(totalNodesCount / 2) + 1; // 3

  return (
    <div className="flex flex-col gap-3 bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5">
      <h4 className="text-xs font-semibold font-mono text-[#E8E6E1]/70 uppercase tracking-wider">
        Partition Quorum Status
      </h4>
      
      <div className="flex flex-col gap-2">
        {partitions.map((group, idx) => {
          const aliveGroupNodes = group.filter((id) => {
            const n = nodes.find((node) => node.id === id);
            return n ? n.isAlive : false;
          });
          const hasQuorum = aliveGroupNodes.length >= majorityThreshold;

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded bg-[#0E0F11] border ${
                hasQuorum
                  ? "border-[#3DC9B0]/20 text-[#3DC9B0]"
                  : "border-[#E85D5D]/20 text-[#E85D5D]"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs font-bold text-[#E8E6E1]">
                  Partition Group {idx + 1}
                </span>
                <span className="text-[10px] text-[#E8E6E1]/50 font-mono">
                  Nodes: {group.join(", ")}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold">
                  {hasQuorum ? "QUORUM CONVERGED" : "NO QUORUM"}
                </span>
                <span className="text-[9px] font-mono text-[#E8E6E1]/40">
                  {aliveGroupNodes.length} / {totalNodesCount} nodes alive
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
