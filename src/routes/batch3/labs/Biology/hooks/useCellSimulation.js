import { useRef, useCallback, useEffect, useState } from "react";
import { CELL_MODES, CELL_TYPES, DIVISION_TYPES, ASEXUAL_TYPES, MITOSIS_PHASES, MEIOSIS_PHASES } from "../constants/cellConstants";
import { drawMicroscopeCell, drawMitosis, drawMeiosis, drawAsexual, drawBuilderCell } from "../utils/cellDrawing";

export function useCellSimulation({ canvasRef, canvasSize, active }) {
  // ─── Mode / view state ──────────────────────────────────────────────────────
  const [mode,          setMode]          = useState(CELL_MODES.MICROSCOPE);
  const [cellType,      setCellType]      = useState(CELL_TYPES.ANIMAL);
  const [divisionType,  setDivisionType]  = useState(DIVISION_TYPES.MITOSIS);
  const [asexualType,   setAsexualType]   = useState(ASEXUAL_TYPES.FISSION);

  // ─── Division animation state ───────────────────────────────────────────────
  const [mitosisPhase,  setMitosisPhase]  = useState("interphase");
  const [meiosisPhase,  setMeiosisPhase]  = useState("prophase1");
  const [divProgress,   setDivProgress]   = useState(0);   // 0–1 within current phase
  const [autoPlay,      setAutoPlay]      = useState(false);
  const [asexProgress,  setAsexProgress]  = useState(0);
  const [asexAutoPlay,  setAsexAutoPlay]  = useState(false);

  // ─── Builder state ──────────────────────────────────────────────────────────
  const [placedOrganelles,  setPlacedOrganelles]  = useState([]);
  // selectedMicroscopeTarget stores { id, x, y, r } of the clicked organelle (or null)
  const [selectedOrganId,   setSelectedOrganId]   = useState(null); // kept for builder compat
  const [selectedMicroscopeTarget, setSelectedMicroscopeTarget] = useState(null);
  const [hoveredOrganelle,  setHoveredOrganelle]  = useState(null);
  const [draggingOrganelle, setDraggingOrganelle] = useState(null);
  const [dragOffset,        setDragOffset]         = useState({ x: 0, y: 0 });
  const [builderScore,      setBuilderScore]       = useState({ correct: 0, total: 0 });
  const [feedback,          setFeedback]           = useState(null); // { msg, ok }

  // ─── RAF loop ───────────────────────────────────────────────────────────────
  const rafRef   = useRef(null);
  const startRef = useRef(null);
  const tRef     = useRef(0);

  // Sync refs for RAF closure
  const modeRef         = useRef(mode);
  const cellTypeRef     = useRef(cellType);
  const divTypeRef      = useRef(divisionType);
  const asexTypeRef     = useRef(asexualType);
  const mitPhaseRef     = useRef(mitosisPhase);
  const meiPhaseRef     = useRef(meiosisPhase);
  const divProgressRef  = useRef(divProgress);
  const autoPlayRef     = useRef(autoPlay);
  const asexProgressRef = useRef(asexProgress);
  const asexAutoRef     = useRef(asexAutoPlay);
  const placedRef       = useRef(placedOrganelles);
  const hoveredRef      = useRef(hoveredOrganelle);
  const selectedOrganIdRef = useRef(selectedOrganId);
  const selectedMicroscopeTargetRef = useRef(selectedMicroscopeTarget);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { cellTypeRef.current = cellType; }, [cellType]);
  useEffect(() => { divTypeRef.current = divisionType; }, [divisionType]);
  useEffect(() => { asexTypeRef.current = asexualType; }, [asexualType]);
  useEffect(() => { mitPhaseRef.current = mitosisPhase; }, [mitosisPhase]);
  useEffect(() => { meiPhaseRef.current = meiosisPhase; }, [meiosisPhase]);
  useEffect(() => { divProgressRef.current = divProgress; }, [divProgress]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => { asexProgressRef.current = asexProgress; }, [asexProgress]);
  useEffect(() => { asexAutoRef.current = asexAutoPlay; }, [asexAutoPlay]);
  useEffect(() => { placedRef.current = placedOrganelles; }, [placedOrganelles]);
  useEffect(() => { hoveredRef.current = hoveredOrganelle; }, [hoveredOrganelle]);
  useEffect(() => { selectedOrganIdRef.current = selectedOrganId; }, [selectedOrganId]);
  useEffect(() => { selectedMicroscopeTargetRef.current = selectedMicroscopeTarget; }, [selectedMicroscopeTarget]);

  // Reset selected organelle when switching mode or cellType
  useEffect(() => {
    setSelectedOrganId(null);
    setSelectedMicroscopeTarget(null);
    setHoveredOrganelle(null);
  }, [mode, cellType]);

  const mitPhases = MITOSIS_PHASES.map(p => p.id);
  const meiPhases = MEIOSIS_PHASES.map(p => p.id);

  const loop = useCallback((ts) => {
    if (!startRef.current) startRef.current = ts;
    const dt = (ts - startRef.current) / 1000;
    startRef.current = ts;
    tRef.current += dt;
    const t = tRef.current;

    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
    const ctx = canvas.getContext("2d");
    const W = canvasSize.w, H = canvasSize.h;
    canvas.width = W; canvas.height = H;

    const currentMode = modeRef.current;

    if (currentMode === CELL_MODES.MICROSCOPE) {
      drawMicroscopeCell(ctx, W, H, cellTypeRef.current, selectedMicroscopeTargetRef.current, t);

    } else if (currentMode === CELL_MODES.DIVISION) {
      const dType = divTypeRef.current;
      if (dType === DIVISION_TYPES.MITOSIS) {
        drawMitosis(ctx, W, H, mitPhaseRef.current, divProgressRef.current, t);
        if (autoPlayRef.current) {
          const newProg = divProgressRef.current + dt * 0.25;
          if (newProg >= 1) {
            const idx = mitPhases.indexOf(mitPhaseRef.current);
            if (idx < mitPhases.length - 1) {
              setMitosisPhase(mitPhases[idx + 1]);
              setDivProgress(0);
            } else {
              setAutoPlay(false);
              setDivProgress(1);
            }
          } else {
            setDivProgress(newProg);
          }
        }
      } else if (dType === DIVISION_TYPES.MEIOSIS) {
        drawMeiosis(ctx, W, H, meiPhaseRef.current, divProgressRef.current, t);
        if (autoPlayRef.current) {
          const newProg = divProgressRef.current + dt * 0.22;
          if (newProg >= 1) {
            const idx = meiPhases.indexOf(meiPhaseRef.current);
            if (idx < meiPhases.length - 1) {
              setMeiosisPhase(meiPhases[idx + 1]);
              setDivProgress(0);
            } else {
              setAutoPlay(false);
              setDivProgress(1);
            }
          } else {
            setDivProgress(newProg);
          }
        }
      } else {
        // Asexual
        drawAsexual(ctx, W, H, asexTypeRef.current, asexProgressRef.current, t);
        if (asexAutoRef.current) {
          const newProg = asexProgressRef.current + dt * 0.18;
          if (newProg >= 1) {
            setAsexAutoPlay(false);
            setAsexProgress(1);
          } else {
            setAsexProgress(newProg);
          }
        }
      }
    } else if (currentMode === CELL_MODES.BUILDER) {
      drawBuilderCell(ctx, W, H, cellTypeRef.current, placedRef.current, hoveredRef.current, t);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef, canvasSize]);

  useEffect(() => {
    if (!active) return;
    startRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, loop]);

  // ─── Builder interactions ────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (modeRef.current === CELL_MODES.MICROSCOPE) {
      const W = canvasSize.w, H = canvasSize.h;
      const hit = getMicroscopeOrganelleAt(mx, my, cellTypeRef.current, W, H);
      setSelectedOrganId(hit ? hit.id : null);
      setSelectedMicroscopeTarget(hit);
      return;
    }

    if (modeRef.current !== CELL_MODES.BUILDER) return;

    // Check if clicked on existing organelle
    const hit = placedRef.current.findLast(p => {
      const dx = mx - p.x, dy = my - p.y;
      return Math.sqrt(dx * dx + dy * dy) < 40;
    });
    if (hit) {
      setDraggingOrganelle(hit.uid);
      setDragOffset({ x: mx - hit.x, y: my - hit.y });
    }
  }, [canvasRef, canvasSize]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (modeRef.current === CELL_MODES.MICROSCOPE) {
      const W = canvasSize.w, H = canvasSize.h;
      const hit = getMicroscopeOrganelleAt(mx, my, cellTypeRef.current, W, H);
      setHoveredOrganelle(hit ? hit.id : null);
      return;
    }

    if (modeRef.current !== CELL_MODES.BUILDER) return;

    if (draggingOrganelle) {
      setPlacedOrganelles(prev => prev.map(p =>
        p.uid === draggingOrganelle ? { ...p, x: mx - dragOffset.x, y: my - dragOffset.y } : p
      ));
      return;
    }
    // Hover detection
    const hit = placedRef.current.findLast(p => {
      const dx = mx - p.x, dy = my - p.y;
      return Math.sqrt(dx * dx + dy * dy) < 40;
    });
    setHoveredOrganelle(hit?.uid ?? null);
  }, [draggingOrganelle, dragOffset, canvasRef, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setDraggingOrganelle(null);
  }, []);

  // ─── Builder: place organelle at canvas center area ─────────────────────────
  const placeOrganelle = useCallback((organelleId) => {
    const W = canvasSize.w, H = canvasSize.h;
    // Place in the middle with small random offset
    const x = W / 2 + (Math.random() - 0.5) * W * 0.3;
    const y = H / 2 + (Math.random() - 0.5) * H * 0.3;
    const uid = `${organelleId}_${Date.now()}`;
    setPlacedOrganelles(prev => [...prev, { uid, id: organelleId, x, y, scale: 1, large: organelleId === "vacuole" }]);
    setFeedback({ msg: `Placed ${organelleId.replace("_", " ")}!`, ok: true });
    setTimeout(() => setFeedback(null), 1500);
  }, [canvasSize]);

  const removeOrganelle = useCallback((uid) => {
    setPlacedOrganelles(prev => prev.filter(p => p.uid !== uid));
    setHoveredOrganelle(null);
  }, []);

  const clearBuilder = useCallback(() => {
    setPlacedOrganelles([]);
    setFeedback(null);
  }, []);

  // ─── Division controls ───────────────────────────────────────────────────────
  const stepForward = useCallback(() => {
    const dType = divTypeRef.current;
    if (dType === DIVISION_TYPES.MITOSIS) {
      const idx = mitPhases.indexOf(mitPhaseRef.current);
      if (idx < mitPhases.length - 1) { setMitosisPhase(mitPhases[idx + 1]); setDivProgress(0); }
    } else if (dType === DIVISION_TYPES.MEIOSIS) {
      const idx = meiPhases.indexOf(meiPhaseRef.current);
      if (idx < meiPhases.length - 1) { setMeiosisPhase(meiPhases[idx + 1]); setDivProgress(0); }
    }
  }, []);

  const stepBack = useCallback(() => {
    const dType = divTypeRef.current;
    if (dType === DIVISION_TYPES.MITOSIS) {
      const idx = mitPhases.indexOf(mitPhaseRef.current);
      if (idx > 0) { setMitosisPhase(mitPhases[idx - 1]); setDivProgress(0); }
    } else if (dType === DIVISION_TYPES.MEIOSIS) {
      const idx = meiPhases.indexOf(meiPhaseRef.current);
      if (idx > 0) { setMeiosisPhase(meiPhases[idx - 1]); setDivProgress(0); }
    }
  }, []);

  const resetDivision = useCallback(() => {
    setMitosisPhase("interphase");
    setMeiosisPhase("prophase1");
    setDivProgress(0);
    setAutoPlay(false);
    setAsexProgress(0);
    setAsexAutoPlay(false);
  }, []);

  const resetAsexual = useCallback(() => {
    setAsexProgress(0);
    setAsexAutoPlay(false);
  }, []);

  return {
    // State
    mode, cellType, divisionType, asexualType,
    mitosisPhase, meiosisPhase, divProgress, autoPlay,
    asexProgress, asexAutoPlay,
    placedOrganelles, selectedOrganId, selectedMicroscopeTarget, hoveredOrganelle, feedback,
    // Setters
    setMode, setCellType, setDivisionType, setAsexualType,
    setMitosisPhase, setMeiosisPhase, setDivProgress, setAutoPlay,
    setAsexProgress, setAsexAutoPlay, setSelectedOrganId, setSelectedMicroscopeTarget,
    // Actions
    placeOrganelle, removeOrganelle, clearBuilder,
    stepForward, stepBack, resetDivision, resetAsexual,
    // Canvas handlers
    handleMouseDown, handleMouseMove, handleMouseUp,
    // Constants
    MITOSIS_PHASES, MEIOSIS_PHASES, CELL_MODES, CELL_TYPES, DIVISION_TYPES, ASEXUAL_TYPES,
  };
}

