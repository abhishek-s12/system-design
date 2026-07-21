import { describe, it, expect } from "vitest";
import { RaftCluster } from "./raft-node";

describe("Raft-lite Consensus Machine", () => {
  it("converges to exactly one leader across 50 randomized seeds when leader is killed", () => {
    for (let trial = 0; trial < 50; trial++) {
      const nodeIds = ["Node-1", "Node-2", "Node-3", "Node-4", "Node-5"];
      const cluster = new RaftCluster(nodeIds);

      // 1. Let the cluster tick to elect the initial leader
      let leaderId = "";
      for (let tick = 0; tick < 200; tick++) {
        cluster.tick();
        const leaders = Array.from(cluster.nodes.values()).filter(
          (n) => n.role === "leader" && n.isAlive
        );
        if (leaders.length === 1) {
          leaderId = leaders[0].id;
          break;
        }
      }

      expect(leaderId).not.toBe(""); // Ensure initial election succeeded

      // 2. Kill the current leader
      const oldLeader = cluster.nodes.get(leaderId)!;
      oldLeader.isAlive = false;
      oldLeader.role = "follower";

      // 3. Partition remaining 4 alive nodes into a Majority (3 nodes) and Minority (1 node + dead leader)
      const aliveNodes = nodeIds.filter((id) => id !== leaderId);
      const majorityGroup = [aliveNodes[0], aliveNodes[1], aliveNodes[2]];
      const minorityGroup = [aliveNodes[3], leaderId];
      cluster.setPartitions([majorityGroup, minorityGroup]);

      // 4. Tick cluster and check majority elects a new leader while minority fails to elect
      let newLeaderId = "";
      for (let tick = 0; tick < 200; tick++) {
        cluster.tick();
        
        const majorityLeaders = majorityGroup
          .map((id) => cluster.nodes.get(id)!)
          .filter((n) => n.role === "leader" && n.isAlive);

        const minorityLeaders = minorityGroup
          .map((id) => cluster.nodes.get(id)!)
          .filter((n) => n.role === "leader" && n.isAlive);

        // Minority partition must NEVER elect a leader
        expect(minorityLeaders.length).toBe(0);

        if (majorityLeaders.length === 1) {
          newLeaderId = majorityLeaders[0].id;
        }
      }

      // Verify that the majority partition successfully elected a new leader
      expect(newLeaderId).not.toBe("");
      expect(majorityGroup.includes(newLeaderId)).toBe(true);

      // 5. Heal the partition and revive the old leader
      oldLeader.isAlive = true;
      cluster.setPartitions([nodeIds]);

      // 6. Tick cluster and verify it converges back to exactly one leader
      let convergedLeaderId = "";
      for (let tick = 0; tick < 200; tick++) {
        cluster.tick();
        const activeLeaders = Array.from(cluster.nodes.values()).filter(
          (n) => n.role === "leader" && n.isAlive
        );
        if (activeLeaders.length === 1) {
          convergedLeaderId = activeLeaders[0].id;
        }
      }

      expect(convergedLeaderId).not.toBe("");
    }
  });
});
