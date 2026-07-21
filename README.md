# Interactive System Design Playground

**Watch distributed systems break, and fix themselves, in real time.**

A high-fidelity, fully accessible visualizer where you don't just read about
consistent hashing, rate limiting, and Raft consensus — you kill nodes, split
networks, and overload traffic pipelines, and watch the correct behavior play
out live, rendered on raw HTML5 Canvas at a locked 60 FPS.

🔗 **Live demo:** https://system-design-xi-blush.vercel.app/

---

## Why this exists

Most system-design explainers are static diagrams or dense prose. You can
*read* that consistent hashing only moves ~1/N of keys when a node is added —
but you don't really believe it until you watch the other 90% of keys just...
not move.

This tool is built around causality, not description: every module runs a
real, tested simulation engine under the hood — not an animation faked to
look plausible. Take an action, watch the system respond correctly, in
real time.

Built for anyone prepping for system design interviews, learning distributed
systems, or who's used the phrase "consistent hashing" in a meeting without
ever watching one actually run.

---

## Modules

### 🔵 Consistent Hashing Ring

* **Core algorithm:** pure FNV-1a 32-bit hashing engine, sorted virtual-node
  ring allocation, clockwise binary lookup.
* **Visualization:** circular ring layout showing virtual node slots and key
  routes, with animated key migration on node addition/removal.
* **Performance:** offscreen canvas caching for static elements (ring track,
  1,600+ virtual node dots) cuts redraw instructions from **6,400+ down to
  ~10 per frame**, holding a VSync-locked 60 FPS even at full load.
* **Guided scenario:** scales the cluster to 5 nodes and measures the
  standard-deviation improvement in key distribution as it rebalances.

### 🟢 Rate Limiter Comparison

* **Algorithms:** Token Bucket, Leaky Bucket (as a meter/policer), and
  Sliding Window Log, run concurrently against synthetic logical timestamps
  for 100% deterministic, flake-free tests.
* **Stacking visualizer:** three pipelines side by side, fed a shared,
  adjustable traffic trace — constant, sinusoidal, or custom burst spikes.
* **Canvas charts:** real-time rolling throughput and drop statistics,
  drawn natively on Canvas 2D — no charting library.
* **Guided scenario:** shows Token Bucket absorbing a burst that Sliding
  Window Log rejects, on identical traffic.



### 🟣 Raft-lite Consensus

* **Consensus machine:** Follower / Candidate / Leader roles, term
  escalation, randomized election timeouts, RPC request routing.
* **Network partitions:** split-brain simulation — a majority partition
  (e.g. 3 of 5 nodes) elects a new leader while the minority times out
  endlessly with no quorum.
* **Term healing:** restoring a partition synchronizes higher term counters
  automatically, forcing stale leaders to step down and the cluster to
  reconverge on one leader.
* **Accessibility:** canvas coordinate focus overlays let screen readers and
  keyboard users navigate nodes and trigger kill/revive with `Tab`, `Space`,
  `Enter` — no mouse required.



> **Scope note:** this implements leader election and quorum consensus only.
> Log replication, snapshotting, and membership changes are intentionally
> omitted — see the in-app "Raft-lite" badge and link to the
> [full Raft paper](https://raft.github.io/raft.pdf) for what's not modeled.

### 🔗 URL Parameter Synchronization

Every module's state is shareable via URL, client-side:

| Param | Example | Effect |
|---|---|---|
| `module` | `?module=raft` | Opens directly on a given tab |
| `vnodes` | `?vnodes=40` | Sets virtual-node count on the hashing ring |
| `capacity`, `rate`, `trafficRate` | `?capacity=15&rate=5&trafficRate=4` | Configures rate limiter bounds |
| `scenario` | `?scenario=split-brain` | Loads a named Raft partition topology |

Useful for linking a specific teaching moment directly from a blog post,
talk, or interview prep notes.

---

## What makes this technically interesting

- **Simulation truth is separate from rendering.** Every algorithm
  (`src/lib/algorithms/*.ts`) is pure TypeScript with zero DOM dependencies,
  fully unit-tested with Vitest. The canvas layer only paints state — it
  never computes anything, so nothing on screen is faked for effect.
- **60fps without fighting React.** Simulation state lives in refs, read by
  an imperative `requestAnimationFrame` loop. React/Zustand only drive UI
  chrome (buttons, HUD numbers), never the per-frame canvas draw.
- **Raw Canvas 2D, no rendering library.** No D3, no Konva — these node
  counts don't need a scene-graph abstraction, and cutting the dependency
  keeps performance predictable and inspectable.
- **Accessible by default, not bolted on.** Hidden `aria-live` summary
  regions report ring load, throughput counts, and leader assignments as
  they change. Focusable canvas overlays, dropdowns, checkboxes, and a
  preset partition builder mean every interaction has a full keyboard path.

---

## Tech stack

* **Framework:** Next.js (App Router, static HTML export — `output: 'export'`)
* **Language:** TypeScript, strict mode
* **Rendering:** raw Canvas 2D API, custom `requestAnimationFrame` loop + resize observers
* **Styling:** Tailwind CSS — dark charcoal theme (`background #0E0F11`, `surface #17181B`, `text #E8E6E1`)
* **State:** Zustand, client-side hydrated
* **Testing:** Vitest

---

## Getting started

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
npm run dev      # Start development server
npm run lint      # Full type check + lint (0 errors, 0 warnings)
npm run test      # Run Vitest algorithm test suite
npm run build     # Compile static production build to /out
```

`npm run test` covers ring rebalancing correctness, rate-limiter burst/window
boundary behavior, and Raft leader-election convergence across randomized
timeout seeds.

---

## Project structure

```
src/
├── app/                  # Next.js App Router pages
├── components/
│   ├── ui/               # Shared UI primitives (Button, Slider, Tabs, ...)
│   └── modules/          # Per-module visualizer components
│       ├── ConsistentHashing/
│       ├── RateLimiter/
│       └── RaftConsensus/
├── lib/
│   ├── algorithms/       # Pure, unit-tested simulation engines
│   └── hooks/            # Canvas render-loop and resize hooks
└── stores/                # Zustand state, one per module
```

---

## Contributing

Issues and PRs welcome — especially additional guided scenarios, new
algorithms within an existing module (e.g. another hashing scheme), or
further accessibility improvements.

## License

[MIT](./LICENSE)
