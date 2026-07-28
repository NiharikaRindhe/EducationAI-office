import { useEffect, useRef } from "react";
import { CLR } from "../constants/soundConstants";

/**
 * Responsive canvas container — observes its own size and reports {w,h}.
 * Renders TWO stacked canvases: tank viewport (top) + wave graph (bottom).
 */
export default function SoundCanvas({ tankRef, graphRef, tankSize, graphSize, onResize }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) onResize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);

  const tankH  = Math.floor((tankSize.h ?? 400) * 0.62);
  const graphH = Math.floor((tankSize.h ?? 400) * 0.35);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex flex-col gap-1 rounded-xl border overflow-hidden pt-12"
      style={{ borderColor: CLR.border, background: CLR.bg }}
    >
      {/* Wave tank viewport */}
      <canvas
        ref={tankRef}
        width={tankSize.w}
        height={tankH}
        style={{ display: "block", width: "100%", height: `${tankH}px`}}
      />

      {/* Divider */}
      <div className="h-px shrink-0" style={{ background: CLR.border }} />

      {/* Live wave graph */}
      <canvas
        ref={graphRef}
        width={tankSize.w}
        height={graphH}
        style={{ display: "block", width: "100%", height: `${graphH}px`, flex: "1" }}
      />
    </div>
  );
}
