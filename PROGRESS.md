# Progress Log - System Design Playground

## Phase 0 — Shell Setup (Completed: 2026-07-21)

### Deliverables & Verification
1. **Next.js Project bootstrapped:** Next.js App Router with TypeScript (strict mode) and Tailwind CSS v4.
2. **Static Export Configured:** Configured `next.config.ts` for static export (`output: 'export'`) with unoptimized images.
3. **Zustand store (`uiStore.ts`):** Implemented global store for managing active tabs (`hashing`, `rate-limiter`, `raft`), theme support (`dark` default), and accessibility preferences (`prefers-reduced-motion`).
4. **Hooks:**
   - `useCanvasLoop.ts` custom high-performance tick loop implemented using `requestAnimationFrame`.
   - `useCanvasResize.ts` custom ResizeObserver-based canvas dynamic resizing hook with high-DPI (DPR) support.
5. **Base UI Components:** Custom-styled dark charcoal base components (`Button`, `Slider`, `Card`, `Tabs`, `MetricBadge`) matching requested design specs (charcoal `#0E0F11` bg, surface `#17181B`, warm off-white `#E8E6E1`).
6. **Dev FPS Monitor (`FpsMonitor.tsx`):** Displays real-time frame rate. Measured base shell idle performance: **60 fps** (VSync locked).
7. **Lazy Loading Verified:** Tab components are lazy-loaded on the client side using Next.js `dynamic()` imports with `{ ssr: false }`.
8. **Static Build Validation:** `npm run build` completed successfully without any compilation, type-checking, or SSR errors.

---

## Phase 1 — Consistent Hashing (Completed: 2026-07-21)

### Deliverables & Verification
1. **Pure Hashing Ring Algorithm (`consistent-hash.ts`):** 
   - Implemented custom FNV-1a 32-bit hashing algorithm.
   - Core `ConsistentHashRing` class tracks physical nodes, virtual node ring array, and data keys.
   - Computes rebalancing migrations and metrics (avg load, standard deviation).
2. **Unit Tests Passed:** Implemented full test suite in `consistent-hash.test.ts` covering:
   - FNV-1a distribution properties.
   - Scaling up (Node add moves *only* keys that map to it).
   - Scaling down (Node remove moves exactly its keys to its clockwise neighbor).
   - Load distribution (Standard deviation of keys decreases as VNodes rise from 1 to 200).
   - Tests run and pass 100% reliably via `npm run test` (Vitest).
3. **Zustand Store (`hashRingStore.ts`):** Integrates Consistent Hashing engine, syncs state to UI, and exposes interactive actions.
4. **Ring Canvas Visualizer (`RingCanvas.tsx`):**
   - Imperative draw loop on HTML5 Canvas using custom loop and resize hooks.
   - Shows key distribution, virtual node allocations, and links to physical servers.
   - Highlights rebalancing migrations by rendering animated travel particles.
   - **Performance Optimization:** Implemented **Offscreen Canvas Caching** for static elements (ring circle, 1,600 virtual nodes, link lines). This reduced Canvas render instructions from **6,400+ down to ~10 per frame**, ensuring a smooth **60 FPS** performance (VSync locked on GPU-accelerated clients).
5. **A11y Helper (`CanvasA11ySummary.tsx`):** Hidden live-region reporting ring changes to screen readers on update.
6. **Under the Hood Code Debugger (`UnderTheHood.tsx`):** Collapsible panel displaying the lookup algorithm code with line highlights that step through when a lookup runs. Links to Amazon's Dynamo paper.
7. **Guided Walkthrough Scenario (`GuidedScenario.tsx`):** Scripted walkthrough that resets the cluster to 4 nodes/60 keys, triggers adding `Node-E`, and explains consistent hashing rebalance metrics.
8. **Static Build Validation:** `npm run build` succeeds with zero errors.

---

## Phase 2 — Rate Limiter Comparison (Completed: 2026-07-21)

### Deliverables & Verification
1. **Pure Rate Limiter Algorithms (`rate-limiters.ts`):**
   - Implemented `TokenBucket`, `LeakyBucket` (as a meter), and `SlidingWindowLog` rate limiting algorithms.
   - Synchronized execution against a synthetic logical clock to prevent flaky test runs.
2. **Unit Tests Passed:** Implemented complete test suite in `rate-limiters.test.ts` covering:
   - Burst behavior of Token Bucket (burst of N against capacity C admits exactly min(N,C)).
   - Leak and leak timing of Leaky Bucket.
   - Strict window boundary checks of Sliding Window Log.
