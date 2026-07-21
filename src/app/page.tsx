"use client";

import dynamic from "next/dynamic";
import { useUiStore, TabId } from "@/stores/uiStore";
import { Tabs } from "@/components/ui/Tabs";
import { Sun, Moon, Zap, ZapOff } from "lucide-react";
import { FpsMonitor } from "@/components/dev/FpsMonitor";
import { AnimatePresence, motion } from "framer-motion";

// Lazy load canvas modules with ssr: false as requested
const ConsistentHashingModule = dynamic(
  () => import("@/components/modules/ConsistentHashing/ConsistentHashingModule"),
  { ssr: false }
);

const RateLimiterModule = dynamic(
  () => import("@/components/modules/RateLimiter/RateLimiterModule"),
  { ssr: false }
);

const RaftConsensusModule = dynamic(
  () => import("@/components/modules/RaftConsensus/RaftConsensusModule"),
  { ssr: false }
);

export default function Home() {
  const {
    activeTab,
    theme,
    reducedMotion,
    setTab,
    toggleTheme,
    setReducedMotion,
  } = useUiStore();

  const tabItems = [
    { id: "hashing" as const, label: "Consistent Hashing" },
    { id: "rate-limiter" as const, label: "Rate Limiter" },
    { id: "raft" as const, label: "Raft Consensus" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* Header */}
      <header className="border-b border-[#8B8D93]/10 bg-[#17181B] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#E8A33D] font-mono font-bold text-lg tracking-wider">
            SYSTEM PLAYGROUND
          </span>
          <span className="text-[10px] bg-[#E8E6E1]/10 text-[#E8E6E1]/70 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            v2.0
          </span>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Reduced Motion Toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#8B8D93]/10 text-xs text-[#E8E6E1]/70 hover:text-[#E8E6E1] hover:bg-[#0E0F11] transition-all cursor-pointer"
            title={
              reducedMotion ? "Enable animations" : "Disable animations (Reduced Motion)"
            }
            aria-label={
              reducedMotion ? "Enable animations" : "Disable animations"
            }
          >
            {reducedMotion ? <ZapOff size={14} /> : <Zap size={14} />}
            <span className="hidden sm:inline font-mono">
              Reduced Motion: {reducedMotion ? "ON" : "OFF"}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-[#8B8D93]/10 text-[#E8E6E1]/70 hover:text-[#E8E6E1] hover:bg-[#0E0F11] transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="max-w-md w-full self-center sm:self-start">
          <Tabs
            items={tabItems}
            activeId={activeTab}
            onChange={(id) => setTab(id as TabId)}
          />
        </div>

        {/* Tab content wrapper with transitions */}
        <div className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
              transition={{ duration: reducedMotion ? 0 : 0.15, ease: "easeOut" }}
              className="flex-grow flex flex-col"
            >
              {activeTab === "hashing" && <ConsistentHashingModule />}
              {activeTab === "rate-limiter" && <RateLimiterModule />}
              {activeTab === "raft" && <RaftConsensusModule />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* FPS Monitor */}
      <FpsMonitor />
    </div>
  );
}
