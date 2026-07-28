import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Aperture, Sliders } from "lucide-react";
import { CLR } from "./constants/hubConstants";
import { CLR_O, OPTIC_MODES, COMPONENTS, EYE_DEFECTS } from "./constants/opticsConstants";
import { useOpticsLab } from "./hooks/useOpticsLab";
import LabCanvas    from "./components/LabCanvas";
import HubSection   from "./components/HubSection";
import HubSliderRow from "./components/HubSliderRow";

import FormulaOverlay from "../FormulaOverlay";

function TelCard({ label, value, unit, accent }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg px-4 py-3 border"
      style={{ background: CLR.panel, borderColor: CLR.border }}>
      <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>{label}</span>
      <span className="text-lg font-mono font-bold tabular-nums" style={{ color: accent || CLR.text }}>
        {value}{unit && <span className="text-sm font-normal ml-1.5" style={{ color: CLR.muted }}>{unit}</span>}
      </span>
    </div>
  );
}

const COMPONENT_OPTIONS = [
  { key: COMPONENTS.CONCAVE_MIRROR, label: "Concave Mirror" },
  { key: COMPONENTS.CONVEX_MIRROR,  label: "Convex Mirror"  },
  { key: COMPONENTS.CONCAVE_LENS,   label: "Concave Lens"   },
  { key: COMPONENTS.CONVEX_LENS,    label: "Convex Lens"    },
];

