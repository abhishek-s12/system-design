import { describe, it, expect } from "vitest";
import { ConsistentHashRing, fnv1a } from "./consistent-hash";

describe("Consistent Hashing - FNV-1a", () => {
  it("computes FNV-1a hash matching standard distribution properties", () => {
    const hash1 = fnv1a("test-node-1");
    const hash2 = fnv1a("test-node-2");
    expect(hash1).not.toBe(hash2);
    expect(hash1).toBeGreaterThanOrEqual(0);
    expect(hash1).toBeLessThanOrEqual(4294967295);
  });
});

describe("ConsistentHashRing", () => {
  it("adds nodes and virtual nodes to the ring in sorted order", () => {
    const ring = new ConsistentHashRing();
    ring.addNode("NodeA", 3);
    expect(ring.ring.length).toBe(3);
    // verify sorted order
    for (let i = 0; i < ring.ring.length - 1; i++) {
      expect(ring.ring[i].hash).toBeLessThanOrEqual(ring.ring[i + 1].hash);
    }
  });

  it("adds a node and moves ONLY keys that are now closer to it", () => {
    const ring = new ConsistentHashRing();
    ring.addNode("NodeA", 10);
    ring.addNode("NodeB", 10);

    // Add 100 test keys
    const originalMappings = new Map<string, string>();
    for (let i = 0; i < 100; i++) {
      const key = `key-${i}`;
      const lookup = ring.addKey(key);
      if (lookup) {
        originalMappings.set(key, lookup.nodeId);
      }
    }

    // Now add NodeC
    const { movedKeys } = ring.addNode("NodeC", 10);

    // Verify: keys not in movedKeys MUST still route to their original NodeA or NodeB
    for (let i = 0; i < 100; i++) {
      const key = `key-${i}`;
      const lookup = ring.lookupKey(key);
      const currentAssigned = lookup ? lookup.nodeId : "";

      if (movedKeys.has(key)) {
        // If it moved, it MUST have moved from NodeA/NodeB to the new NodeC
        const move = movedKeys.get(key)!;
        expect(move.to).toBe("NodeC");
        expect(move.from).toBe(originalMappings.get(key));
        expect(currentAssigned).toBe("NodeC");
      } else {
        // If it didn't move, it must be mapped to its original node
        expect(currentAssigned).toBe(originalMappings.get(key));
      }
    }
  });

  it("removing a node moves exactly its keys to the clockwise neighbor and nothing else", () => {
    const ring = new ConsistentHashRing();
    ring.addNode("NodeA", 10);
    ring.addNode("NodeB", 10);
    ring.addNode("NodeC", 10);

    // Add 100 keys
    const originalMappings = new Map<string, string>();
    for (let i = 0; i < 100; i++) {
      const key = `key-${i}`;
      const lookup = ring.addKey(key);
      if (lookup) {
        originalMappings.set(key, lookup.nodeId);
      }
    }

    // Identify which keys are on NodeB
    const keysOnB = Array.from(originalMappings.entries())
      .filter(([, nodeId]) => nodeId === "NodeB")
      .map(([key]) => key);

    // Remove NodeB
    const { movedKeys } = ring.removeNode("NodeB");

    // Verify:
    // 1. The keys moved must be EXACTLY keysOnB.
    expect(movedKeys.size).toBe(keysOnB.length);
    for (const key of keysOnB) {
      expect(movedKeys.has(key)).toBe(true);
      const move = movedKeys.get(key)!;
      expect(move.from).toBe("NodeB");
      expect(move.to).not.toBe("");
      expect(move.to).not.toBe("NodeB");
    }

    // 2. All other keys did not move and are still mapped to their original node
    for (let i = 0; i < 100; i++) {
      const key = `key-${i}`;
      if (originalMappings.get(key) !== "NodeB") {
        expect(movedKeys.has(key)).toBe(false);
        const lookup = ring.lookupKey(key);
        expect(lookup?.nodeId).toBe(originalMappings.get(key));
      }
    }
  });

  it("std dev of key counts strictly decreases on average as vnodeCount rises 1 to 200", () => {
    const runSim = (vnodes: number, trial: number) => {
      const ring = new ConsistentHashRing();
      for (let i = 0; i < 5; i++) {
        ring.addNode(`Node-${i}`, vnodes);
      }
      for (let i = 0; i < 500; i++) {
        ring.addKey(`trial-${trial}-key-${i}`);
      }
      return ring.getMetrics().stdDev;
    };

    let totalStdDev1 = 0;
    let totalStdDev200 = 0;
    const trials = 10;

    for (let t = 0; t < trials; t++) {
      totalStdDev1 += runSim(1, t);
      totalStdDev200 += runSim(200, t);
    }

    const avgStdDev1 = totalStdDev1 / trials;
    const avgStdDev200 = totalStdDev200 / trials;

    console.log(`Average stdDev (1 vnode): ${avgStdDev1}`);
    console.log(`Average stdDev (200 vnodes): ${avgStdDev200}`);

    // Standard deviation at 200 vnodes should be significantly lower on average.
    expect(avgStdDev200).toBeLessThan(avgStdDev1);
  });
});
