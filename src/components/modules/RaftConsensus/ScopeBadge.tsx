"use client";

import { ExternalLink } from "lucide-react";

export function ScopeBadge() {
  return (
    <div className="flex items-center justify-between bg-[#17181B] border border-[#9B7EE8]/20 px-4 py-3 rounded-lg text-xs">
      <div className="flex items-center gap-2.5">
        <span className="bg-[#9B7EE8]/10 text-[#9B7EE8] border border-[#9B7EE8]/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[10px]">
          Raft-lite
        </span>
        <span className="text-[#E8E6E1]/70">
          This module implements **Leader Election** and **Quorum Consensus** only. Log replication, snapshots, and membership changes are omitted.
        </span>
      </div>
      <a
        href="https://raft.github.io/raft.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#9B7EE8] hover:underline font-mono text-[10px] whitespace-nowrap ml-4 font-semibold"
      >
        Read Full Raft Paper <ExternalLink size={12} />
      </a>
    </div>
  );
}
