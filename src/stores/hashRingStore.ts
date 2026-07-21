import { create } from "zustand";
import { ConsistentHashRing, VNode, fnv1a } from "@/lib/algorithms/consistent-hash";
import { getUrlParam, setUrlParam } from "@/lib/utils/url";

export interface NodeInfo {
  id: string;
  vnodeCount: number;
}

export interface KeyInfo {
  id: string;
  nodeId: string;
  hash: number;
}

interface HashRingStore {
  ring: VNode[];
  nodes: NodeInfo[];
  keys: KeyInfo[];
  vnodeCountGlobal: number;
  metrics: {
    stdDev: number;
    average: number;
    counts: Record<string, number>;
  };
  lastMovedKeys: { key: string; from: string; to: string }[];
  lastMigrationPercent: number;

  addNode: (nodeId: string) => void;
  removeNode: (nodeId: string) => void;
  setVnodeCountGlobal: (count: number) => void;
  addKey: (key: string) => void;
  removeKey: (key: string) => void;
  clearKeys: () => void;
  reset: () => void;
}

const engine = new ConsistentHashRing();

const INITIAL_NODES = ["Node-A", "Node-B", "Node-C", "Node-D"];
const INITIAL_VNODE_COUNT = 40;

function syncStore(
  set: (
    partial:
      | Partial<HashRingStore>
      | ((state: HashRingStore) => Partial<HashRingStore>)
  ) => void
) {
  const metrics = engine.getMetrics();
  const ring = [...engine.ring];
  const nodes = Array.from(engine.nodes.entries()).map(([id, vnodeCount]) => ({
    id,
    vnodeCount,
  }));
  const keys = Array.from(engine.keys.entries()).map(([key, nodeId]) => {
    const lookup = engine.lookupKey(key);
    return {
      id: key,
      nodeId,
      hash: lookup ? lookup.hash : 0,
    };
  });

  set({
    ring,
    nodes,
    keys,
    metrics,
  });
}

// Perform initial setup on module load
for (const n of INITIAL_NODES) {
  engine.addNode(n, INITIAL_VNODE_COUNT);
}
for (let i = 0; i < 60; i++) {
  engine.addKey(`Key-${i}`);
}

export const useHashRingStore = create<HashRingStore>((set, get) => {
  // Client-side initialization to parse and apply URL parameter
  if (typeof window !== "undefined") {
    const urlVNodes = getUrlParam("vnodes");
    if (urlVNodes) {
      const parsed = parseInt(urlVNodes);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 200) {
        // Re-add nodes with correct VNode count
        engine.ring = [];
        for (const n of INITIAL_NODES) {
          engine.addNode(n, parsed);
        }
      }
    }
  }

  const currentVNodeCount = typeof window !== "undefined" && getUrlParam("vnodes")
    ? Math.max(1, Math.min(200, parseInt(getUrlParam("vnodes") || "") || INITIAL_VNODE_COUNT))
    : INITIAL_VNODE_COUNT;

  return {
    ring: [...engine.ring],
    nodes: Array.from(engine.nodes.entries()).map(([id, vnodeCount]) => ({ id, vnodeCount })),
    keys: Array.from(engine.keys.entries()).map(([key, nodeId]) => ({
      id: key,
      nodeId,
      hash: engine.lookupKey(key)?.hash || 0,
    })),
    vnodeCountGlobal: currentVNodeCount,
    metrics: engine.getMetrics(),
    lastMovedKeys: [],
    lastMigrationPercent: 0,

    addNode: (nodeId) => {
      const vnodeCount = get().vnodeCountGlobal;
      const totalKeys = engine.keys.size;
      const { movedKeys } = engine.addNode(nodeId, vnodeCount);
      const migratedCount = movedKeys.size;
      const lastMigrationPercent = totalKeys > 0 ? (migratedCount / totalKeys) * 100 : 0;

      set({
        lastMovedKeys: Array.from(movedKeys.entries()).map(([key, value]) => ({
          key,
          from: value.from,
          to: value.to,
        })),
        lastMigrationPercent,
      });
      syncStore(set);
    },

    removeNode: (nodeId) => {
      const totalKeys = engine.keys.size;
      const { movedKeys } = engine.removeNode(nodeId);
      const migratedCount = movedKeys.size;
      const lastMigrationPercent = totalKeys > 0 ? (migratedCount / totalKeys) * 100 : 0;

      set({
        lastMovedKeys: Array.from(movedKeys.entries()).map(([key, value]) => ({
          key,
          from: value.from,
          to: value.to,
        })),
        lastMigrationPercent,
      });
      syncStore(set);
    },

    setVnodeCountGlobal: (count) => {
      setUrlParam("vnodes", count);
      set({ vnodeCountGlobal: count });
      const currentNodes = Array.from(engine.nodes.keys());
      const totalKeys = engine.keys.size;

      // Re-create nodes on ring
      engine.ring = [];
      for (const nodeId of currentNodes) {
        engine.nodes.set(nodeId, count);
        for (let i = 0; i < count; i++) {
          const vnodeId = `${nodeId}#${i}`;
          const hash = fnv1a(vnodeId);
          engine.ring.push({ hash, nodeId, isVirtual: i > 0 });
        }
      }
      engine.ring.sort((a, b) => a.hash - b.hash);
      const { movedKeys } = engine.rebalance();
      
      const migratedCount = movedKeys.size;
      const lastMigrationPercent = totalKeys > 0 ? (migratedCount / totalKeys) * 100 : 0;

      set({
        lastMovedKeys: Array.from(movedKeys.entries()).map(([key, value]) => ({
          key,
          from: value.from,
          to: value.to,
        })),
        lastMigrationPercent,
      });
      syncStore(set);
    },

    addKey: (key) => {
      engine.addKey(key);
      set({ lastMovedKeys: [], lastMigrationPercent: 0 });
      syncStore(set);
    },

    removeKey: (key) => {
      engine.removeKey(key);
      set({ lastMovedKeys: [], lastMigrationPercent: 0 });
      syncStore(set);
    },

    clearKeys: () => {
      engine.keys.clear();
      set({ lastMovedKeys: [], lastMigrationPercent: 0 });
      syncStore(set);
    },

    reset: () => {
      engine.ring = [];
      engine.nodes.clear();
      engine.keys.clear();
      set({ vnodeCountGlobal: INITIAL_VNODE_COUNT });
      for (const n of INITIAL_NODES) {
        engine.addNode(n, INITIAL_VNODE_COUNT);
      }
      for (let i = 0; i < 60; i++) {
        engine.addKey(`Key-${i}`);
      }
      set({ lastMovedKeys: [], lastMigrationPercent: 0 });
      syncStore(set);
    },
  };
});