function getMicroscopeOrganelleAt(mx, my, cellType, W, H) {
  const cx = W / 2, cy = H / 2;

  if (cellType === "animal") {
    const rx = Math.min(W, H) * 0.36, ry = Math.min(W, H) * 0.30;
    const sc = rx / 160;

    const targets = [
      { id: "nucleus",      x: cx - rx * 0.05,    y: cy + ry * 0.05,      r: 38 * 1.1 * sc },
      { id: "mitochondria", x: cx - rx * 0.5,     y: cy + ry * 0.35,      r: 42 * 0.9 * sc },
      { id: "mitochondria", x: cx + rx * 0.55,    y: cy - ry * 0.65,      r: 42 * 0.85 * sc },
      { id: "mitochondria", x: cx - rx * 0.05,    y: cy - ry * 0.7,       r: 42 * 0.85 * sc },
      { id: "golgi",        x: cx + rx * 0.5,     y: cy - ry * 0.35,      r: 36 * 0.8 * sc },
      { id: "er_rough",     x: cx + rx * 0.1,     y: cy + ry * 0.55,      r: 38 * 0.8 * sc },
      { id: "er_smooth",    x: cx + rx * 0.55,    y: cy + ry * 0.25,      r: 30 * 0.8 * sc },
      { id: "lysosome",     x: cx - rx * 0.55,    y: cy - ry * 0.15,      r: 11 * 0.85 * sc },
      { id: "lysosome",     x: cx + rx * 0.1,     y: cy - ry * 0.55,      r: 11 * 0.85 * sc },
      { id: "peroxisome",   x: cx - rx * 0.25,    y: cy + ry * 0.4,       r: 10 * 0.85 * sc },
      { id: "vacuole",      x: cx - rx * 0.6,     y: cy + ry * 0.05,      r: 14 * 0.8 * sc },
      { id: "centriole",    x: cx - rx * 0.45,    y: cy - ry * 0.45,      r: 16 * 0.85 * sc },
      { id: "microtubule",  x: cx - rx * 0.32,    y: cy - ry * 0.38,      r: 24 * sc },
      { id: "ribosome",     x: cx + 0.3 * rx,     y: cy + 0.65 * ry,      r: 8 },
      { id: "ribosome",     x: cx - 0.15 * rx,    y: cy + 0.7 * ry,       r: 8 },
      { id: "ribosome",     x: cx + 0.7 * rx,     y: cy + 0.45 * ry,      r: 8 },
      { id: "ribosome",     x: cx - 0.7 * rx,     y: cy + 0.2 * ry,       r: 8 },
    ];

    for (const t of targets) {
      const dx = mx - t.x, dy = my - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.r + 8) return t;
    }

    // Boundary check fallback: cell membrane
    const val = ((mx - cx) / rx) ** 2 + ((my - cy) / ry) ** 2;
    if (val >= 0.88 && val <= 1.12) {
      return { id: "cell_membrane", x: cx, y: cy, r: rx };
    }
  } else if (cellType === "plant") {
    const rx = Math.min(W, H) * 0.32, ry = Math.min(W, H) * 0.3;
    const sc = rx / 160;

    const targets = [
      { id: "vacuole",      x: cx,                 y: cy + ry * 0.1,       r: 30 * 1.2 * sc },
      { id: "nucleus",      x: cx - rx * 0.52,     y: cy - ry * 0.45,      r: 38 * 0.95 * sc },
      { id: "mitochondria", x: cx + rx * 0.5,      y: cy - ry * 0.1,       r: 38 * 0.85 * sc },
      { id: "golgi",        x: cx + rx * 0.3,      y: cy - ry * 0.3,       r: 32 * 0.8 * sc },
      { id: "er_rough",     x: cx - rx * 0.4,      y: cy - ry * 0.15,      r: 30 * sc * 0.75 },
      { id: "chloroplast",  x: cx - 0.3 * rx,      y: cy + 0.55 * ry,      r: 40 * 0.85 * sc },
      { id: "chloroplast",  x: cx + 0.4 * rx,      y: cy - 0.5 * ry,       r: 40 * 0.85 * sc },
      { id: "chloroplast",  x: cx + 0.6 * rx,      y: cy + 0.3 * ry,       r: 40 * 0.85 * sc },
      { id: "chloroplast",  x: cx - 0.55 * rx,     y: cy + 0.2 * ry,       r: 40 * 0.85 * sc },
      { id: "ribosome",     x: cx - 0.25 * rx,     y: cy - 0.4 * ry,       r: 8 },
      { id: "ribosome",     x: cx + 0.1 * rx,      y: cy - 0.45 * ry,      r: 8 },
      { id: "ribosome",     x: cx + 0.5 * rx,      y: cy - 0.4 * ry,       r: 8 },
      { id: "ribosome",     x: cx - 0.45 * rx,     y: cy - 0.1 * ry,       r: 8 },
    ];

    for (const t of targets) {
      const dx = mx - t.x, dy = my - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.r + 8) return t;
    }

    // Boundary check fallback: cell wall vs cell membrane
    const dx = Math.abs(mx - cx), dy = Math.abs(my - cy);
    if (dx <= rx + 14 && dy <= ry + 14) {
      if (dx >= rx + 3 || dy >= ry + 3) {
        return { id: "cell_wall", x: cx, y: cy, r: rx };
      }
      if (dx >= rx - 7 || dy >= ry - 7) {
        return { id: "cell_membrane", x: cx, y: cy, r: rx };
      }
    }
  } else if (cellType === "bacterial") {
    const rx = Math.min(W, H) * 0.28, ry = Math.min(W, H) * 0.18;
    const sc = rx / 130;

    const targets = [
      { id: "nucleoid",     x: cx - rx * 0.05,     y: cy,                  r: 24 * sc },
      { id: "flagella",     x: cx + rx,            y: cy,                  r: 30 },
      { id: "plasmid",      x: cx + rx * 0.5,      y: cy - ry * 0.5,       r: 12 * sc },
      { id: "ribosome",     x: cx - 0.4 * rx,      y: cy - 0.3 * ry,       r: 8 },
      { id: "ribosome",     x: cx + 0.3 * rx,      y: cy - 0.4 * ry,       r: 8 },
      { id: "ribosome",     x: cx + 0.5 * rx,      y: cy + 0.3 * ry,       r: 8 },
      { id: "ribosome",     x: cx - 0.3 * rx,      y: cy + 0.5 * ry,       r: 8 },
      { id: "ribosome",     x: cx + 0.0 * rx,      y: cy + 0.5 * ry,       r: 8 },
    ];

    for (const t of targets) {
      const dx = mx - t.x, dy = my - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.r + 8) return t;
    }

    // Boundary check fallback: cell wall vs cell membrane
    const dx = Math.abs(mx - cx), dy = Math.abs(my - cy);
    if (dx <= rx + 14 && dy <= ry + 14) {
      if (dx >= rx + 3 || dy >= ry + 3) {
        return { id: "cell_wall", x: cx, y: cy, r: rx };
      }
      if (dx >= rx - 7 || dy >= ry - 7) {
        return { id: "cell_membrane", x: cx, y: cy, r: rx };
      }
    }
  }
  return null;
}
