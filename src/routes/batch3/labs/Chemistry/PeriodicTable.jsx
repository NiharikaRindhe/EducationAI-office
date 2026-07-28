import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Atom } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AtomData from "./AtomData";
import AtomicModelSimulator from "./AtomicModelSimulator";

// ── Position Logic ─────────────────────────────────────────────────────────
function getPosition(el) {
  const n = el.atomic_number;
  const g = el.group;
  const cat = el.category;

  if (cat === "Lanthanides") return [9, n - 57 + 3];
  if (cat === "Actinides") return [10, n - 89 + 3];

  let period;
  if (n <= 2) period = 1;
  else if (n <= 10) period = 2;
  else if (n <= 18) period = 3;
  else if (n <= 36) period = 4;
  else if (n <= 54) period = 5;
  else if (n <= 86) period = 6;
  else period = 7;

  return [period, g];
}

// ── Category config (colors from AtomData hex_codes) ──────────────────────
const CAT = {
  "Alkali Metals":     { glow: "#dc2626", bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     activeBg: "#fef2f2", activeBorder: "#fca5a5" },
  "Alkaline Earth":    { glow: "#ea580c", bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  activeBg: "#fff7ed", activeBorder: "#fdba74" },
  "Transition Metals": { glow: "#ca8a04", bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500",  activeBg: "#fefce8", activeBorder: "#fde047" },
  "Post-Transition":   { glow: "#16a34a", bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500",   activeBg: "#f0fdf4", activeBorder: "#86efac" },
  "Metalloids":        { glow: "#0d9488", bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    activeBg: "#f0fdfa", activeBorder: "#5eead4" },
  "Nonmetals":         { glow: "#2563eb", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    activeBg: "#eff6ff", activeBorder: "#93c5fd" },
  "Halogens":          { glow: "#7c3aed", bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  activeBg: "#faf5ff", activeBorder: "#c4b5fd" },
  "Noble Gases":       { glow: "#db2777", bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-500",    activeBg: "#fdf2f8", activeBorder: "#f9a8d4" },
  "Lanthanides":       { glow: "#c026d3", bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500", activeBg: "#fdf4ff", activeBorder: "#e879f9" },
  "Actinides":         { glow: "#d97706", bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   activeBg: "#fffbeb", activeBorder: "#fcd34d" },
};

const LEGEND_CATS = Object.keys(CAT);

// ── Atomic model tabs ──────────────────────────────────────────────────────
const MODELS = [
  { id: "dalton", label: "Dalton", year: "1803" },
  { id: "thomson", label: "Thomson", year: "1904" },
  { id: "rutherford", label: "Rutherford", year: "1911" },
  { id: "bohr", label: "Bohr", year: "1913" },
  { id: "quantum", label: "Quantum", year: "1926" },
];

// ── Build grid ─────────────────────────────────────────────────────────────
function buildGrid() {
  const grid = {};
  for (let r = 1; r <= 10; r++) {
    grid[r] = {};
    for (let c = 1; c <= 18; c++) grid[r][c] = null;
  }
  AtomData.forEach((el) => {
    const [row, col] = getPosition(el);
    if (row && col) grid[row][col] = el;
  });
  return grid;
}
const grid = buildGrid();

// ── Component ──────────────────────────────────────────────────────────────
export default function PeriodicTable() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);   // clicked element
  const [hovered, setHovered] = useState(null);   // mouse-over element (peek box)
  const [filterCat, setFilterCat] = useState(null);
  const [activeModel, setActiveModel] = useState("bohr");

  const rows = [1, 2, 3, 4, 5, 6, 7, "gap", 9, 10];

  const handleSelectElement = (el) => {
    setSelected(el);
    setActiveModel("bohr"); // reset to Bohr on each new element
  };

  const c_sel = selected ? (CAT[selected.category] ?? { glow: "#fff", text: "text-white" }) : null;
  const c_peek = hovered ? (CAT[hovered.category] ?? { glow: "#fff", text: "text-white" }) : null;

  return (
    <div className="select-none min-h-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-start justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-white shadow-sm flex-wrap shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Atom size={16} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">Periodic Table of Elements</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">118 Elements &middot; Interactive Simulator</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Peek Box — fixed top-right, shows on hover ── */}
      <div
        className="fixed top-[68px] right-4 z-40 w-52 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] pointer-events-none transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
        }}
      >
        {hovered && c_peek && (
          <>
            {/* Colour accent top bar */}
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ background: c_peek.glow }} />

            {/* Symbol + atomic number */}
            <div className="flex items-start justify-between mb-1 mt-1">
              <span
                className={`text-4xl font-black leading-none tracking-tighter ${c_peek.text}`}
              >
                {hovered.symbol}
              </span>
              <span className="text-[11px] font-semibold text-gray-400 mt-1">
                #{hovered.atomic_number}
              </span>
            </div>

            {/* Name */}
            <div className="text-[13px] font-bold text-gray-800 leading-tight">{hovered.element}</div>
            <div className="text-[11px] text-gray-400 mb-2">{hovered.atomic_mass} u</div>

            {/* Category badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-3"
              style={{ background: c_peek.glow + "15", color: c_peek.glow, border: `1px solid ${c_peek.glow}40` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c_peek.glow }} />
              {hovered.category}
            </div>

            {/* Quick stats */}
            <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2.5">
              {[
                ["State", hovered.state],
                ["Group", hovered.group],
                ["Charge", hovered.common_charge],
                ["Valency", hovered.valency],
                ["Electroneg.", hovered.electronegativity || "—"],
                ["Bonding", hovered.bonding_type],
                ["Config", hovered.electron_configuration],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-[10px] text-gray-400 shrink-0">{label}</span>
                  <span className="text-[10px] text-gray-700 text-right truncate max-w-[100px]">{val}</span>
                </div>
              ))}
            </div>

            {/* Click hint */}
            <p className="text-[9px] text-gray-400 text-center mt-3 italic">Click to open simulator</p>
          </>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto p-4 pb-8">
        <div className="w-fit mx-auto" style={{ minWidth: "1080px" }}>

          {/* Group headers */}
          <div className="grid gap-[3px] mb-1 pl-6" style={{ gridTemplateColumns: "repeat(18, 58px)" }}>
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} className="text-center text-[9px] font-bold text-gray-400 h-4 flex items-center justify-center">
                {i + 1}
              </div>
            ))}
          </div>

          {rows.map((rowKey) => {
            if (rowKey === "gap") {
              return (
                <div key="gap" className="flex items-center h-5 pl-7 my-1">
                  <span className="text-[9px] italic text-gray-400 tracking-wide">
                    ↳ Lanthanides &amp; Actinides
                  </span>
                </div>
              );
            }

            const period = rowKey;
            return (
              <div key={rowKey} className="flex items-center gap-1 mb-[3px]">
                <div className="w-5 text-center text-[9px] font-bold text-gray-400 shrink-0">{period}</div>

                <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(18, 58px)" }}>
                  {Array.from({ length: 18 }, (_, colIdx) => {
                    const col = colIdx + 1;
                    const el = grid[period]?.[col] ?? null;
                    if (!el) return <div key={col} style={{ width: 58, height: 68 }} />;

                    const c = CAT[el.category];
                    const dimmed = filterCat && el.category !== filterCat;
                    const isActive = selected?.atomic_number === el.atomic_number;

                    return (
                      <div
                        key={col}
                        onClick={() => handleSelectElement(el)}
                        onMouseEnter={() => setHovered(el)}
                        onMouseLeave={() => setHovered(null)}
                        className={`
                          relative flex flex-col items-center justify-center
                          rounded-lg border-2 cursor-pointer bg-white
                          transition-all duration-[180ms] hover:-translate-y-0.5
                          ${isActive ? "scale-[1.18] -translate-y-0.5 z-10 shadow-md" : "z-0 hover:shadow-sm"}
                          ${dimmed ? "opacity-20" : "opacity-100"}
                        `}
                        style={{
                          width: 58,
                          height: 68,
                          borderColor: isActive ? c.glow : c.glow + "50",
                          background: isActive ? c.activeBg : "white",
                        }}
                      >
                        {/* Coloured left accent bar */}
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: c.glow + "80" }} />
                        <div className={`absolute top-1 left-1.5 text-[8.5px] font-semibold ${c.text}`}>
                          {el.atomic_number}
                        </div>
                        <div className={`text-[19px] font-black leading-none tracking-tight ${c.text}`}>
                          {el.symbol}
                        </div>
                        <div className="text-[7px] text-gray-500 mt-0.5 max-w-[54px] truncate text-center leading-tight">
                          {el.element}
                        </div>
                        <div className="text-[6.5px] text-gray-400 leading-tight">
                          {typeof el.atomic_mass === "number"
                            ? el.atomic_mass % 1 === 0 ? el.atomic_mass.toFixed(0) : el.atomic_mass.toFixed(2)
                            : el.atomic_mass}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-8 flex-wrap gap-1.5">
          {LEGEND_CATS.map((cat) => {
            const c = CAT[cat];
            const active = filterCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(active ? null : cat)}
                className={`
                  flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold
                  transition-all duration-200 cursor-pointer
                  ${c.text}
                  ${active ? `${c.bg} scale-105 shadow-sm` : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}
                `}
                style={active ? { borderColor: c.activeBorder } : {}}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>



      {/* ════════════════════════════════════════════════════════════════
          ELEMENT DETAIL MODAL  — slides in from the right
      ════════════════════════════════════════════════════════════════ */}
      {selected && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
            style={{
              background: "#ffffff",
              maxWidth: 900,
              width: "100%",
              maxHeight: "92vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Left: Canvas Simulator (dark canvas stays dark — it's a simulation display) ── */}
            <div className="flex flex-col items-center gap-3 p-5 bg-gray-900 rounded-l-2xl">
              {/* Model tabs */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-full">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={`
                      flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200
                      ${activeModel === m.id
                        ? "text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"}
                    `}
                    style={activeModel === m.id ? { background: c_sel?.glow + "33", color: c_sel?.glow } : {}}
                  >
                    <div>{m.label}</div>
                    <div className="text-[9px] opacity-60 font-normal">{m.year}</div>
                  </button>
                ))}
              </div>

              {/* Canvas */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ boxShadow: `0 0 40px ${c_sel?.glow ?? "#3b82f6"}30` }}
              >
                <AtomicModelSimulator
                  elementData={selected}
                  currentModel={activeModel}
                />
              </div>

              {/* Mini legend */}
              <p className="text-[10px] text-slate-400 text-center max-w-[420px] px-2">
                {{
                  dalton: "Dalton (1803): Atoms are indivisible solid spheres.",
                  thomson: "Thomson (1904): Electrons embedded in a positive 'pudding'.",
                  rutherford: "Rutherford (1911): Dense nucleus, electrons orbit like planets.",
                  bohr: "Bohr (1913): Electrons occupy fixed quantised energy shells.",
                  quantum: "Quantum (1926): Electrons exist as probability density clouds.",
                }[activeModel]}
              </p>
            </div>

            {/* ── Right: Element Info Panel ── */}
            <div className="flex flex-col flex-1 p-6 overflow-y-auto min-w-0">
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all"
              >
                <X size={16} />
              </button>

              {/* Coloured accent bar at very top of right panel */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c_sel?.glow }} />

              {/* Element header */}
              <div className="flex items-end gap-4 mb-6 mt-1">
                <span className={`text-7xl font-black leading-none tracking-tighter ${c_sel?.text}`}>
                  {selected.symbol}
                </span>
                <div>
                  <div className="text-xl font-bold text-gray-900">{selected.element}</div>
                  <div className="text-sm text-gray-500">Atomic Number: {selected.atomic_number}</div>
                  <div
                    className="text-xs mt-1.5 px-2.5 py-0.5 rounded-full inline-block font-semibold"
                    style={{ background: c_sel?.glow + "15", color: c_sel?.glow, border: `1px solid ${c_sel?.glow}40` }}
                  >
                    {selected.category}
                  </div>
                </div>
              </div>

              {/* Properties grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Atomic Mass", `${selected.atomic_mass} u`],
                  ["State", selected.state],
                  ["Group", selected.group],
                  ["Period", selected.atomic_number <= 2 ? 1 : selected.atomic_number <= 10 ? 2 : selected.atomic_number <= 18 ? 3 : selected.atomic_number <= 36 ? 4 : selected.atomic_number <= 54 ? 5 : selected.atomic_number <= 86 ? 6 : 7],
                  ["Valency", selected.valency],
                  ["Common Charge", selected.common_charge],
                  ["Bonding Type", selected.bonding_type],
                  ["Electronegativity", selected.electronegativity || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{val}</div>
                  </div>
                ))}
              </div>

              {/* Electron config */}
              <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Electron Configuration</div>
                <div className="text-sm font-mono text-gray-700 break-all">{selected.electron_configuration}</div>
              </div>

              {/* Bohr shell visual summary */}
              <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Atom size={13} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Bohr Shells</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const caps = [2, 8, 18, 32, 32, 18, 8];
                    const shells = [];
                    let rem = selected.atomic_number;
                    for (const cap of caps) {
                      if (rem <= 0) break;
                      shells.push(Math.min(rem, cap));
                      rem -= cap;
                    }
                    return shells.map((count, si) => (
                      <div key={si} className="flex flex-col items-center gap-1">
                        <div className="text-[9px] text-gray-400">n={si + 1}</div>
                        <div
                          className="rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold border-2"
                          style={{ borderColor: c_sel?.glow + "60", color: c_sel?.glow, background: c_sel?.glow + "12" }}
                        >
                          {count}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      )}
    </div>
  );
}
