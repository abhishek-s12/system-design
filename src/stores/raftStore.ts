import { create } from "zustand";
import { RaftCluster, RaftNode, RaftMessage, RaftRole } from "@/lib/algorithms/raft-node";
import { getUrlParam, setUrlParam } from "@/lib/utils/url";

export interface RaftStoreNode {
  id: string;
  role: RaftRole;
  currentTerm: number;
  votedFor: string | null;
  isAlive: boolean;
}

interface RaftStore {
  nodes: RaftStoreNode[];
  partitions: string[][];
  activeMessages: RaftMessage[];

  tick: () => void;
  killLeader: () => void;
  toggleNodeAlive: (id: string) => void;
  setPartitions: (groups: string[][]) => void;
  healPartitions: () => void;
  reset: () => void;
}

const nodeIds = ["Node-1", "Node-2", "Node-3", "Node-4", "Node-5"];
const cluster = new RaftCluster(nodeIds);

function getStoreNodes(): RaftStoreNode[] {
  return Array.from(cluster.nodes.values()).map((n) => ({
    id: n.id,
    role: n.role,
    currentTerm: n.currentTerm,
    votedFor: n.votedFor,
    isAlive: n.isAlive,
  }));
}

export const useRaftStore = create<RaftStore>((set) => {
  let initialPartitions = [nodeIds];

  if (typeof window !== "undefined") {
    const urlScenario = getUrlParam("scenario");
    if (urlScenario === "split-brain") {
      initialPartitions = [
        ["Node-1", "Node-2", "Node-3"],
        ["Node-4", "Node-5"],
      ];
      cluster.setPartitions(initialPartitions);
    }
  }

  return {
    nodes: getStoreNodes(),
    partitions: initialPartitions,
    activeMessages: [],

    tick: () => {
      cluster.tick();
      const newMessages = [...cluster.messages];
      set({
        nodes: getStoreNodes(),
        activeMessages: newMessages,
      });
    },

    killLeader: () => {
      const leader = Array.from(cluster.nodes.values()).find(
        (n) => n.role === "leader" && n.isAlive
      );
      if (leader) {
        leader.isAlive = false;
        leader.role = "follower";
      }
      set({ nodes: getStoreNodes() });
    },

    toggleNodeAlive: (id) => {
      const node = cluster.nodes.get(id);
      if (node) {
        node.isAlive = !node.isAlive;
        if (!node.isAlive) {
          node.role = "follower";
        }
      }
      set({ nodes: getStoreNodes() });
    },

    setPartitions: (groups) => {
      cluster.setPartitions(groups);
      
      const isSplitBrain =
        groups.length === 2 &&
        groups[0].join(",") === "Node-1,Node-2,Node-3" &&
        groups[1].join(",") === "Node-4,Node-5";
      
      setUrlParam("scenario", isSplitBrain ? "split-brain" : null);
      set({ partitions: groups, nodes: getStoreNodes() });
    },

    healPartitions: () => {
      cluster.setPartitions([nodeIds]);
      setUrlParam("scenario", null);
      set({ partitions: [nodeIds], nodes: getStoreNodes() });
    },

    reset: () => {
      cluster.nodes.clear();
      nodeIds.forEach((id) => {
        cluster.nodes.set(id, new RaftNode(id, 20, 40));
      });
      cluster.partitions = [nodeIds];
      cluster.messages = [];
      setUrlParam("scenario", null);
      set({
        nodes: getStoreNodes(),
        partitions: [nodeIds],
        activeMessages: [],
      });
    },
  };
});
export { nodeIds };
