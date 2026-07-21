"use client";

import { useState } from "react";
import { useRaftStore } from "@/stores/raftStore";
import { Button } from "@/components/ui/Button";
import { Layers, ShieldCheck, Skull, RefreshCw } from "lucide-react";

export function Controls() {
  const {
    nodes,
    killLeader,
    toggleNodeAlive,
    setPartitions,
    healPartitions,
    reset,
  } = useRaftStore();

  const [groupA, setGroupA] = useState<string[]>(["Node-1", "Node-2", "Node-3"]);

  const handleCustomPartition = () => {
    const allIds = nodes.map((n) => n.id);
    const groupB = allIds.filter((id) => !groupA.includes(id));

    if (groupA.length === 0 || groupB.length === 0) {
      return;
    }
    setPartitions([groupA, groupB]);
  };

  const handleGroupAToggle = (nodeId: string) => {
    if (groupA.includes(nodeId)) {
      setGroupA(groupA.filter((id) => id !== nodeId));
    } else {
      setGroupA([...groupA, nodeId]);
    }
  };

  const activeLeader = nodes.find((n) => n.role === "leader" && n.isAlive);

  return (
    <div className="flex flex-col gap-5 bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5">
      <h3 className="text-sm font-semibold font-mono text-[#9B7EE8] uppercase tracking-wider">
        Cluster Controls
      </h3>

      {/* Leader failure actions */}
      <div className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Failure Injection</span>
        <div className="flex gap-2">
          <Button
            variant="danger"
            disabled={!activeLeader}
            onClick={killLeader}
            className="flex-grow font-mono text-xs py-2 cursor-pointer"
          >
            <Skull size={13} className="inline mr-1" /> Fail Leader
          </Button>
        </div>
        <p className="text-[10px] text-[#E8E6E1]/50">
          Kill the active leader to witness election timeouts triggering candidate elections.
        </p>
      </div>

      {/* Network Partitions preset buttons */}
      <div className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Network Partitions</span>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              setPartitions([
                ["Node-1", "Node-2", "Node-3"],
                ["Node-4", "Node-5"],
              ])
            }
            className="font-mono text-xs py-1.5 justify-start cursor-pointer"
          >
            <Layers size={13} className="inline mr-1.5 text-[#E85D5D]" /> Split 3-2
            (Node-1,2,3 / Node-4,5)
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setPartitions([
                ["Node-1"],
                ["Node-2", "Node-3", "Node-4", "Node-5"],
              ])
            }
            className="font-mono text-xs py-1.5 justify-start cursor-pointer"
          >
            <Layers size={13} className="inline mr-1.5 text-[#E85D5D]" /> Isolate
            Node-1 (Node-1 / Rest)
          </Button>
          <Button
            variant="secondary"
            onClick={healPartitions}
            className="font-mono text-xs py-1.5 justify-start cursor-pointer"
          >
            <ShieldCheck size={13} className="inline mr-1.5 text-[#3DC9B0]" /> Heal
            Network Partitions
          </Button>
        </div>
      </div>

      {/* Keyboard Accessible Custom Partition Builder */}
      <div className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Custom Partition Builder</span>
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-[#E8E6E1]/50 font-mono">
            Select Nodes for Group A (Remaining go to Group B):
          </span>
          <div className="flex flex-wrap gap-3">
            {nodes.map((node) => (
              <label
                key={node.id}
                className="flex items-center gap-1.5 font-mono text-[10px] text-[#E8E6E1]/80 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={groupA.includes(node.id)}
                  onChange={() => handleGroupAToggle(node.id)}
                  className="accent-[#9B7EE8]"
                />
                <span>{node.id}</span>
              </label>
            ))}
          </div>
          <Button
            onClick={handleCustomPartition}
            disabled={groupA.length === 0 || groupA.length === nodes.length}
            className="w-full font-mono text-xs py-1.5 mt-1 cursor-pointer"
          >
            Apply Custom Partition
          </Button>
        </div>
      </div>

      {/* Node Status toggles */}
      <div className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <span className="text-xs text-[#E8E6E1]/70 font-medium">Individual Node Status</span>
        <div className="flex flex-wrap gap-1.5">
          {nodes.map((node) => (
            <button
              key={node.id}
              onClick={() => toggleNodeAlive(node.id)}
              className={`flex-grow font-mono text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer select-none ${
                node.isAlive
                  ? "bg-[#0E0F11] border-[#8B8D93]/20 text-[#E8E6E1] hover:border-[#8B8D93]/40"
                  : "bg-[#E85D5D]/10 border-[#E85D5D]/30 text-[#E85D5D] hover:bg-[#E85D5D]/20"
              }`}
            >
              {node.id}: {node.isAlive ? "ALIVE" : "DEAD"}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <Button
        type="button"
        variant="ghost"
        onClick={reset}
        className="w-full text-xs font-mono py-1.5 cursor-pointer"
      >
        <RefreshCw size={12} className="inline mr-1" /> Reset Cluster
      </Button>
    </div>
  );
}
