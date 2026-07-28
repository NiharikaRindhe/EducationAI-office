import { useEffect, useRef } from "react";
import { CLR } from "../constants/frictionConstants";

/**
 * Responsive canvas container. Observes its own size via ResizeObserver
 * and reports { w, h } upward via onResize.
 */
export default function FrictionCanvas({ canvasRef, canvasSize, onResize }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0)
          onResize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 rounded-xl border overflow-hidden relative"
      style={{ borderColor: CLR.border, background: CLR.bg }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
