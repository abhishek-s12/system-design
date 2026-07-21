"use client";

import { useEffect, useRef, useState } from "react";

export function FpsMonitor() {
  const [fps, setFps] = useState<number>(0);
  const [show, setShow] = useState<boolean>(true);
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    lastTime.current = performance.now();
    let animationId: number;

    const tick = () => {
      frameCount.current += 1;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, []);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 z-50 rounded bg-[#17181B] border border-[#8B8D93]/30 px-2.5 py-1 text-xs font-mono text-[#E8E6E1]/60 hover:text-[#E8E6E1] transition-colors"
      >
        FPS
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded bg-[#17181B]/95 border border-[#8B8D93]/30 px-3 py-1.5 font-mono text-xs text-[#E8E6E1] shadow-lg select-none">
      <span>
        FPS:{" "}
        <span className={fps >= 55 ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
          {fps}
        </span>
      </span>
      <div className="w-[1px] h-3 bg-[#8B8D93]/30 mx-1" />
      <button
        onClick={() => setShow(false)}
        className="text-[#E8E6E1]/50 hover:text-[#E8E6E1] transition-colors"
        aria-label="Close FPS Monitor"
      >
        ✕
      </button>
    </div>
  );
}
