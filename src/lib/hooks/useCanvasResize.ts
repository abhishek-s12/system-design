import { useEffect, useState, RefObject } from "react";

export interface CanvasDimensions {
  width: number;
  height: number;
  dpr: number;
}

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 0,
    height: 0,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      // Adjust internal canvas drawing buffer size for crisp rendering on high-DPI screens
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Ensure CSS width and height match container's physical layout size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      setDimensions({ width, height, dpr });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    // Initial trigger
    const initialRect = container.getBoundingClientRect();
    handleResize([{ contentRect: initialRect } as ResizeObserverEntry]);

    return () => {
      observer.disconnect();
    };
  }, [canvasRef, containerRef]);

  return dimensions;
}
