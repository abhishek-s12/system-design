ROLE
You are building "Interactive System Design Playground" v2.0 — a Next.js 15
(App Router, TypeScript strict) educational visualizer with three modules:
Consistent Hashing, Rate Limiter Comparison, and Raft-lite Consensus. Work in
PHASES. Do not start Phase N+1 until Phase N builds, type-checks, passes tests,
and meets its performance budget. Write a short status note to PROGRESS.md
after each phase before continuing.

NON-NEGOTIABLE ARCHITECTURE (do not substitute or "improve" these)

- Renderer: raw Canvas 2D API only. No D3.js, no Konva.js.
- Simulation state lives in refs, read by a requestAnimationFrame loop in
  src/lib/hooks/useCanvasLoop.ts. React state (useState/Zustand) drives ONLY
  UI chrome — buttons, HUD numbers — and updates at most ~10x/sec, never the
  per-frame canvas draw.
- Simulation logic lives ONLY in src/lib/algorithms/*.ts: pure TypeScript,
  zero React/DOM imports, fully unit-tested with Vitest. This is the single
  source of truth for every number shown anywhere in the UI — the canvas
  layer only paints, it never computes.
- Hash function: FNV-1a, implemented directly (no crypto library), documented
  inline with a comment linking to the algorithm reference.
- Route-based code splitting per module tab; target < 300KB JS per module route.
- Styling: Tailwind CSS. Icons: lucide-react. Layout transitions (not canvas
  animation): Framer Motion. State: Zustand, one store per module + one
  shared uiStore.
- Every module supports prefers-reduced-motion (disables particle/pulse
  animation, keeps state transitions instant, still fully functional).
- Zero external analytics or tracking of any kind.

PERFORMANCE BUDGET (verify, don't estimate)
Measure via performance.now() deltas in dev mode. Each module must sustain
≥55fps at: Hashing — 500 keys / 200 VNodes / 8 nodes. Rate Limiter — 100
in-flight packets across comparison mode (3 algorithms simultaneously).
Raft — 5 nodes with full partition + heartbeat animation running. Report
actual measured fps in PROGRESS.md for each phase, not a guess.

NON-GOALS (do not build these even if it seems easy to add)

- No log-replication content, snapshotting, or byzantine fault tolerance in
  Raft — label it "Raft-lite" in the UI with a link to the full Raft paper.
- No user-drawn/custom diagramming — layouts are fixed per module.
- No multiplayer/backend/collaboration — single-user, client-only, static
  export deployable to Vercel/GitHub Pages.
- Not mobile-first — must be responsive and usable on mobile, but desktop is
  the primary target; don't burn phase time on mobile-specific UX beyond
  "doesn't break."

PHASE 0 — Shell

- src/app/layout.tsx, src/app/page.tsx: app shell, dark/light theme, tab nav
  (Hashing / Rate Limiter / Raft), each tab lazy-loaded as its own route chunk.
- src/components/ui/: Button, Slider, Card, Tabs, MetricBadge — no
  module-specific logic.
- src/stores/uiStore.ts: active tab, theme, reduced-motion preference (read
  from prefers-reduced-motion, overridable).
- VERIFY: `npm run build` succeeds; tab switching lazy-loads chunks (check
  network tab); reduced-motion toggle works.

PHASE 1 — Consistent Hashing

- src/lib/algorithms/consistent-hash.ts: sorted ring array of
  {hash, nodeId, isVirtual}, FNV-1a hash, addNode(id, vnodeCount),
  removeNode(id), lookupKey(key), rebalance() returning moved keys.
  Vitest: adding a node moves only keys now closer to it; removing a node
  moves exactly its keys to the clockwise neighbor and nothing else; std dev
  of key counts strictly decreases as vnodeCount rises 1→200.
- src/stores/hashRingStore.ts: wraps the engine; holds ring + metrics
  snapshot; exposes actions.
- src/components/modules/ConsistentHashing/:
  - RingCanvas.tsx — imperative draw, migration-highlight animation on
    rebalance, reads from refs per the architecture rule above.
  - Controls.tsx — add/remove node, VNode slider (1-200), add/remove keys.
  - MetricsHUD.tsx — std dev, % keys migrated on last change.
  - UnderTheHood.tsx — collapsible panel showing the actual lookupKey()
    source with the active line highlighted during an operation.
  - GuidedScenario.tsx — scripted 60-90s walkthrough: "add a 5th node to a
    4-node ring," narrating what's happening and why, then hands off to
    free-play.
- VERIFY: unit tests pass; fps budget met at full load (see above); guided
  scenario runs start-to-finish without manual intervention.

PHASE 2 — Rate Limiter Comparison

- src/lib/algorithms/rate-limiters.ts: shared interface
  RateLimiter { tryRequest(timestamp): boolean }, implementations
  TokenBucket(capacity, refillRate), LeakyBucket(capacity, outflowRate),
  SlidingWindowLog(windowMs, maxRequests). Vitest: token bucket burst of N
  against capacity C admits exactly min(N,C); sliding window correctly
  excludes/includes requests straddling the window boundary against a
  synthetic clock (no wall-clock flakiness).
- src/stores/rateLimiterStore.ts: comparison-mode flag, traffic generator
  state, per-algorithm rolling throughput/dropped series against one shared
  traffic trace.
- src/components/modules/RateLimiter/:
  - PipelineCanvas.tsx — supports both single-algorithm view AND
    comparison mode (3 pipelines stacked, same trace feeding all three
    simultaneously).
  - Controls.tsx — algorithm tabs, comparison-mode toggle, traffic sliders,
    burst trigger.
  - ThroughputChart.tsx — time series per algorithm, Canvas-drawn (no chart
    library).
  - UnderTheHood.tsx, GuidedScenario.tsx — as in Phase 1, scenario: "a burst
    Token Bucket absorbs but Sliding Window Log rejects."
- VERIFY: comparison mode visibly shows different admit/drop patterns per
  algorithm on the same bursty trace; fps budget met with 100 in-flight
  packets across all three.

PHASE 3 — Raft-lite Consensus

- Build the in-app "Raft-lite" label and link to the full Raft paper BEFORE
  writing engine code — it constrains what you build.
- src/lib/algorithms/raft-node.ts: per-node state machine
  (Follower/Candidate/Leader, currentTerm, votedFor, randomized election
  timeout), Cluster class ticking all nodes, routing RequestVote/
  AppendEntries, respecting an active partition (cross-partition messages
  dropped). Vitest: across 50 randomized timeout seeds, killing the leader
  always converges to exactly one new leader in the majority partition
  within a bounded tick count; a minority partition never elects while
  split, and re-syncs to the majority's term once healed.
- src/stores/raftStore.ts: cluster state, partition definition, actions.
- src/components/modules/RaftConsensus/:
  - ClusterCanvas.tsx — 5 nodes, connecting lines, crown/candidate/follower
    icons, heartbeat pulse from leader, click-drag partition line.
  - Controls.tsx — kill leader, heal partition.
  - QuorumBadge.tsx — majority/minority indicator per partition side.
  - UnderTheHood.tsx, GuidedScenario.tsx — scenario: "split 5 nodes 3-2,
    watch only the 3-side elect."
- VERIFY: the 50-seed convergence test passes reliably (no flakes); fps
  budget met with full partition + heartbeat animation running.

PHASE 4 — Cross-cutting polish

- Shareable scenario URLs: ?module=raft&scenario=split-brain for named
  scenarios, plus raw-state param for custom configurations, synced with
  each module's Zustand store via Next.js searchParams.
- "What would break in production" callout per module linking to the real
  paper/writeup (Raft paper, a consistent-hashing writeup, a rate-limiter
  writeup) — one paragraph + link, not a full essay.
- Responsive canvas resize via ResizeObserver; verify usable (not
  necessarily optimal) on a mobile viewport per the non-goals above.
- Full a11y pass: keyboard-operable controls, aria-labels on each canvas
  summarizing current state for screen readers.
- Static export config for GitHub Pages/Vercel.

Work phase by phase. After each phase, report the verification results
(including measured fps) before starting the next phase.
