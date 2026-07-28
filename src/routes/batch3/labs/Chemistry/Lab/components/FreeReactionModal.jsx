import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Zap, Sparkles, Star, Shield, FlaskConical,
  Eye, Package, AlertTriangle, CheckCircle2, Ban,
} from "lucide-react";

// ── Energy badge colours ────────────────────────────────────────────────────
const ENERGY_STYLES = {
  "Exothermic":      { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", emoji: "🔥" },
  "Endothermic":     { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", emoji: "❄️" },
  "No Reaction":     { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563", emoji: "⚗️" },
  "Physical Change": { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", emoji: "💧" },
};

const REACTION_TYPE_COLORS = {
  "Combination":          "#7c3aed",
  "Decomposition":        "#db2777",
  "Single Displacement":  "#d97706",
  "Double Displacement":  "#0891b2",
  "Combustion":           "#ea580c",
  "Acid-Base":            "#16a34a",
  "Redox":                "#7c3aed",
  "Physical Change":      "#6b7280",
  "No Reaction":          "#9ca3af",
};

const TABS = [
  { id: "observe",  label: "Observe",  icon: Eye },
  { id: "products", label: "Products", icon: Package },
  { id: "safety",   label: "Safety",   icon: Shield },
];

// ── Tab panels ──────────────────────────────────────────────────────────────

function ObserveTab({ data }) {
  return (
    <motion.div
      key="observe"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-3"
    >
      {/* What happens */}
      <div className="p-3.5 rounded-2xl border" style={{ background: "#f0f7f2", borderColor: "#a8d4b5" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#4a7c59" }}>
          <Eye size={10} /> What you'd observe
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#1a3d28" }}>{data.what_happens}</p>
      </div>

      {/* Equation */}
      {data.balanced_equation && (
        <div className="p-3 rounded-2xl bg-gray-900 border border-gray-700">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Balanced Equation
          </p>
          <p className="text-sm font-mono font-bold text-emerald-400">{data.balanced_equation}</p>
        </div>
      )}

      {/* Fun fact */}
      {data.fun_fact && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-violet-50 border border-violet-200">
          <Star size={14} className="text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-0.5">Fun Fact</p>
            <p className="text-xs text-violet-800 leading-relaxed">{data.fun_fact}</p>
          </div>
        </div>
      )}

      {/* No reaction reason */}
      {data.no_reaction_reason && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200">
          <Ban size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Why No Reaction?</p>
            <p className="text-xs text-gray-700 leading-relaxed">{data.no_reaction_reason}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ProductsTab({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
        <Ban size={24} className="opacity-30" />
        <p className="text-sm font-medium">No products formed</p>
      </div>
    );
  }
  return (
    <motion.div
      key="products"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-2"
    >
      {products.map((product, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200"
        >
          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <p className="text-sm font-semibold text-emerald-900">{product}</p>
        </div>
      ))}
    </motion.div>
  );
}

function SafetyTab({ safetyInfo }) {
  return (
    <motion.div
      key="safety"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800 leading-relaxed">{safetyInfo || "No specific hazards noted."}</p>
      </div>
    </motion.div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

export default function FreeReactionModal({ data, reactantLabels, onClose }) {
  const [tab, setTab] = useState("observe");

  const energyStyle = ENERGY_STYLES[data.energy_type] ?? ENERGY_STYLES["No Reaction"];
  const reactionTypeColor = REACTION_TYPE_COLORS[data.reaction_type] ?? "#6b7280";

  // Header gradient — warm orange for reactions, cool gray for no-reaction
  const headerGradient = data.has_reaction
    ? "linear-gradient(135deg, #2d5a3d 0%, #4a7c59 50%, #6a9e7a 100%)"
    : "linear-gradient(135deg, #4b5563 0%, #6b7280 50%, #9ca3af 100%)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="px-6 py-5 relative overflow-hidden" style={{ background: headerGradient }}>
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
                {data.has_reaction ? "⚗️" : "🧪"}
              </div>

              <div>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-0.5">
                  {data.has_reaction ? "Reaction Detected!" : "No Chemical Reaction"}
                </p>
                <p className="text-white text-lg font-extrabold leading-tight">
                  {data.reaction_name || "Physical Change"}
                </p>

                {/* Reactants pill */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {reactantLabels.map((label, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-1">
              <X size={18} />
            </button>
          </div>

          {/* Badges row */}
          <div className="relative mt-3 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: energyStyle.bg, color: energyStyle.text, border: `1px solid ${energyStyle.border}` }}
            >
              {energyStyle.emoji} {data.energy_type}
            </span>
            {data.reaction_type && data.reaction_type !== "No Reaction" && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                style={{ background: reactionTypeColor + "cc" }}
              >
                <Zap size={10} /> {data.reaction_type}
              </span>
            )}
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          {TABS.map(t => {
            const TIcon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? "text-white border-b-2 bg-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                style={isActive ? { color: "#2d5a3d", borderColor: "#4a7c59" } : {}}
              >
                <TIcon size={11} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto" style={{ height: 350 }}>
          <AnimatePresence mode="wait">
            {tab === "observe"  && <ObserveTab  data={data} />}
            {tab === "products" && <ProductsTab products={data.products} />}
            {tab === "safety"   && <SafetyTab   safetyInfo={data.safety_info} />}
          </AnimatePresence>
        </div>


        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="px-5 pb-5 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: data.has_reaction
                ? "linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%)"
                : "linear-gradient(135deg, #4b5563 0%, #6b7280 100%)",
            }}
          >
            {data.has_reaction ? <><Sparkles size={14} /> Cool! Clear beaker</> : <><CheckCircle2 size={14} /> Got it! Clear beaker</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
