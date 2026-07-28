import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Crosshair } from "lucide-react";
import { CLR } from "../constants/physicsConstants";

/**
 * Responsive canvas container. Observes its own size via ResizeObserver and
 * reports { w, h } upward via onResize so the parent can keep the canvas
 * pixel dimensions in sync. The canvas element itself is passed in via ref.
 *
 * Props:
 *   canvasRef    – ref forwarded from parent (points at <canvas>)
 *   canvasSize   – { w, h } controlled by parent
 *   onResize     – (size: { w, h }) => void
 *   idleHint     – boolean, shows "Configure and click Launch" overlay when true
 */
export default function CanvasViewport({ canvasRef, canvasSize, onResize, idleHint }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) {
          onResize({ w: Math.floor(width), h: Math.floor(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 rounded-2xl border overflow-hidden relative shadow-2xl"
      style={{ borderColor: CLR.border, background: CLR.bg, boxShadow: `0 24px 60px rgba(2,6,23,0.16), inset 0 1px 0 ${CLR.text}08` }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      <div
        className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-md pointer-events-none"
        style={{ borderColor: CLR.border, background: `${CLR.panel}D9`, color: CLR.muted }}
      >
        <Crosshair size={12} style={{ color: CLR.accent }} />
        Live trajectory field
      </div>

      {/* Idle placeholder hint */}
      <AnimatePresence>
        {idleHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="flex max-w-sm flex-col items-center rounded-2xl border px-7 py-6 text-center shadow-2xl backdrop-blur-md"
              style={{ borderColor: CLR.border, background: `${CLR.panel}D9` }}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${CLR.accent}18`, color: CLR.accent }}>
                <Play size={18} fill="currentColor" />
              </div>
              <p className="text-sm font-bold" style={{ color: CLR.text }}>Ready for launch</p>
              <p className="mt-1.5 text-[11px] leading-5" style={{ color: CLR.muted }}>
                Adjust the launch conditions, then run the simulation to trace the projectile.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
