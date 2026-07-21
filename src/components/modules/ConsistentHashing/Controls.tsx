"use client";

import { useState } from "react";
import { useHashRingStore } from "@/stores/hashRingStore";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Plus, Trash2, RefreshCw } from "lucide-react";

export function Controls() {
  const {
    nodes,
    vnodeCountGlobal,
    setVnodeCountGlobal,
    addNode,
    removeNode,
    addKey,
    clearKeys,
    reset,
  } = useHashRingStore();

  const [newNodeName, setNewNodeName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newNodeName.trim();
    if (!name) return;
    addNode(name);
    setNewNodeName("");
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newKeyName.trim();
    if (!name) return;
    addKey(name);
    setNewKeyName("");
  };

  const handleAddBatchKeys = (count: number) => {
    const startIdx = Math.floor(Math.random() * 10000);
    for (let i = 0; i < count; i++) {
      addKey(`Key-${startIdx + i}`);
    }
  };

  const getNextNodeNameSuggestion = () => {
    const existing = new Set(nodes.map((n) => n.id));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < chars.length; i++) {
      const name = `Node-${chars[i]}`;
      if (!existing.has(name)) return name;
    }
    return `Node-${nodes.length + 1}`;
  };

  return (
    <div className="flex flex-col gap-5 bg-[#17181B] border border-[#8B8D93]/10 rounded-lg p-5">
      <h3 className="text-xs font-semibold font-mono text-[#E8A33D] uppercase tracking-wider">
        Ring Controls
      </h3>

      {/* Global VNode Slider */}
      <div className="border-b border-[#8B8D93]/10 pb-4">
        <Slider
          label="Virtual Nodes per Physical Node"
          min={1}
          max={200}
          value={vnodeCountGlobal}
          onChange={setVnodeCountGlobal}
        />
        <p className="text-[10px] text-[#E8E6E1]/50 mt-1">
          Higher vnode counts balance the ring load more evenly among servers.
        </p>
      </div>

      {/* Physical Node Management */}
      <form onSubmit={handleAddNode} className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <label htmlFor="node-input" className="text-xs text-[#E8E6E1]/70 font-medium">
          Add Physical Node
        </label>
        <div className="flex gap-2">
          <input
            id="node-input"
            type="text"
            placeholder={getNextNodeNameSuggestion()}
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            className="flex-grow bg-[#0E0F11] border border-[#8B8D93]/10 text-[#E8E6E1] rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8A33D]"
          />
          <Button type="submit" className="font-mono text-xs whitespace-nowrap">
            <Plus size={14} className="inline mr-1" /> Add Node
          </Button>
        </div>
        
        {/* List of nodes to remove */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="flex items-center gap-1.5 bg-[#0E0F11] border border-[#8B8D93]/10 px-2.5 py-1 rounded text-xs font-mono"
            >
              <span>{node.id}</span>
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                disabled={nodes.length <= 1}
                className="text-[#E85D5D]/75 hover:text-[#E85D5D] transition-colors disabled:opacity-30 cursor-pointer"
                title={`Remove ${node.id}`}
                aria-label={`Remove ${node.id}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </form>

      {/* Key Management */}
      <form onSubmit={handleAddKey} className="flex flex-col gap-2 border-b border-[#8B8D93]/10 pb-4">
        <label htmlFor="key-input" className="text-xs text-[#E8E6E1]/70 font-medium">
          Add Data Key
        </label>
        <div className="flex gap-2">
          <input
            id="key-input"
            type="text"
            placeholder="e.g. session-token-291"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-grow bg-[#0E0F11] border border-[#8B8D93]/10 text-[#E8E6E1] rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8A33D]"
          />
          <Button type="submit" variant="secondary" className="font-mono text-xs whitespace-nowrap">
            Add Key
          </Button>
        </div>

        {/* Quick Batch Keys Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAddBatchKeys(10)}
            className="flex-grow text-[11px] py-1 font-mono"
          >
            +10 Keys
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAddBatchKeys(50)}
            className="flex-grow text-[11px] py-1 font-mono"
          >
            +50 Keys
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={clearKeys}
            className="flex-grow text-[11px] py-1 font-mono"
          >
            Clear Keys
          </Button>
        </div>
      </form>

      {/* Reset System */}
      <Button
        type="button"
        variant="ghost"
        onClick={reset}
        className="w-full text-xs font-mono py-1.5"
      >
        <RefreshCw size={12} className="inline mr-1" /> Reset Ring & Keys
      </Button>
    </div>
  );
}
