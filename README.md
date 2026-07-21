# System Design Playground v2.0

A high-fidelity, interactive, and fully accessible playground built in Next.js, Tailwind CSS, and HTML5 Canvas. This project helps developers visually learn and benchmark complex distributed system algorithms, including consistent hashing, rate limiting, and cluster consensus.

---

## 🚀 Key Modules & Features

### 1. Consistent Hashing Ring

* **Core Algorithm:** Pure FNV-1a 32-bit hashing engine with sorted virtual node ring allocations and clockwise binary lookups.
* **Visualization:** Custom circle layout showing virtual node slots and key routes. Animates key migrations on nodes additions and removals.
* **Performance:** Implements **Offscreen Canvas Caching** for static elements (ring track, 1,600+ virtual node dots). Redraw instructions optimized from **6,400+ down to ~10 per frame**, maintaining a VSync-locked 60 FPS.
* **Interactive Walking Scenario:** Scripted scenario scaling the cluster to 5 nodes and measuring rebalancing standard deviation improvements.

### 2. Comparative Rate Limiters

* **Algorithms:** Concurrent simulation of **Token Bucket**, **Leaky Bucket** (as a meter/policer), and **Sliding Window Log** algorithms. Ticked against synthetic logic timestamps to guarantee 100% stable Vitest results.
* **Stacking Visualizer:** Stacks three pipelines horizontally, feeding them a shared, adjustable traffic trace (constant, sinusoidal, or custom burst spikes).
* **Canvas Charts:** Plots real-time rolling throughput and drop statistics over time using native Canvas 2D drawings.
* **Guided Scenario:** Showcases burst absorption capacities (e.g. Token Bucket absorbing spikes that Sliding Window Log rejects).

### 3. Raft Consensus (Raft-lite)

* **Consensus Machine:** Follower, Candidate, and Leader node roles, term escalations, randomized election timeouts, and request routing.
* **Network Partitions:** Split-brain simulation dividing nodes into group subsets (e.g. a majority 3-node cluster electing a leader while a minority 2-node group times out endlessly).
* **Term Healing:** Restoring partitions synchronizes higher term counters, forcing old leaders to step down and converge.
* **Accessibility:** Canvas coordinate focus overlays allow screen reader navigation and keyboard toggling (`Tab`, `Space`, `Enter` to kill/revive nodes).

### 4. URL Parameter Synchronization

* Synchronizes UI configurations client-side:
  * Active Tab (`?module=hashing | rate-limiter | raft`)
  * VNode Count (`?vnodes=40`)
  * Limiter bounds (`?capacity=15&rate=5&trafficRate=4`)
  * Partition topologies (`?scenario=split-brain`)

---

## 🛠️ Tech Stack & Architecture

* **Core Framework:** Next.js App Router (Static HTML Export `output: 'export'`)
* **Styling:** Tailwind CSS (Dark Charcoal aesthetic theme: background `#0E0F11`, surface `#17181B`, text `#E8E6E1`)
* **State Management:** Zustand stores with client-side hydration
* **Rendering:** Custom canvas loop (`requestAnimationFrame`) and resize observers

---

## 💻 Script Execution Commands

Run commands from the project root:

```bash
# Start development server
npm run dev

# Run full project type check and linter (0 errors, 0 warnings)
npm run lint

# Execute Vitest algorithm tests
npm run test

# Compile production build static files to /out
npm run build
```

---

## ♿ Accessibility (A11y) Design

* **Aria Live Summaries:** Hidden summary divs stating ring load, throughput counts, and leader assignments update on state change.
* **Keyboard Triggers:** Dropdowns, checkboxes, and preset partitioning builders allow comprehensive keyboard controls. Node overlays make canvas coordinates focusable.
