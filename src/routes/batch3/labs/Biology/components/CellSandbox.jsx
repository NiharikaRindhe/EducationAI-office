import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope, Dna, Zap, Play, Pause, SkipBack, SkipForward,
  RotateCcw, Info, Trash2, ChevronRight, CheckCircle2, AlertCircle,
} from "lucide-react";
import { CLR } from "../constants/bioConstants";
import { CELL_MODES, CELL_TYPES, DIVISION_TYPES, ASEXUAL_TYPES, ORGANELLES, MITOSIS_PHASES, MEIOSIS_PHASES } from "../constants/cellConstants";
import { useCellSimulation } from "../hooks/useCellSimulation";
import InteractiveAnimalCell from "../InteractiveAnimalCell";
import InteractivePlantCell from "../InteractivePlantCell";

// ─── Canvas wrapper ────────────────────────────────────────────────────────────


function BioCanvas({ canvasRef, canvasSize, onResize, onMouseDown, onMouseMove, onMouseUp }) {
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
      className="absolute inset-0 rounded-xl border overflow-hidden"
      style={{ borderColor: CLR.border, background: CLR.bg }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }}
      />
    </div>
  );
}


// ─── Small badge pill ──────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
      style={{ color, borderColor: color + "55", background: color + "11" }}>
      {label}
    </span>
  );
}

// ─── Info card for telemetry / phase info ─────────────────────────────────────
function PhaseCard({ phase, accent }) {
  if (!phase) return null;
  return (
    <motion.div
      key={phase.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ borderColor: accent + "44", background: accent + "0e" }}>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accent }} />
        <span className="text-sm font-bold" style={{ color: accent }}>{phase.label}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: CLR.text }}>{phase.description}</p>
      <p className="text-[10px] leading-relaxed italic" style={{ color: CLR.muted }}>{phase.detail}</p>
    </motion.div>
  );
}

// ─── Organelle palette card ───────────────────────────────────────────────────
function OrganelleCard({ organ, selected, onPlace, cellType }) {
  const validInCell = cellType === CELL_TYPES.ANIMAL ? organ.inAnimal
    : cellType === CELL_TYPES.PLANT ? organ.inPlant
    : organ.inBacterial;

  return (
    <motion.div
      whileHover={validInCell ? { scale: 1.02 } : {}}
      whileTap={validInCell ? { scale: 0.97 } : {}}
      onClick={() => validInCell && onPlace(organ.id)}
      className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all cursor-pointer"
      style={{
        borderColor: validInCell ? (selected ? organ.color : CLR.border) : CLR.border + "44",
        background: selected ? organ.color + "14" : validInCell ? "transparent" : CLR.bg + "88",
        opacity: validInCell ? 1 : 0.38,
        cursor: validInCell ? "pointer" : "not-allowed",
      }}>
      <span className="text-base shrink-0">{organ.emoji}</span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold truncate" style={{ color: validInCell ? organ.color : CLR.muted }}>
          {organ.label}
        </span>
        <span className="text-[9px] truncate leading-tight" style={{ color: CLR.muted }}>
          {organ.description.substring(0, 42)}…
        </span>
      </div>
      {!validInCell && (
        <span className="text-[8px] font-semibold" style={{ color: CLR.muted }}>✗</span>
      )}
    </motion.div>
  );
}


