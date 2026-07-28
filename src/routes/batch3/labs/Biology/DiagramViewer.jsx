/**
 * DiagramViewer.jsx
 *
 * Study Mode  → label chips at labelPos, click to open InfoCard.
 * Memory Quiz → empty boxes at labelPos; current target box pulses.
 *               A "Word Bank" inventory panel on the right lets the student
 *               pick the correct label — no clicking on the diagram needed.
 *
 * Coordinate format (biologyRegistry.js):
 *   coords:   [x%, y%]  — anatomy dot on the image (0-100 of image)
 *   labelPos: [lx%, ly%] — where the box/chip appears (0-100 of image)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import MissingAssetFallback from "./MissingAssetFallback";

// ─── Layout constants ──────────────────────────────────────────────────────────
const LABEL_PADDING = 72; // px reserved on all 4 sides for labels/boxes

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  idle_dot:    "#475569",
  idle_line:   "#475569",
  dot:         "#059669",
  line:        "#059669",
  hover_dot:   "#10b981",
  target_dot:  "#d97706",
  correct:     "#059669",
  wrong:       "#dc2626",
};

// ─── Compute exact image bounds with padding ───────────────────────────────────
function computeImageBounds(nW, nH, cW, cH) {
  if (!nW || !nH || cW <= 0 || cH <= 0) return null;
  const availW = cW - 2 * LABEL_PADDING;
  const availH = cH - 2 * LABEL_PADDING;
  if (availW <= 0 || availH <= 0) return null;
  const scale = Math.min(availW / nW, availH / nH);
  const rW = nW * scale;
  const rH = nH * scale;
  return {
    left:   LABEL_PADDING + (availW - rW) / 2,
    top:    LABEL_PADDING + (availH - rH) / 2,
    width:  rW,
    height: rH,
  };
}

// ─── SVG: anatomy dots + dashed connector lines ────────────────────────────────
function AnnotationLines({ components, mode, selectedId, hoveredId, targetId, solvedIds, showLabels }) {
  if (!showLabels) return null;
  const solvedSet = new Set(solvedIds);

  return (
    <>
      {components.map((comp) => {
        const [cx, cy] = comp.coords   || [50, 50];
        const [lx, ly] = comp.labelPos || [cx + 18, cy - 12];

        const isSelected = mode === "study" && selectedId === comp.id;
        const isHovered  = mode === "study" && hoveredId  === comp.id;
        const isTarget   = mode === "test"  && targetId   === comp.id;
        const isSolved   = mode === "test"  && solvedSet.has(comp.id);

        let dotColor  = C.idle_dot;
        let lineColor = C.idle_line;
        if (isSelected || isHovered) { dotColor = C.dot;        lineColor = C.line; }
        if (isTarget)                { dotColor = C.target_dot; lineColor = C.target_dot; }
        if (isSolved)                { dotColor = C.correct;    lineColor = C.correct; }

        const prominent = isSelected || isHovered || isTarget || isSolved;
        const dotR   = prominent ? 0.45 : 0.25;
        const lWidth = prominent ? 0.22 : 0.10;
        const opacity = prominent ? 1 : 0.6;

        return (
          <g key={comp.id} opacity={opacity}>
            <line
              x1={cx} y1={cy} x2={lx} y2={ly}
              stroke={lineColor} strokeWidth={lWidth}
              strokeDasharray={isSolved || isSelected ? undefined : "2 1.5"}
            />
            <circle cx={cx} cy={cy} r={dotR} fill={dotColor} />
            <circle cx={lx} cy={ly} r="0.08" fill={lineColor} opacity={0.4} />
          </g>
        );
      })}
    </>
  );
}

// ─── STUDY MODE: clickable label chips ────────────────────────────────────────
function StudyLabelChips({ components, bounds, selectedId, hoveredId, onHover, onClick }) {
  if (!bounds) return null;
  return (
    <>
      {components.map((comp) => {
        const [lx, ly] = comp.labelPos || [50, 40];
        const pxLeft = bounds.left + (lx / 100) * bounds.width;
        const pxTop  = bounds.top  + (ly / 100) * bounds.height;
        const isSelected = selectedId === comp.id;
        const isHovered  = hoveredId  === comp.id;

        let bg = "#1e293b", border = "#334155", color = "#f8fafc";
        let shadow = "0 2px 6px rgba(0,0,0,0.25)";
        if (isSelected) { bg = "#059669"; border = "#10b981"; color = "#ffffff"; shadow = "0 3px 10px rgba(5,150,105,0.4)"; }
        else if (isHovered) { bg = "#334155"; border = "#10b981"; color = "#6ee7b7"; shadow = "0 3px 8px rgba(0,0,0,0.3)"; }

        return (
          <div
            key={`s-${comp.id}`}
            onClick={() => onClick(comp)}
            onMouseEnter={() => onHover(comp.id)}
            onMouseLeave={() => onHover(null)}
            className="absolute cursor-pointer transition-all duration-150"
            style={{
              left: pxLeft, top: pxTop,
              transform: "translate(-50%,-50%)",
              padding: "2px 8px", borderRadius: 5,
              fontSize: 10, fontWeight: 600,
              fontFamily: "Inter, system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: `1px solid ${border}`,
              background: bg, color,
              boxShadow: shadow,
              zIndex: isSelected || isHovered ? 20 : 10,
              userSelect: "none",
            }}
          >
            {comp.label}
          </div>
        );
      })}
    </>
  );
}

// ─── QUIZ MODE: empty/solved boxes at label positions ─────────────────────────
function QuizLabelBoxes({ components, bounds, targetId, solvedIds }) {
  if (!bounds) return null;
  const solvedSet = new Set(solvedIds);

  const baseStyle = {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    padding: "2px 10px",
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
    whiteSpace: "nowrap",
    userSelect: "none",
    boxSizing: "border-box",
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <>
      {components.map((comp) => {
        const [lx, ly] = comp.labelPos || [50, 40];
        const pxLeft = bounds.left + (lx / 100) * bounds.width;
        const pxTop  = bounds.top  + (ly / 100) * bounds.height;

        const isTarget = comp.id === targetId;
        const isSolved = solvedSet.has(comp.id);

        if (isSolved) {
          return (
            <div
              key={`qb-${comp.id}`}
              style={{
                ...baseStyle,
                left: pxLeft,
                top: pxTop,
                fontWeight: 700,
                background: "#ecfdf5",
                border: "1.5px solid #059669",
                color: "#065f46",
                boxShadow: "0 1px 5px rgba(5,150,105,0.15)",
                zIndex: 12,
                gap: 4,
              }}
            >
              <CheckCircle2 size={10} style={{ color: "#059669", flexShrink: 0 }} />
              {comp.label}
            </div>
          );
        }

        if (isTarget) {
          return (
            <motion.div
              key={`qb-${comp.id}`}
              animate={{
                opacity: [0.8, 1, 0.8],
                boxShadow: [
                  "0 0 0 2px rgba(217,119,6,0.2)",
                  "0 0 0 6px rgba(217,119,6,0.4)",
                  "0 0 0 2px rgba(217,119,6,0.2)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              style={{
                ...baseStyle,
                left: pxLeft,
                top: pxTop,
                minWidth: 44,
                fontWeight: 700,
                background: "#fffbeb",
                border: "1.5px dashed #d97706",
                color: "#92400e",
                zIndex: 15,
              }}
            >
              ?
            </motion.div>
          );
        }

        // Empty unsolved box
        return (
          <div
            key={`qb-${comp.id}`}
            style={{
              ...baseStyle,
              left: pxLeft,
              top: pxTop,
              minWidth: 44,
              background: "#f1f5f9",
              border: "1.5px dashed #475569",
              color: "transparent",
              zIndex: 10,
            }}
          >
            ?
          </div>
        );
      })}
    </>
  );
}

// ─── QUIZ MODE: right-side word bank inventory ────────────────────────────────
function QuizInventory({ components, solvedIds, inventoryFeedback, onSelect }) {
  const solvedSet  = new Set(solvedIds);
  const remaining  = components.filter(c => !solvedSet.has(c.id));
  const total      = components.length;
  const solvedCount = total - remaining.length;

  return (
    <div
      className="flex flex-col overflow-hidden shrink-0"
      style={{ width: 172, background: "#f8fafc", borderLeft: "1px solid #e2e8f0" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-3 py-2.5 border-b"
        style={{ background: "#fff", borderColor: "#e2e8f0" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>
          Word Bank
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "#94a3b8" }}>
          {solvedCount} / {total} placed
        </p>
        {/* Progress bar */}
        <div
          className="mt-1.5 h-1 rounded-full overflow-hidden"
          style={{ background: "#e2e8f0" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#059669" }}
            animate={{ width: `${total > 0 ? (solvedCount / total) * 100 : 0}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Scrollable item list */}
      <div className="flex-1 overflow-y-auto p-2" style={{ gap: 5, display: "flex", flexDirection: "column" }}>
        {remaining.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center text-center p-4"
            style={{ color: "#059669", fontSize: 11, fontWeight: 700 }}
          >
            All placed!<br />🎉
          </div>
        ) : (
          remaining.map((comp) => {
            const fb        = inventoryFeedback?.compId === comp.id;
            const fbCorrect = fb && inventoryFeedback.type === "correct";
            const fbWrong   = fb && inventoryFeedback.type === "wrong";

            return (
              <motion.button
                key={comp.id}
                onClick={() => !inventoryFeedback && onSelect(comp)}
                animate={fbWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={fbWrong ? { duration: 0.35 } : {}}
                whileHover={!inventoryFeedback ? { scale: 1.02, y: -1 } : {}}
                whileTap={!inventoryFeedback ? { scale: 0.97 } : {}}
                className="w-full text-left transition-all duration-150"
                style={{
                  padding: "6px 10px",
                  borderRadius: 7,
                  fontSize: 10.5,
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui, sans-serif",
                  cursor: inventoryFeedback ? "default" : "pointer",
                  border: `1.5px solid ${fbCorrect ? "#059669" : fbWrong ? "#dc2626" : "#e2e8f0"}`,
                  background: fbCorrect ? "#ecfdf5" : fbWrong ? "#fef2f2" : "#fff",
                  color: fbCorrect ? "#065f46" : fbWrong ? "#991b1b" : "#334155",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  display: "block",
                }}
              >
                {comp.label}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div
        className="shrink-0 px-3 py-2 border-t text-center"
        style={{ borderColor: "#e2e8f0", background: "#fff" }}
      >
        <p className="text-[9px]" style={{ color: "#94a3b8" }}>
          Click a name to place it on the <span style={{ color: "#d97706", fontWeight: 700 }}>?</span> box
        </p>
      </div>
    </div>
  );
}

// ─── Main DiagramViewer ────────────────────────────────────────────────────────
export default function DiagramViewer({
  topic,
  mode,
  selectedComponent,
  onSelectComponent,
  targetComponent,
  onAnswerSubmit,
  customAssetUrl,
  solvedIds = [],
}) {
  const containerRef = useRef(null);

  const [containerSize,    setContainerSize]    = useState({ w: 900, h: 600 });
  const [imgNatural,       setImgNatural]       = useState(null);
  const [imageLoaded,      setImageLoaded]      = useState(false);
  const [imageError,       setImageError]       = useState(false);
  const [showLabels,       setShowLabels]       = useState(true);
  const [hoveredId,        setHoveredId]        = useState(null);
  // Study mode: click feedback
  const [studyFeedback,    setStudyFeedback]    = useState(null);
  // Quiz mode: inventory selection feedback
  const [inventoryFeedback, setInventoryFeedback] = useState(null);

  // ── Track container size ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Reset on topic / asset change ─────────────────────────────────────────
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setImgNatural(null);
    setStudyFeedback(null);
    setInventoryFeedback(null);
    setHoveredId(null);
  }, [topic?.id, customAssetUrl]);

  // ── Overlay bounds ─────────────────────────────────────────────────────────
  const overlayBounds = useMemo(
    () => computeImageBounds(imgNatural?.w, imgNatural?.h, containerSize.w, containerSize.h),
    [imgNatural, containerSize]
  );

  const handleImgLoad = useCallback((e) => {
    const img = e.currentTarget;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
  }, []);

  // ── Study mode: click chip ─────────────────────────────────────────────────
  const handleStudyClick = useCallback((comp) => {
    onSelectComponent(comp);
  }, [onSelectComponent]);

  // ── Quiz mode: click inventory item ───────────────────────────────────────
  const handleInventorySelect = useCallback((comp) => {
    if (inventoryFeedback || !targetComponent) return;
    const isCorrect = comp.id === targetComponent.id;
    setInventoryFeedback({ compId: comp.id, type: isCorrect ? "correct" : "wrong" });
    setTimeout(() => {
      setInventoryFeedback(null);
      onAnswerSubmit?.(comp.id, isCorrect);
    }, isCorrect ? 600 : 800);
  }, [inventoryFeedback, targetComponent, onAnswerSubmit]);

  if (!topic) return null;

  const components   = topic.components || [];
  const imgSrc       = customAssetUrl || topic.imagePath;
  const selectedId   = selectedComponent?.id ?? null;
  const targetId     = targetComponent?.id    ?? null;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "#f8fafc" }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="h-10 shrink-0 border-b flex items-center justify-end px-4 gap-2"
        style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
      >
        <button
          onClick={() => setShowLabels((p) => !p)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors"
          style={{
            background:  showLabels ? "#ecfdf5" : "#f1f5f9",
            borderColor: showLabels ? "#a7f3d0" : "#e2e8f0",
            color:       showLabels ? "#065f46"  : "#94a3b8",
          }}
        >
          {showLabels ? <Eye size={11} /> : <EyeOff size={11} />}
          {mode === "test" ? "Boxes" : "Labels"}
        </button>
      </div>

      {/* ── Main row: canvas + (quiz inventory) ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ background: "#ffffff" }}
        >
          {/* Loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-400/40 border-t-emerald-500 animate-spin" />
                Loading diagram…
              </div>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <MissingAssetFallback
                missingFilename={topic.fallbackImage}
                topicTitle={topic.title}
                onImageUploaded={() => { setImageError(false); setImageLoaded(true); }}
              />
            </div>
          )}

          {/* Diagram image */}
          {!imageError && (
            <img
              src={imgSrc}
              alt={topic.title}
              onLoad={handleImgLoad}
              onError={() => setImageError(true)}
              style={{
                position:  "absolute",
                left:      overlayBounds ? overlayBounds.left   : "10%",
                top:       overlayBounds ? overlayBounds.top    : "10%",
                width:     overlayBounds ? overlayBounds.width  : "80%",
                height:    overlayBounds ? overlayBounds.height : "80%",
                objectFit: "fill",
                opacity:   imageLoaded && overlayBounds ? 1 : 0,
                transition:"opacity 0.3s",
              }}
            />
          )}

          {/* Annotation SVG: dots + lines */}
          {imageLoaded && overlayBounds && (
            <svg
              style={{
                position:     "absolute",
                left:          overlayBounds.left,
                top:           overlayBounds.top,
                width:         overlayBounds.width,
                height:        overlayBounds.height,
                overflow:      "visible",
                pointerEvents: "none",
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <AnnotationLines
                components={components}
                mode={mode}
                selectedId={selectedId}
                hoveredId={hoveredId}
                targetId={targetId}
                solvedIds={solvedIds}
                showLabels={showLabels}
              />
            </svg>
          )}

          {/* Study mode: clickable label chips */}
          {imageLoaded && overlayBounds && mode === "study" && (
            <StudyLabelChips
              components={components}
              bounds={overlayBounds}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onClick={handleStudyClick}
            />
          )}

          {/* Quiz mode: empty/solved boxes */}
          {imageLoaded && overlayBounds && mode === "test" && (
            <QuizLabelBoxes
              components={components}
              bounds={overlayBounds}
              targetId={targetId}
              solvedIds={solvedIds}
            />
          )}

          {/* Quiz correct-answer pulse ring */}
          <AnimatePresence>
            {inventoryFeedback?.type === "correct" && overlayBounds && (() => {
              const comp = components.find(c => c.id === inventoryFeedback.compId);
              if (!comp) return null;
              const [cx, cy] = comp.coords || [50, 50];
              const pxL = overlayBounds.left + (cx / 100) * overlayBounds.width;
              const pxT = overlayBounds.top  + (cy / 100) * overlayBounds.height;
              return (
                <motion.div
                  key="fb-ring"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: pxL - 8, top: pxT - 8,
                    width: 16, height: 16,
                    border: "2px solid #059669",
                    zIndex: 30,
                  }}
                />
              );
            })()}
          </AnimatePresence>

          {/* Bottom hint bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 flex items-center px-4 text-[10px] border-t"
            style={{ background: "rgba(248,250,252,0.95)", borderColor: "#e2e8f0" }}
          >
            {mode === "study" ? (
              <span className="text-slate-400">
                <span className="font-semibold text-emerald-600">Study:</span>
                &nbsp;Click any label to open its NCERT definition &amp; exam tips.
              </span>
            ) : (
              <span className="text-slate-400">
                <span className="font-semibold text-amber-600">Memory Quiz:</span>
                &nbsp;Pick the name of the{" "}
                <span
                  className="font-bold"
                  style={{ color: "#d97706" }}
                >
                  highlighted ?
                </span>{" "}
                box from the word bank →
              </span>
            )}
          </div>
        </div>

        {/* Quiz inventory panel */}
        {mode === "test" && (
          <QuizInventory
            components={components}
            solvedIds={solvedIds}
            inventoryFeedback={inventoryFeedback}
            onSelect={handleInventorySelect}
          />
        )}
      </div>
    </div>
  );
}
