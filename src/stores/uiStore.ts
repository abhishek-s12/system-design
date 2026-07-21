import { create } from "zustand";
import { getUrlParam, setUrlParam } from "@/lib/utils/url";

export type TabId = "hashing" | "rate-limiter" | "raft";
export type Theme = "light" | "dark";

interface UiState {
  activeTab: TabId;
  theme: Theme;
  reducedMotion: boolean;
  setTab: (tab: TabId) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setReducedMotion: (reducedMotion: boolean) => void;
}

export const useUiStore = create<UiState>((set) => {
  // Check default values client-side
  let initialReducedMotion = false;
  let initialTheme: Theme = "dark";
  let initialTab: TabId = "hashing";

  if (typeof window !== "undefined") {
    initialReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const storedTheme = localStorage.getItem("ui-theme") as Theme | null;
    if (storedTheme === "light" || storedTheme === "dark") {
      initialTheme = storedTheme;
    } else {
      initialTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    const urlTab = getUrlParam("module") as TabId | null;
    if (urlTab === "hashing" || urlTab === "rate-limiter" || urlTab === "raft") {
      initialTab = urlTab;
    }
  }

  return {
    activeTab: initialTab,
    theme: initialTheme,
    reducedMotion: initialReducedMotion,
    setTab: (tab) => {
      setUrlParam("module", tab);
      set({ activeTab: tab });
    },
    setTheme: (theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("ui-theme", theme);
        document.documentElement.classList.toggle("light", theme === "light");
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      set({ theme });
    },
    toggleTheme: () => set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("ui-theme", nextTheme);
        document.documentElement.classList.toggle("light", nextTheme === "light");
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }
      return { theme: nextTheme };
    }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  };
});
