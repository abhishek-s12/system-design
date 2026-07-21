/**
 * FNV-1a 32-bit hash function.
 * Fowler–Noll–Vo is a non-cryptographic hash function created by Glenn Fowler, Landon Curt Noll, and Kiem-Phong Vo.
 * FNV-1a provides excellent distribution, fast execution, and low collision rates, making it perfect for consistent hashing.
 * Reference: https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function#FNV-1a_hash
 */
export function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // 32-bit integer multiplication (Math.imul) and conversion to unsigned integer via zero-fill right shift
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

export interface VNode {
  hash: number;
  nodeId: string;
  isVirtual: boolean;
}

export class ConsistentHashRing {
  ring: VNode[] = [];
  nodes: Map<string, number> = new Map(); // nodeId -> vnodeCount
  keys: Map<string, string> = new Map(); // key -> nodeId (current mapping)

  /**
   * Add a new physical node to the ring, creating `vnodeCount` virtual nodes.
   */
  addNode(nodeId: string, vnodeCount: number): { movedKeys: Map<string, { from: string; to: string }> } {
    // If node already exists, clean up first
    if (this.nodes.has(nodeId)) {
      this.removeNode(nodeId);
    }
    
    this.nodes.set(nodeId, vnodeCount);

    // Create and add virtual nodes to ring
    for (let i = 0; i < vnodeCount; i++) {
      const vnodeId = `${nodeId}#${i}`;
      const hash = fnv1a(vnodeId);
      this.ring.push({
        hash,
        nodeId,
        isVirtual: i > 0,
      });
    }

    // Keep ring sorted by hash ascending
    this.ring.sort((a, b) => a.hash - b.hash);

    // Rebalance active keys based on new ring structure
    return this.rebalance();
  }

  /**
   * Remove a physical node and all its virtual nodes from the ring.
   */
  removeNode(nodeId: string): { movedKeys: Map<string, { from: string; to: string }> } {
    if (!this.nodes.has(nodeId)) {
      return { movedKeys: new Map() };
    }
    
    this.nodes.delete(nodeId);
    
    // Remove all virtual nodes matching this nodeId
    this.ring = this.ring.filter((vnode) => vnode.nodeId !== nodeId);

    // Rebalance active keys based on updated ring structure
    return this.rebalance();
  }

  /**
   * Resolve a key to its designated physical node on the ring.
   * Finds the first virtual node with a hash greater than or equal to the key's hash.
   * Wraps around to the first node if the key's hash is larger than all nodes on the ring.
   */
  lookupKey(key: string): { nodeId: string; hash: number } | null {
    if (this.ring.length === 0) {
      return null;
    }

    const keyHash = fnv1a(key);
    
    // Binary search to find the closest clockwise node
    let low = 0;
    let high = this.ring.length - 1;
    let targetIdx = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.ring[mid].hash >= keyHash) {
        targetIdx = mid;
        high = mid - 1; // target first node clockwise
      } else {
        low = mid + 1;
      }
    }

    // Wrap around to start of ring if hash is greater than the largest ring hash
    if (keyHash > this.ring[this.ring.length - 1].hash) {
      targetIdx = 0;
    }

    return {
      nodeId: this.ring[targetIdx].nodeId,
      hash: keyHash,
    };
  }

  /**
   * Add a new key tracking association, looking up its assigned node.
   */
  addKey(key: string): { nodeId: string; hash: number; isNew: boolean; oldNodeId?: string } | null {
    const lookup = this.lookupKey(key);
    if (!lookup) {
      return null;
    }

    const oldNodeId = this.keys.get(key);
    const isNew = oldNodeId === undefined;
    this.keys.set(key, lookup.nodeId);

    return {
      nodeId: lookup.nodeId,
      hash: lookup.hash,
      isNew,
      oldNodeId,
    };
  }

  /**
   * Remove a key from mapping tracking.
   */
  removeKey(key: string): boolean {
    return this.keys.delete(key);
  }

  /**
   * Re-evaluates every key's assignment and returns which keys migrated.
   */
  rebalance(): { movedKeys: Map<string, { from: string; to: string }> } {
    const movedKeys = new Map<string, { from: string; to: string }>();

    if (this.ring.length === 0) {
      // Clear mappings and record everything as removed
      for (const [key, oldNodeId] of this.keys.entries()) {
        movedKeys.set(key, { from: oldNodeId, to: "" });
      }
      this.keys.clear();
      return { movedKeys };
    }

    for (const key of Array.from(this.keys.keys())) {
      const oldNodeId = this.keys.get(key) || "";
      const lookup = this.lookupKey(key);
      const newNodeId = lookup ? lookup.nodeId : "";

      if (oldNodeId !== newNodeId) {
        movedKeys.set(key, { from: oldNodeId, to: newNodeId });
        if (newNodeId) {
          this.keys.set(key, newNodeId);
        } else {
          this.keys.delete(key);
        }
      }
    }

    return { movedKeys };
  }

  /**
   * Get metrics representing keys distribution across physical nodes.
   */
  getMetrics() {
    const nodeCounts = new Map<string, number>();
    for (const nodeId of this.nodes.keys()) {
      nodeCounts.set(nodeId, 0);
    }

    let totalKeys = 0;
    for (const nodeId of this.keys.values()) {
      if (nodeCounts.has(nodeId)) {
        nodeCounts.set(nodeId, (nodeCounts.get(nodeId) || 0) + 1);
        totalKeys++;
      }
    }

    if (this.nodes.size === 0) {
      return { stdDev: 0, average: 0, counts: {} as Record<string, number> };
    }

    const countsArray = Array.from(nodeCounts.values());
    const average = totalKeys / this.nodes.size;

    // Standard deviation computation
    const variance =
      countsArray.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
      this.nodes.size;
    const stdDev = Math.sqrt(variance);

    const countsObj: Record<string, number> = {};
    for (const [nodeId, count] of nodeCounts.entries()) {
      countsObj[nodeId] = count;
    }

    return {
      stdDev,
      average,
      counts: countsObj,
    };
  }
}
