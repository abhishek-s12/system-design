import { useEffect, useRef } from "react";
import { useUiStore } from "@/stores/uiStore";

export type TickCallback = (
  ctx: CanvasRenderingContext2D,
  deltaTime: number,
  reducedMotion: boolean
) => void;

export function useCanvasLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  tickCallback: TickCallback
) {
  const callbackRef = useRef<TickCallback>(tickCallback);
  const reducedMotion = useUiStore((state) => state.reducedMotion);

  // Keep callback ref fresh to avoid restarting loop when it changes
  useEffect(() => {
    callbackRef.current = tickCallback;
  }, [tickCallback]);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // cap deltaTime at 100ms to avoid physics explosions
          lastTime = currentTime;

          callbackRef.current(ctx, deltaTime, reducedMotion);
        }
      }
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [canvasRef, reducedMotion]);
}