// ─── Left panel ───────────────────────────────────────────────────────────────
function LeftPanel({ mode, setMode, OM, defect, setDefect, ED, component, setComponent, showFormulas, setShowFormulas }) {
  return (
    <div className="w-48 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: CLR.panel, borderColor: CLR.border }}>

      {/* Identity */}
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: CLR.border }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(227,179,65,0.1)" }}>
            <Aperture size={14} style={{ color: CLR.amber }} />
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Optics</p>
            <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Mirror &amp; Eye Lab</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">
        {/* Mode selector */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Mode</p>
          {[
            { id: OM.BENCH, label: "Ray Bench",  icon: "📐" },
            { id: OM.REFLECT_REFRACT, label: "Bending Light", icon: "✨" },
            { id: OM.EYE,   label: "Eye Clinic", icon: "👁️" },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{
                borderColor: mode === m.id ? CLR.ray : CLR.border,
                background:  mode === m.id ? "rgba(0,229,255,0.08)" : "transparent",
                color:       mode === m.id ? CLR.ray : CLR.muted,
              }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>View</p>
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
            style={{
              borderColor: showFormulas ? CLR.ray + "55" : CLR.border,
              background: showFormulas ? "rgba(0,229,255,0.07)" : "transparent",
              color: showFormulas ? CLR.ray : CLR.muted,
            }}>
            <span>Formulas (∑)</span>
            <span className="text-[9px] font-mono">{showFormulas ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Component selector (bench mode) */}
        <AnimatePresence mode="wait">
          {mode === OM.BENCH && (
            <motion.div key="bench-nav"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1.5">
              <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Component</p>
              {COMPONENT_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setComponent(opt.key)}
                  className="w-full flex items-center px-3 py-1.5 rounded-md text-xs border transition-all text-left"
                  style={{
                    borderColor: component === opt.key ? CLR.ray : CLR.border,
                    background:  component === opt.key ? "rgba(0,229,255,0.07)" : "transparent",
                    color:       component === opt.key ? CLR.ray : CLR.muted,
                  }}>
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Defect selector (eye mode) */}
          {mode === OM.EYE && (
            <motion.div key="eye-nav"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1.5">
              <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Defect</p>
              {[
                { key: ED.MYOPIA,        label: "Myopia",       sub: "In front of retina" },
                { key: ED.HYPERMETROPIA, label: "Hypermetropia", sub: "Behind retina" },
              ].map(d => (
                <button key={d.key} onClick={() => setDefect(d.key)}
                  className="w-full flex flex-col items-start px-3 py-2 rounded-md border transition-all text-left"
                  style={{
                    borderColor: defect === d.key ? CLR_O.retina : CLR.border,
                    background:  defect === d.key ? "rgba(244,112,103,0.07)" : "transparent",
                  }}>
                  <span className="text-xs font-semibold"
                    style={{ color: defect === d.key ? CLR_O.retina : CLR.text }}>{d.label}</span>
                  <span className="text-[9px]" style={{ color: CLR.muted }}>{d.sub}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Legend</p>
          {[
            { color: CLR.object, label: "Object"      },
            { color: CLR.image,  label: "Image"        },
            { color: CLR_O.ray,    label: "Principal ray" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-[10px]" style={{ color: CLR.muted }}>
              <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OpticsMirrorLab({ active }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 420 });

  const [mode,      setModeState]      = useState(OPTIC_MODES.BENCH);
  const [component, setComponentState] = useState(COMPONENTS.CONCAVE_LENS);
  const [focalLen,  setFocalLenState]  = useState(120);
  const [objDist,   setObjDistState]   = useState(280);
  const [objHeight, setObjHeightState] = useState(60);
  const [defect,    setDefectState]    = useState(EYE_DEFECTS.MYOPIA);
  const [corrType,  setCorrTypeState]  = useState(null);
  const [corrDiopt, setCorrDioptState] = useState(2.0);

  const [n1,             setN1State]             = useState(1.00);
  const [n2,             setN2State]             = useState(1.50);
  const [incidenceAngle, setIncidenceAngleState] = useState(45);
  const [showProtractor, setShowProtractorState] = useState(true);
  const [showFormulas,   setShowFormulas]   = useState(true);

  const {
    telemetry, handleMouseDown, handleMouseMove, handleMouseUp,
    syncMode, syncComponent, syncFocal, syncObjDist, syncObjHeight,
    syncDefect, syncCorrType, syncCorrDiopt,
    syncN1, syncN2, syncIncidenceAngle, syncShowProtractor,
    OPTIC_MODES: OM, COMPONENTS: COM, EYE_DEFECTS: ED,
  } = useOpticsLab({
    canvasRef,
    canvasSize,
    active,
    onObjDistChange: setObjDistState,
    onIncidenceAngleChange: setIncidenceAngleState,
  });

  const setMode      = useCallback((v) => { setModeState(v);      syncMode(v);      }, [syncMode]);
  const setComponent = useCallback((v) => { setComponentState(v); syncComponent(v); }, [syncComponent]);
  const setFocalLen  = useCallback((v) => { setFocalLenState(v);  syncFocal(v);     }, [syncFocal]);
  const setObjDist   = useCallback((v) => { setObjDistState(v);   syncObjDist(v);   }, [syncObjDist]);
  const setObjHeight = useCallback((v) => { setObjHeightState(v); syncObjHeight(v); }, [syncObjHeight]);
  const setDefect    = useCallback((v) => { setDefectState(v);    syncDefect(v);    }, [syncDefect]);
  const setCorrType  = useCallback((v) => {
    const val = v === corrType ? null : v;
    setCorrTypeState(val); syncCorrType(val);
  }, [corrType, syncCorrType]);
  const setCorrDiopt = useCallback((v) => { setCorrDioptState(v); syncCorrDiopt(v); }, [syncCorrDiopt]);

  const setN1             = useCallback((v) => { setN1State(v);             syncN1(v);             }, [syncN1]);
  const setN2             = useCallback((v) => { setN2State(v);             syncN2(v);             }, [syncN2]);
  const setIncidenceAngle = useCallback((v) => { setIncidenceAngleState(v); syncIncidenceAngle(v); }, [syncIncidenceAngle]);
  const setShowProtractor = useCallback((v) => { setShowProtractorState(v); syncShowProtractor(v); }, [syncShowProtractor]);

  const tel = telemetry;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* LEFT */}
      <LeftPanel
        mode={mode} setMode={setMode} OM={OM}
        defect={defect} setDefect={setDefect} ED={ED}
        component={component} setComponent={setComponent}
        showFormulas={showFormulas} setShowFormulas={setShowFormulas}
      />

      {/* CENTER */}
      <div className="flex flex-col flex-1 min-w-0 p-3 gap-2 relative">
        <FormulaOverlay
          type="optics"
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          data={{ mode, telemetry: { ...tel, mode, defect, corrDiopt } }}
        />
        <LabCanvas canvasRef={canvasRef} canvasSize={canvasSize} onResize={setCanvasSize}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        />
        {mode === OM.BENCH && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {/* CARD 1: OBJECT & LENS */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5">
                OBJECT & LENS
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                  Source
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] text-slate-400">Object dist (u)</p>
                  <p className="text-xs font-mono font-bold text-red-400">{tel.u !== undefined ? `${tel.u.toFixed(1)} px` : `-${objDist}.0 px`}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Object height (Hₒ)</p>
                  <p className="text-xs font-mono font-bold text-red-300">{tel.h_o !== undefined ? `${tel.h_o.toFixed(1)} px` : `${objHeight}.0 px`}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Focal length (f)</p>
                  <p className="text-xs font-mono font-bold text-sky-400">{tel.f !== undefined ? `${tel.f > 0 ? "+" : ""}${tel.f.toFixed(1)} px` : `${focalLen} px`}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Lens Power (P)</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">{isFinite(tel.power) ? `${tel.power > 0 ? "+" : ""}${tel.power.toFixed(2)} D` : "—"}</p>
                </div>
              </div>
            </div>

            {/* CARD 2: IMAGE DYNAMICS */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                  IMAGE DYNAMICS
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Result
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] text-slate-400">Image dist (v)</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">{isFinite(tel.v) ? `${tel.v > 0 ? "+" : ""}${tel.v.toFixed(1)} px` : "∞"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Image height (Hᵢ)</p>
                  <p className="text-xs font-mono font-bold text-emerald-300">{isFinite(tel.h_i) ? `${tel.h_i > 0 ? "+" : ""}${tel.h_i.toFixed(1)} px` : "∞"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Magnification (m)</p>
                  <p className="text-xs font-mono font-bold text-cyan-400">{isFinite(tel.m) ? `${tel.m > 0 ? "+" : ""}${tel.m.toFixed(2)}` : "∞"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Image Scale</p>
                  <p className="text-xs font-mono font-bold text-amber-300 truncate">{tel.scaleText || "—"}</p>
                </div>
              </div>
            </div>

            {/* CARD 3: OPTICAL STATE */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                OPTICAL STATE
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  State
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400">Image Nature</p>
                  <p className="text-xs font-bold text-cyan-300 truncate" title={tel.nature}>
                    {tel.nature || (tel.real ? "Real & Inverted" : "Virtual & Erect")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Ray Path</p>
                  <p className="text-xs font-mono font-bold text-slate-200">{tel.pathType || "Diverging"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Deviation (δ)</p>
                  <p className="text-xs font-mono font-bold text-amber-400">{tel.deviation !== undefined ? `${tel.deviation.toFixed(1)}°` : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {mode === OM.REFLECT_REFRACT && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {/* CARD 1: INCIDENT LIGHT */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                INCIDENT LIGHT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] text-slate-400">Incidence (θᵢ)</p>
                  <p className="text-xs font-mono font-bold text-amber-400">{tel.thetaI !== undefined ? `${tel.thetaI.toFixed(1)}°` : "45.0°"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Medium 1 (n₁)</p>
                  <p className="text-xs font-mono font-bold text-cyan-300">{n1.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* CARD 2: REFRACTION & REFLECTION */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                REFRACTION & REFLECTION
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] text-slate-400">Reflection (θᵣ)</p>
                  <p className="text-xs font-mono font-bold text-cyan-400">{tel.thetaR !== undefined ? `${tel.thetaR.toFixed(1)}°` : "45.0°"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Refraction (θₜ)</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">
                    {tel.tir ? "TIR" : (tel.thetaT !== undefined && !isNaN(tel.thetaT) ? `${tel.thetaT.toFixed(1)}°` : "—")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Medium 2 (n₂)</p>
                  <p className="text-xs font-mono font-bold text-cyan-300">{n2.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Critical Angle (θ_c)</p>
                  <p className="text-xs font-mono font-bold text-amber-300">{tel.thetaC !== undefined && !isNaN(tel.thetaC) ? `${tel.thetaC.toFixed(1)}°` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* CARD 3: DEVIATION */}
            <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
              style={{ background: CLR.panel, borderColor: CLR.border }}>
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5">
                DEVIATION METRICS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] text-slate-400">Deviation (δ)</p>
                  <p className="text-xs font-mono font-bold text-rose-400">
                    {tel.deviation !== undefined && !isNaN(tel.deviation) ? `${tel.deviation.toFixed(1)}°` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Optical State</p>
                  <p className="text-xs font-bold text-emerald-300">{tel.tir ? "Total Reflection" : "Refracting"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {mode === OM.EYE && (
          <div className="grid grid-cols-2 gap-2">
            <TelCard label="Defect" value={defect === ED.MYOPIA ? "Myopia" : "Hypermetropia"} accent={CLR_O.retina} />
            <TelCard label="Correction" value={tel.onRetina ? "On Retina ✓" : "Off Retina"} accent={tel.onRetina ? CLR.neon : CLR.warn} />
          </div>
        )}
      </div>

      {/* RIGHT — parameter sliders */}
      <div className="w-64 shrink-0 border-l flex flex-col overflow-y-auto"
        style={{ borderColor: CLR.border, background: CLR.panel }}>
        <div className="flex flex-col gap-3 p-4">
          <AnimatePresence mode="wait">
            {mode === OM.BENCH && (
              <motion.div key="bench-ctrl"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                className="flex flex-col gap-3">
                <HubSection title="Parameters" icon={<Sliders size={13} style={{ color: CLR.accent }} />}>
                  <div className="pt-3 flex flex-col gap-4">
                    <HubSliderRow label="Focal Length (f)" value={focalLen} min={40} max={300} step={5} unit="px"
                      hint="Distance to focal point" onChange={setFocalLen} accentColor={CLR.ray} />
                    <HubSliderRow label="Object Distance" value={objDist} min={50} max={600} step={5} unit="px"
                      hint="Or drag object on canvas" onChange={setObjDist} accentColor={CLR.object} />
                    <HubSliderRow label="Object Height" value={objHeight} min={20} max={120} step={5} unit="px"
                      hint="Adjust height of the object arrow" onChange={setObjHeight} accentColor={CLR.object} />
                  </div>
                </HubSection>
              </motion.div>
            )}

            {mode === OM.REFLECT_REFRACT && (
              <motion.div key="reflect-refract-ctrl"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                className="flex flex-col gap-3">
                <HubSection title="Bending Light" icon={<Sliders size={13} style={{ color: CLR.accent }} />}>
                  <div className="pt-3 flex flex-col gap-4">
                    <HubSliderRow label="Angle of Incidence" value={mode === OM.REFLECT_REFRACT ? (telemetry.thetaI ?? incidenceAngle) : incidenceAngle} min={0} max={85} step={1} unit="°"
                      hint="Or click/drag on top half of canvas" onChange={setIncidenceAngle} accentColor={CLR_O.ray} />
                    <HubSliderRow label="Medium 1 Index (n₁)" value={n1} min={1.00} max={2.50} step={0.01}
                      hint="Refractive index of top medium" onChange={setN1} accentColor={CLR.accent} />
                    
                    {/* Medium 1 Presets */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-slate-400">Medium 1 Material</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: "Air", n: 1.00 },
                          { label: "Water", n: 1.33 },
                          { label: "Glass", n: 1.52 },
                        ].map(m => (
                          <button key={m.label} onClick={() => setN1(m.n)}
                            className={`px-1.5 py-1 rounded text-[10px] border transition-all ${
                              Math.abs(n1 - m.n) < 0.01 ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <HubSliderRow label="Medium 2 Index (n₂)" value={n2} min={1.00} max={2.50} step={0.01}
                      hint="Refractive index of bottom medium" onChange={setN2} accentColor={CLR.accent} />

                    {/* Medium 2 Presets */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-slate-400">Medium 2 Material</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: "Air", n: 1.00 },
                          { label: "Water", n: 1.33 },
                          { label: "Crown", n: 1.52 },
                          { label: "Flint", n: 1.66 },
                          { label: "Diamond", n: 2.42 },
                        ].map(m => (
                          <button key={m.label} onClick={() => setN2(m.n)}
                            className={`px-1.5 py-1 rounded text-[10px] border transition-all ${
                              Math.abs(n2 - m.n) < 0.01 ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Protractor Toggle */}
                    <div className="flex items-center justify-between px-1 py-1">
                      <span className="text-xs font-semibold" style={{ color: CLR.muted }}>Show Protractor</span>
                      <input type="checkbox" checked={showProtractor} onChange={(e) => setShowProtractor(e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer bg-slate-900" />
                    </div>
                  </div>
                </HubSection>
              </motion.div>
            )}

            {mode === OM.EYE && (
              <motion.div key="eye-ctrl"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                className="flex flex-col gap-3">
                <HubSection title="Correction Lens" icon={<Aperture size={13} style={{ color: CLR_O.corrLens }} />}>
                  <div className="pt-3 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: "concave", label: "Concave (−)", hint: "Myopia"        },
                        { key: "convex",  label: "Convex (+)",  hint: "Hypermetropia" },
                      ].map(opt => (
                        <button key={opt.key} onClick={() => setCorrType(opt.key)}
                          className="flex flex-col items-center px-2 py-2 rounded-md border text-xs font-medium transition-all"
                          style={{
                            borderColor: corrType === opt.key ? CLR_O.corrLens : CLR.border,
                            background:  corrType === opt.key ? "rgba(86,211,100,0.08)" : "transparent",
                            color:       corrType === opt.key ? CLR_O.corrLens : CLR.muted,
                          }}>
                          <span className="font-bold">{opt.label}</span>
                          <span className="text-[9px]">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                    {corrType && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                        <HubSliderRow label="Diopter Power" value={corrDiopt}
                          min={0.5} max={10} step={0.5} unit="D"
                          hint="Adjust until focal point hits retina"
                          onChange={setCorrDiopt} accentColor={CLR_O.corrLens} />
                      </motion.div>
                    )}
                    {!corrType && (
                      <p className="text-[10px]" style={{ color: CLR.muted }}>
                        Select a lens type to begin correction.
                      </p>
                    )}
                  </div>
                </HubSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
