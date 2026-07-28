import { useEffect, useRef } from "react";
import { CLR } from "../constants/hubConstants";

export default function LabCanvas({ canvasRef, canvasSize, onResize, onMouseDown, onMouseMove, onMouseUp }) {
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

  return (
    <div ref={containerRef}
      className="flex-1 min-h-0 rounded-xl border overflow-hidden"
      style={{ borderColor: CLR.border, background: CLR.bg }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }}
      />
    </div>
  );
}