// ─── Helper: canonical organelle center for legend-click selection ring ────────
function getCanonicalOrganelleTarget(organId, cellType, CT, W, H) {
  const cx = W / 2, cy = H / 2;
  if (cellType === CT.ANIMAL) {
    const rx = Math.min(W, H) * 0.36, ry = Math.min(W, H) * 0.30, sc = rx / 160;
    const map = {
      nucleus:      { x: cx - rx * 0.05, y: cy + ry * 0.05,  r: 38 * 1.1 * sc },
      mitochondria: { x: cx - rx * 0.5,  y: cy + ry * 0.35,  r: 42 * 0.9 * sc },
      golgi:        { x: cx + rx * 0.5,  y: cy - ry * 0.35,  r: 36 * 0.8 * sc },
      er_rough:     { x: cx + rx * 0.1,  y: cy + ry * 0.55,  r: 38 * 0.8 * sc },
      er_smooth:    { x: cx + rx * 0.55, y: cy + ry * 0.25,  r: 30 * 0.8 * sc },
      lysosome:     { x: cx - rx * 0.55, y: cy - ry * 0.15,  r: 11 * 0.85 * sc },
      peroxisome:   { x: cx - rx * 0.25, y: cy + ry * 0.4,   r: 10 * 0.85 * sc },
      vacuole:      { x: cx - rx * 0.6,  y: cy + ry * 0.05,  r: 14 * 0.8 * sc },
      ribosome:     { x: cx + 0.3 * rx,  y: cy + 0.65 * ry,  r: 8 },
      cytoplasm:    { x: cx,             y: cy,              r: Math.min(rx, ry) * 0.65 },
      centriole:    { x: cx - rx * 0.45, y: cy - ry * 0.45,  r: 16 * 0.85 * sc },
      microtubule:  { x: cx - rx * 0.32, y: cy - ry * 0.38,  r: 24 * sc },
      cell_membrane:{ x: cx,             y: cy,              r: rx },
    };
    return map[organId] ? { id: organId, ...map[organId] } : null;
  } else if (cellType === CT.PLANT) {
    const rx = Math.min(W, H) * 0.32, ry = Math.min(W, H) * 0.3, sc = rx / 160;
    const map = {
      vacuole:      { x: cx,              y: cy + ry * 0.1,    r: 30 * 1.2 * sc },
      nucleus:      { x: cx - rx * 0.52,  y: cy - ry * 0.45,   r: 38 * 0.95 * sc },
      mitochondria: { x: cx + rx * 0.5,   y: cy - ry * 0.1,    r: 38 * 0.85 * sc },
      golgi:        { x: cx + rx * 0.3,   y: cy - ry * 0.3,    r: 32 * 0.8 * sc },
      chloroplast:  { x: cx - 0.3 * rx,   y: cy + 0.55 * ry,   r: 40 * 0.85 * sc },
      er_rough:     { x: cx - rx * 0.4,   y: cy - ry * 0.15,   r: 30 * sc * 0.75 },
      ribosome:     { x: cx - 0.25 * rx,  y: cy - 0.4 * ry,    r: 8 },
      cell_wall:    { x: cx,              y: cy,               r: rx },
      cell_membrane:{ x: cx,              y: cy,               r: rx },
    };
    return map[organId] ? { id: organId, ...map[organId] } : null;
  } else if (cellType === CT.BACTERIAL) {
    const rx = Math.min(W, H) * 0.28, ry = Math.min(W, H) * 0.18, sc = rx / 130;
    const map = {
      nucleoid:     { x: cx - rx * 0.05,  y: cy,               r: 24 * sc },
      flagella:     { x: cx + rx,          y: cy,               r: 30 },
      plasmid:      { x: cx + rx * 0.5,   y: cy - ry * 0.5,    r: 12 * sc },
      ribosome:     { x: cx - 0.4 * rx,   y: cy - 0.3 * ry,    r: 8 },
      cell_wall:    { x: cx,              y: cy,               r: rx },
      cell_membrane:{ x: cx,              y: cy,               r: rx },
    };
    return map[organId] ? { id: organId, ...map[organId] } : null;
  }
  return null;
}

