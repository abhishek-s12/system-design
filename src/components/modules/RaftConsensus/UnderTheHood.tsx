"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export function UnderTheHood() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRPC, setSelectedRPC] = useState<"vote" | "append">("vote");

  const codeBlocks = {
    vote: `// Raft RequestVote RPC Handler
function handleRequestVote(msg: RequestVoteRPC, node: RaftNode) {
  // Step 1: Rule check on term
  if (msg.term > node.currentTerm) {
    node.currentTerm = msg.term;
    node.role = "follower";
    node.votedFor = null;
  }
  
  // Step 2: Evaluate vote eligibility
  const grantVote = 
    msg.term === node.currentTerm &&
    (node.votedFor === null || node.votedFor === msg.candidateId);
    
  if (grantVote) {
    node.votedFor = msg.candidateId;
    node.resetElectionTimeout(); // restart timer
  }
  
  return { term: node.currentTerm, voteGranted: grantVote };
}`,
    append: `// Raft AppendEntries RPC Handler (Heartbeats)
function handleAppendEntries(msg: AppendEntriesRPC, node: RaftNode) {
  // Step 1: Term validation
  if (msg.term > node.currentTerm) {
    node.currentTerm = msg.term;
    node.role = "follower";
    node.votedFor = null;
  }
  
  // Step 2: Verify candidate term isn't stale
  if (msg.term < node.currentTerm) {
    return { term: node.currentTerm, success: false };
  }
  
  // Step 3: Accept heartbeat and reset election timer
  if (node.role === "candidate") {
    node.role = "follower";
  }
  node.resetElectionTimeout();
  
  return { term: node.currentTerm, success: true };
}`,
  };

  return (
    <div className="flex flex-col bg-[#17181B] border border-[#8B8D93]/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-4 font-mono text-xs font-semibold text-[#E8E6E1]/80 hover:text-[#E8E6E1] transition-colors cursor-pointer select-none"
      >
        <span>UNDER THE HOOD: RPC PROTOCOL</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="border-t border-[#8B8D93]/10 p-5 flex flex-col gap-5">
          {/* Tabs for selecting RPC */}
          <div className="flex bg-[#0E0F11] border border-[#8B8D93]/10 rounded p-1 max-w-sm">
            {(["vote", "append"] as const).map((rpc) => (
              <button
                key={rpc}
                onClick={() => setSelectedRPC(rpc)}
                className={`flex-1 py-1 font-mono text-[10px] rounded transition-all select-none cursor-pointer ${
                  selectedRPC === rpc
                    ? "bg-[#17181B] text-[#E8E6E1]"
                    : "text-[#E8E6E1]/50 hover:text-[#E8E6E1]"
                }`}
              >
                {rpc === "vote" ? "RequestVote RPC" : "AppendEntries RPC"}
              </button>
            ))}
          </div>

          {/* Code block display */}
          <div className="bg-[#0E0F11] border border-[#8B8D93]/10 rounded p-4 font-mono text-[11px] leading-5 text-[#E8E6E1]/90">
            <pre className="whitespace-pre overflow-x-auto">{codeBlocks[selectedRPC]}</pre>
          </div>

          {/* Production callout */}
          <div className="bg-[#0E0F11]/40 border border-[#8B8D93]/10 rounded p-4 text-xs text-[#E8E6E1]/80">
            <h4 className="font-semibold font-mono text-[#9B7EE8] uppercase tracking-wider mb-2 text-[10px]">
              What would break in production
            </h4>
            <p className="leading-relaxed">
              This playground visualizes **Raft-lite**, which simulates leader election timeouts and partition quorums but entirely omits log replication, client write commitments, cluster membership changes, and log compaction. In a production Raft implementation (such as etcd or Consul), nodes must append log entries to persistent storage, verify log matching indexes on AppendEntries RPC calls, commit changes only after replication to a majority, and handle snapshots to prevent disk exhaustion. Stale leader reads must also be mitigated via read index leases.
            </p>
            <div className="mt-3 flex items-center">
              <a
                href="https://raft.github.io/raft.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#9B7EE8] hover:underline font-medium font-mono text-[10px]"
              >
                Read the Original Raft Paper <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
