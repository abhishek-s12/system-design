import { create } from "zustand";
import { getUrlParam, setUrlParam } from "@/lib/utils/url";

export type TrafficType = "constant" | "bursty" | "sinusoidal";
export type RateLimiterId = "token-bucket" | "leaky-bucket" | "sliding-window";

export interface RateLimiterHistoryNode {
  timestamp: number;
  admitted: number;
  dropped: number;
}

interface RateLimiterStore {
  // Configurations
  comparisonMode: boolean;
  activeLimiterId: RateLimiterId;
  capacity: number;
  ratePerSec: number;
  trafficRate: number; // requests per second
  trafficType: TrafficType;
  burstTriggerCount: number;

  // Statistics updated periodically (~5-10 times/sec) from the canvas simulation loop
  stats: Record<
    string,
    {
      admittedCount: number;
      droppedCount: number;
      history: RateLimiterHistoryNode[];
    }
  >;

  // Actions
  setComparisonMode: (mode: boolean) => void;
  setActiveLimiterId: (id: RateLimiterId) => void;
  setCapacity: (capacity: number) => void;
  setRatePerSec: (rate: number) => void;
  setTrafficRate: (rate: number) => void;
  setTrafficType: (type: TrafficType) => void;
  triggerBurst: () => void;
  updateStats: (
    stats: Record<
      string,
      {
        admittedCount: number;
        droppedCount: number;
        history: RateLimiterHistoryNode[];
      }
    >
  ) => void;
  reset: () => void;
}

const initialStats = () => ({
  "token-bucket": { admittedCount: 0, droppedCount: 0, history: [] },
  "leaky-bucket": { admittedCount: 0, droppedCount: 0, history: [] },
  "sliding-window": { admittedCount: 0, droppedCount: 0, history: [] },
});

export const useRateLimiterStore = create<RateLimiterStore>((set) => {
  let initialCapacity = 10;
  let initialRate = 5;
  let initialTrafficRate = 4;

  if (typeof window !== "undefined") {
    const urlCap = getUrlParam("capacity");
    if (urlCap) {
      const parsed = parseInt(urlCap);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) initialCapacity = parsed;
    }
    const urlRate = getUrlParam("rate");
    if (urlRate) {
      const parsed = parseInt(urlRate);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) initialRate = parsed;
    }
    const urlTraffic = getUrlParam("trafficRate");
    if (urlTraffic) {
      const parsed = parseInt(urlTraffic);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) initialTrafficRate = parsed;
    }
  }

  return {
    comparisonMode: true,
    activeLimiterId: "token-bucket",
    capacity: initialCapacity,
    ratePerSec: initialRate,
    trafficRate: initialTrafficRate,
    trafficType: "constant",
    burstTriggerCount: 0,
    stats: initialStats(),

    setComparisonMode: (comparisonMode) => set({ comparisonMode }),
    setActiveLimiterId: (activeLimiterId) => set({ activeLimiterId }),
    setCapacity: (capacity) => {
      setUrlParam("capacity", capacity);
      set({ capacity });
    },
    setRatePerSec: (ratePerSec) => {
      setUrlParam("rate", ratePerSec);
      set({ ratePerSec });
    },
    setTrafficRate: (trafficRate) => {
      setUrlParam("trafficRate", trafficRate);
      set({ trafficRate });
    },
    setTrafficType: (trafficType) => set({ trafficType }),
    triggerBurst: () => set((state) => ({ burstTriggerCount: state.burstTriggerCount + 1 })),
    updateStats: (stats) => set({ stats }),
    reset: () => {
      setUrlParam("capacity", null);
      setUrlParam("rate", null);
      setUrlParam("trafficRate", null);
      set({
        comparisonMode: true,
        activeLimiterId: "token-bucket",
        capacity: 10,
        ratePerSec: 5,
        trafficRate: 4,
        trafficType: "constant",
        burstTriggerCount: 0,
        stats: initialStats(),
      });
    },
  };
});