// ─── Main CellSandbox component ───────────────────────────────────────────────
export default function CellSandbox({ active }) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null); // tracks rendered canvas DOM size
  const [canvasSize, setCanvasSize] = useState({ w: 700, h: 450 });
  const [renderedSize, setRenderedSize] = useState({ w: 700, h: 450 }); // actual CSS pixels
  const [hoveredOrgan, setHoveredOrgan] = useState(null); // for legend tooltip

  const {
    mode, cellType, divisionType, asexualType,
    mitosisPhase, meiosisPhase, divProgress, autoPlay,
    asexProgress, asexAutoPlay,
    placedOrganelles, selectedOrganId, selectedMicroscopeTarget, hoveredOrganelle, feedback,
    setMode, setCellType, setDivisionType, setAsexualType,
    setMitosisPhase, setMeiosisPhase, setDivProgress, setAutoPlay,
    setAsexProgress, setAsexAutoPlay, setSelectedOrganId, setSelectedMicroscopeTarget,
    placeOrganelle, removeOrganelle, clearBuilder,
    stepForward, stepBack, resetDivision, resetAsexual,
    handleMouseDown, handleMouseMove, handleMouseUp,
    MITOSIS_PHASES: MP, MEIOSIS_PHASES: MEP,
    CELL_MODES: CM, CELL_TYPES: CT, DIVISION_TYPES: DT, ASEXUAL_TYPES: AT,
  } = useCellSimulation({ canvasRef, canvasSize, active });

  const accent = "#39d353";
  const currentMitPhase = MP.find(p => p.id === mitosisPhase);
  const currentMeiPhase = MEP.find(p => p.id === meiosisPhase);

  // Track rendered (CSS) canvas size for overlay coordinate mapping
  const handleCanvasResize = useCallback((size) => {
    setCanvasSize(size);
    setRenderedSize(size);
  }, []);

  // Scale factor: canvas logical px → rendered CSS px
  const scaleX = renderedSize.w / canvasSize.w;
  const scaleY = renderedSize.h / canvasSize.h;

  // Callback ref: whenever the canvas element mounts/updates, observe its rendered size
  const canvasContainerCallback = useCallback((node) => {
    canvasContainerRef.current = node;
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) setRenderedSize({ w: width, h: height });
      }
    });
    ro.observe(node);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT PANEL ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-52 shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: CLR.panel, borderColor: CLR.border }}>

        {/* Identity */}
        <div className="px-4 py-4 border-b" style={{ borderColor: CLR.border }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(57,211,83,0.12)" }}>
              <Microscope size={14} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Cell Sandbox</p>
              <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Ch 5, Class 9 & 10</p>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="px-2 py-3 border-b flex flex-col gap-1" style={{ borderColor: CLR.border }}>
          <p className="text-[9px] uppercase tracking-widest font-semibold px-2 mb-1" style={{ color: CLR.muted }}>Mode</p>
          {[
            { id: CM.MICROSCOPE, label: "Microscope View", icon: <Microscope size={12} /> },
            { id: CM.BUILDER,    label: "Cell Builder",    icon: <Zap size={12} /> },
            { id: CM.DIVISION,   label: "Cell Division",   icon: <Dna size={12} /> },
          ].map(m => (
            <motion.button key={m.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setMode(m.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold border transition-colors"
              style={{
                borderColor: mode === m.id ? accent + "55" : "transparent",
                background: mode === m.id ? accent + "14" : "transparent",
                color: mode === m.id ? accent : CLR.muted,
              }}>
              {m.icon} {m.label}
              {mode === m.id && <ChevronRight size={11} className="ml-auto" />}
            </motion.button>
          ))}
        </div>

        {/* Context controls — changes based on mode */}
        <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-3">

          {/* Microscope mode — cell type picker */}
          <AnimatePresence mode="wait">
            {mode === CM.MICROSCOPE && (
              <motion.div key="micro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-1.5">
                <p className="text-[9px] uppercase tracking-widest font-semibold px-1" style={{ color: CLR.muted }}>Cell Type</p>
                {[
                  { id: CT.ANIMAL,    label: "Animal Cell",    emoji: "🐾", sub: "Eukaryote · No wall" },
                  { id: CT.PLANT,     label: "Plant Cell",     emoji: "🌿", sub: "Eukaryote · Has wall + chloroplasts" },
                  { id: CT.BACTERIAL, label: "Bacterial Cell", emoji: "🦠", sub: "Prokaryote · No nucleus" },
                ].map(c => (
                  <button key={c.id} onClick={() => setCellType(c.id)}
                    className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-all"
                    style={{
                      borderColor: cellType === c.id ? accent + "66" : CLR.border,
                      background: cellType === c.id ? accent + "0f" : "transparent",
                    }}>
                    <span className="text-base mt-0.5">{c.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: cellType === c.id ? accent : CLR.text }}>{c.label}</p>
                      <p className="text-[9px] leading-tight" style={{ color: CLR.muted }}>{c.sub}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Builder mode — cell type + help */}
            {mode === CM.BUILDER && (
              <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-2">
                <p className="text-[9px] uppercase tracking-widest font-semibold px-1" style={{ color: CLR.muted }}>Building</p>
                {[CT.ANIMAL, CT.PLANT, CT.BACTERIAL].map(ct => (
                  <button key={ct} onClick={() => setCellType(ct)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all"
                    style={{
                      borderColor: cellType === ct ? accent + "66" : CLR.border,
                      background: cellType === ct ? accent + "0f" : "transparent",
                      color: cellType === ct ? accent : CLR.muted,
                    }}>
                    {ct === CT.ANIMAL ? "🐾 Animal Cell" : ct === CT.PLANT ? "🌿 Plant Cell" : "🦠 Bacterial Cell"}
                  </button>
                ))}
                <p className="text-[9px] mt-1 leading-relaxed" style={{ color: CLR.muted }}>
                  Click organelles on the right panel to place them in the cell. Drag to reposition.
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={clearBuilder}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium mt-1"
                  style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}>
                  <Trash2 size={11} /> Clear Canvas
                </motion.button>
              </motion.div>
            )}

            {/* Division mode — controls */}
            {mode === CM.DIVISION && (
              <motion.div key="division" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-2">
                <p className="text-[9px] uppercase tracking-widest font-semibold px-1" style={{ color: CLR.muted }}>Division Type</p>
                {[
                  { id: DT.MITOSIS, label: "Mitosis",  sub: "→ 2 diploid cells" },
                  { id: DT.MEIOSIS, label: "Meiosis",  sub: "→ 4 haploid gametes" },
                  { id: DT.ASEXUAL, label: "Asexual",  sub: "No fertilisation" },
                ].map(d => (
                  <button key={d.id} onClick={() => { setDivisionType(d.id); resetDivision(); }}
                    className="w-full text-left flex flex-col px-2.5 py-2 rounded-lg border transition-all"
                    style={{
                      borderColor: divisionType === d.id ? accent + "66" : CLR.border,
                      background: divisionType === d.id ? accent + "0f" : "transparent",
                    }}>
                    <span className="text-xs font-semibold" style={{ color: divisionType === d.id ? accent : CLR.text }}>{d.label}</span>
                    <span className="text-[9px]" style={{ color: CLR.muted }}>{d.sub}</span>
                  </button>
                ))}

                {/* Asexual sub-type */}
                {divisionType === DT.ASEXUAL && (
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[9px] uppercase tracking-widest font-semibold px-1" style={{ color: CLR.muted }}>Organism</p>
                    {[
                      { id: AT.FISSION,      label: "Binary Fission", emoji: "🦠" },
                      { id: AT.BUDDING,      label: "Budding (Hydra)", emoji: "🌱" },
                      { id: AT.REGENERATION, label: "Regeneration",    emoji: "🪱" },
                    ].map(a => (
                      <button key={a.id}
                        onClick={() => { setAsexualType(a.id); resetAsexual(); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border text-left transition-all"
                        style={{
                          borderColor: asexualType === a.id ? "#bd93f9" + "66" : CLR.border,
                          background: asexualType === a.id ? "#bd93f9" + "10" : "transparent",
                          color: asexualType === a.id ? "#bd93f9" : CLR.muted,
                        }}>
                        {a.emoji} {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── CENTER AREA ───────────────────────────────────────────────────────── */}
      {mode === CM.MICROSCOPE ? (
        <div className="flex-1 flex items-center justify-center p-5 overflow-y-auto">
          {cellType === CT.ANIMAL ? <InteractiveAnimalCell /> : <InteractivePlantCell />}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden p-4 gap-3">

          {/* Canvas + delete overlays wrapper */}
        <div className="flex-1 min-h-0 relative" ref={canvasContainerCallback}>
          <BioCanvas
            canvasRef={canvasRef}
            canvasSize={canvasSize}
            onResize={handleCanvasResize}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />

          {/* ── Per-organelle delete overlays (Builder mode only) ── */}
          <AnimatePresence>
            {mode === CM.BUILDER && placedOrganelles.map(p => {
              const isHovered = hoveredOrganelle === p.uid;
              const organ = ORGANELLES.find(o => o.id === p.id);
              // Map canvas logical coords → rendered CSS coords
              const sx = p.x * (renderedSize.w / canvasSize.w);
              const sy = p.y * (renderedSize.h / canvasSize.h);

              return (
                <AnimatePresence key={p.uid}>
                  {isHovered && (
                    <motion.button
                      key={`del-${p.uid}`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOrganelle(p.uid);
                      }}
                      title={`Remove ${organ?.label}`}
                      className="absolute flex items-center justify-center rounded-full shadow-lg pointer-events-auto"
                      style={{
                        // Position the button at top-right of the organelle
                        left: sx + 18,
                        top:  sy - 28,
                        width: 22,
                        height: 22,
                        background: "#f47067",
                        border: "2px solid #0d1117",
                        color: "#0d1117",
                        cursor: "pointer",
                        zIndex: 20,
                        boxShadow: "0 0 0 3px rgba(244,112,103,0.3)",
                      }}
                    >
                      <Trash2 size={11} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Division controls bar */}
        {mode === CM.DIVISION && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ borderColor: CLR.border, background: CLR.panel }}>

            {divisionType !== DT.ASEXUAL ? (
              <>
                {/* Phase progress dots */}
                <div className="flex items-center gap-1 flex-1">
                  {(divisionType === DT.MITOSIS ? MP : MEP).map((ph, i) => {
                    const isActive = (divisionType === DT.MITOSIS ? mitosisPhase : meiosisPhase) === ph.id;
                    const isPast = (divisionType === DT.MITOSIS ? MP : MEP).findIndex(p => p.id === (divisionType === DT.MITOSIS ? mitosisPhase : meiosisPhase)) > i;
                    return (
                      <motion.button key={ph.id}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          if (divisionType === DT.MITOSIS) setMitosisPhase(ph.id);
                          else setMeiosisPhase(ph.id);
                          setDivProgress(0);
                        }}
                        className="flex flex-col items-center gap-0.5">
                        <span className="w-2.5 h-2.5 rounded-full transition-all"
                          style={{ background: isActive ? ph.color : isPast ? ph.color + "55" : CLR.border }} />
                        <span className="text-[8px] whitespace-nowrap hidden sm:block"
                          style={{ color: isActive ? ph.color : CLR.muted }}>
                          {ph.label.split(" ")[0]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-1.5">
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={stepBack}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: CLR.border, color: CLR.muted }}>
                    <SkipBack size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={() => setAutoPlay(p => !p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: autoPlay ? "#f47067" : accent, color: "#0d1117" }}>
                    {autoPlay ? <Pause size={14} /> : <Play size={14} />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={stepForward}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: CLR.border, color: CLR.muted }}>
                    <SkipForward size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={resetDivision}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: CLR.border, color: CLR.muted }}>
                    <RotateCcw size={12} />
                  </motion.button>
                </div>
              </>
            ) : (
              // Asexual controls
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: CLR.border }}>
                  <motion.div className="h-full rounded-full" style={{ width: `${asexProgress * 100}%`, background: "#bd93f9" }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={() => setAsexAutoPlay(p => !p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: asexAutoPlay ? "#f47067" : "#bd93f9", color: "#0d1117" }}>
                    {asexAutoPlay ? <Pause size={14} /> : <Play size={14} />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={resetAsexual}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: CLR.border, color: CLR.muted }}>
                    <RotateCcw size={12} />
                  </motion.button>
                  <span className="text-xs" style={{ color: CLR.muted }}>
                    {(asexProgress * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Feedback toast */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold z-50 shadow-xl"
              style={{ background: feedback.ok ? "#39d35322" : "#f4706722", border: `1px solid ${feedback.ok ? "#39d353" : "#f47067"}`, color: feedback.ok ? "#39d353" : "#f47067" }}>
              {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────────── */}
      {(mode !== CM.MICROSCOPE) && (
        <div className="w-64 shrink-0 border-l flex flex-col overflow-hidden"
          style={{ borderColor: CLR.border, background: CLR.panel }}>

        <AnimatePresence mode="wait">

          {mode === CM.MICROSCOPE && (
            <motion.div key="micro-right"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col overflow-y-auto h-full">
              <div className="px-4 py-3 border-b" style={{ borderColor: CLR.border }}>
                <p className="text-xs font-bold" style={{ color: CLR.text }}>Organelle Legend</p>
                <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>
                  {cellType === CT.ANIMAL ? "Animal Cell (Eukaryote)" : cellType === CT.PLANT ? "Plant Cell (Eukaryote)" : "Bacterial Cell (Prokaryote)"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 p-3 overflow-y-auto">
                {ORGANELLES.filter(o =>
                  (cellType === CT.ANIMAL && o.inAnimal) ||
                  (cellType === CT.PLANT && o.inPlant) ||
                  (cellType === CT.BACTERIAL && o.inBacterial)
                ).map(organ => {
                  const isSelected = selectedOrganId === organ.id;
                  const isHovered = hoveredOrgan === organ.id;
                  
                  return (
                    <motion.div key={organ.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onHoverStart={() => setHoveredOrgan(organ.id)}
                      onHoverEnd={() => setHoveredOrgan(null)}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedOrganId(null);
                          setSelectedMicroscopeTarget(null);
                          return;
                        }
                        setSelectedOrganId(organ.id);
                        const W = canvasSize.w, H = canvasSize.h;
                        setSelectedMicroscopeTarget(getCanonicalOrganelleTarget(organ.id, cellType, CT, W, H));
                      }}
                      className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5 border transition-all cursor-pointer"
                      style={{
                        borderColor: isSelected ? organ.color : isHovered ? organ.color + "55" : CLR.border,
                        background: isSelected ? organ.color + "14" : isHovered ? organ.color + "0a" : "transparent",
                        boxShadow: isSelected ? `0 0 0 1px ${organ.color}33` : "none",
                      }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: organ.color }} />
                          <span className="text-xs font-semibold" style={{ color: organ.color }}>{organ.label}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded leading-none shrink-0"
                            style={{ background: organ.color + "22", color: organ.color }}>
                            Active
                          </span>
                        )}
                      </div>
                      {(isHovered || isSelected) && (
                        <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
                          <p className="text-[10px] leading-relaxed" style={{ color: CLR.text }}>{organ.description}</p>
                          <p className="text-[9px] mt-0.5 italic leading-relaxed" style={{ color: CLR.muted }}>💡 {organ.fact}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* BUILDER RIGHT: organelle palette */}
          {mode === CM.BUILDER && (
            <motion.div key="builder-right"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col overflow-hidden h-full">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: CLR.border }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: CLR.text }}>Organelle Palette</p>
                  <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Click to place · Drag to move</p>
                </div>
                <Badge label={`${placedOrganelles.length} placed`} color={accent} />
              </div>
              <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
                {ORGANELLES.map(organ => (
                  <OrganelleCard key={organ.id}
                    organ={organ}
                    cellType={cellType}
                    onPlace={placeOrganelle}
                  />
                ))}
              </div>
              {/* Placed organelles list */}
              {placedOrganelles.length > 0 && (
                <div className="border-t p-2 flex flex-col gap-1" style={{ borderColor: CLR.border }}>
                  <p className="text-[9px] uppercase tracking-widest font-semibold px-1" style={{ color: CLR.muted }}>Placed</p>
                  <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
                    {placedOrganelles.map(p => {
                      const o = ORGANELLES.find(o => o.id === p.id);
                      return (
                        <div key={p.uid} className="flex items-center justify-between px-2 py-1 rounded-md"
                          style={{ background: CLR.bg }}>
                          <span className="text-[10px] flex items-center gap-1.5" style={{ color: CLR.muted }}>
                            <span style={{ color: o?.color }}>{o?.emoji}</span>
                            {o?.label}
                          </span>
                          <button onClick={() => removeOrganelle(p.uid)}
                            className="text-xs" style={{ color: "#f47067" }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* DIVISION RIGHT: phase info card */}
          {mode === CM.DIVISION && (
            <motion.div key="division-right"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col overflow-hidden h-full">
              <div className="px-4 py-3 border-b" style={{ borderColor: CLR.border }}>
                <p className="text-xs font-bold" style={{ color: CLR.text }}>
                  {divisionType === DT.MITOSIS ? "Mitosis" : divisionType === DT.MEIOSIS ? "Meiosis" : "Asexual Reproduction"}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>
                  {divisionType === DT.MITOSIS ? "2 diploid, identical daughter cells"
                    : divisionType === DT.MEIOSIS ? "4 haploid, unique gametes"
                    : "No fertilisation required"}
                </p>
              </div>
              <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                  {divisionType === DT.MITOSIS && currentMitPhase && (
                    <PhaseCard key={currentMitPhase.id} phase={currentMitPhase} accent={currentMitPhase.color} />
                  )}
                  {divisionType === DT.MEIOSIS && currentMeiPhase && (
                    <PhaseCard key={currentMeiPhase.id} phase={currentMeiPhase} accent={currentMeiPhase.color} />
                  )}
                  {divisionType === DT.ASEXUAL && (
                    <motion.div key="asexual-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <PhaseCard
                        phase={{
                          id: "asexual",
                          label: asexualType === AT.FISSION ? "Binary Fission" : asexualType === AT.BUDDING ? "Budding" : "Regeneration",
                          description: asexualType === AT.FISSION
                            ? "The parent cell elongates and splits into two identical daughter cells. Common in bacteria and Amoeba."
                            : asexualType === AT.BUDDING
                            ? "A new organism grows as an outgrowth (bud) from the parent. The bud eventually detaches. Common in Hydra and yeast."
                            : "If a Planaria flatworm is cut, each piece grows into a complete organism using totipotent cells. Common in lower organisms.",
                          detail: asexualType === AT.FISSION
                            ? "Requires no mate. All offspring are genetically identical to parent — a clone."
                            : asexualType === AT.BUDDING
                            ? "The bud contains a nucleus derived from the parent by mitosis."
                            : "Regeneration uses stem cells (neoblasts) that can differentiate into any cell type.",
                        }}
                        accent="#bd93f9"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comparison summary box */}
                <div className="rounded-xl border p-3 flex flex-col gap-2 mt-auto"
                  style={{ borderColor: CLR.border, background: CLR.bg }}>
                  <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Quick Compare</p>
                  {[
                    ["Mitosis", "2 diploid", "Growth, repair", "#39d353"],
                    ["Meiosis", "4 haploid", "Gametes (sex cells)", "#bd93f9"],
                    ["Asexual", "Clones", "No variation", "#58a6ff"],
                  ].map(([name, result, purpose, c]) => (
                    <div key={name} className="flex items-start gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: c }} />
                      <div>
                        <span className="font-semibold" style={{ color: c }}>{name}</span>
                        <span style={{ color: CLR.muted }}> → {result} · {purpose}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