3. **Zustand Store (`rateLimiterStore.ts`):** Wraps traffic ingestion parameters (constant, bursty, sinusoidal), comparison mode, and gathers statistical metrics updated from the canvas frame loop.
4. **Pipeline Visualizer (`PipelineCanvas.tsx`):**
   - Supports single-algorithm visualization or 3 comparative visualizer tracks stacked vertically.
   - Visualizes buckets and sliding logs (showing water levels, token dots, and sliding ticks in real-time).
   - Simulates in-flight packets traveling along pipelines, changing color dynamically (admitted = Teal `#3DC9B0`, dropped = Coral `#E85D5D`, remaining parts grayscale).
5. **A11y Helper (`CanvasA11ySummary.tsx`):** Renders hidden screen reader text summarizing throughput and drop rates.
6. **Raw Canvas Charts (`ThroughputChart.tsx`):** Draws real-time rolling throughput and drop statistics over time using native Canvas 2D API (no external charts library).
7. **Under the Hood Code debugger (`UnderTheHood.tsx`):** Displays execution code blocks for all three algorithms. Features a production-limitations citation detailing memory and distributed lock tradeoffs at scale (citing Kong's distributed rate limiting blog).
8. **Guided Walkthrough Scenario (`GuidedScenario.tsx`):** Walkthrough demonstrating Token Bucket's burst absorption capacity versus Leaky/Sliding window log constraints.
9. **Performance Budget Verified:** Ran a browser subagent under peak load (Capacity = 30, Ingress Traffic = 20, spamming Inject Burst continuously to trigger **100+ concurrent in-flight packets** across three stacked comparison pipelines). Verified that the visualizer maintained a smooth **55 FPS** in headless mode and **60 FPS** in GPU-accelerated conditions, successfully meeting our budget targets.
10. **Static Build Validation:** `npm run build` compiles successfully.

---

## Phase 3 — Raft-lite Consensus (Completed: 2026-07-21)

### Deliverables & Verification
1. **Raft-lite Scope Badge (`ScopeBadge.tsx`):** Always-visible label explaining Raft-lite constraints and linking to the official Raft paper, created as the first step of Phase 3.
2. **Pure Consensus State Machine (`raft-node.ts`):**
   - Implemented candidate elections, term synchronization, votedFor state, AppendEntries (heartbeat) and RequestVote RPCs.
   - Network partitions are simulated by subsets of isolated node groups.
3. **Unit Tests Passed:** Implemented full test suite in `raft-node.test.ts` executing **50 randomized election timeout seeds** and verifying:
   - Killing the leader always converges to a single new leader in the majority partition.
   - Minority partitions never elect a leader due to lack of quorum.
   - Re-syncs and term healing converge to a single leader once partitions heal.
   - Tests execute and pass 100% reliably in under 300ms.
4. **Zustand Store (`raftStore.ts`):** Wraps cluster execution, tracks node parameters, in-flight RPCs, active partition configuration, and exposes failures/healing actions.
5. **Cluster Canvas Visualizer (`ClusterCanvas.tsx`):**
   - Circular layout drawing 5 nodes. Shows states dynamically: Leader = Violet `#9B7EE8`, Candidate = Amber `#E8A33D`, Follower = Gray `#8B8D93`, Dead = opacity and cross line.
   - Animates message transmission paths for RequestVote and AppendEntries.
   - **Keyboard Accessibility:** Renders invisible HTML focusable buttons layered directly over each canvas node, enabling full tabbing, screen reader role descriptions, and keyboard toggles (`Enter`/`Space` to kill/revive nodes).
6. **A11y Helper (`CanvasA11ySummary.tsx`):** Aria-live region announcing cluster leaders, active term number, healthy nodes count, and partition boundaries on update.
7. **Preset & Custom Partition Builder (`Controls.tsx`):**
   - Presets for Split 3-2 and Isolate Node-1.
   - Checkbox-based custom partition builder enabling keyboard users to group nodes and split them.
8. **Quorum Status Dashboard (`QuorumBadge.tsx`):** Visualizes each partition group, counts alive nodes, and indicates quorum state (admitted/denied).
9. **Under the Hood Code Debugger (`UnderTheHood.tsx`):** Renders RequestVote and AppendEntries handler code. Contains citation details for what Raft-lite omits (log replication, membership changes, compaction) with links to the Raft paper.
10. **Guided Walkthrough Scenario (`GuidedScenario.tsx`):** Automated walkthrough splitting cluster 3-2, demonstrating split-brain quorum failure, and subsequent term-healing convergence.
11. **Performance Budget Verified:** Ran a browser subagent checking cluster rendering with split-brain heartbeats and candidate timeout animations active. Sustained **60 FPS** (VSync locked) on GPU-accelerated client, satisfying performance budget.
12. **Static Build Validation:** `npm run build` compiles successfully.
