import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, Zap, Sparkles, Thermometer, Globe2,
  Star, Shield, Beaker, Flame, Droplets, Weight, TestTube2,
} from "lucide-react";

const TABS = [
  { id: "overview",    label: "Overview",        icon: Sparkles },
  { id: "properties", label: "Properties",       icon: Thermometer },
  { id: "uses",       label: "Real-World Uses",  icon: Globe2 },
];

function OverviewTab({ data }) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-3"
    >
      {data.balanced_equation && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
            Balanced Formation Equation
          </p>
          <p className="text-sm font-mono font-bold text-emerald-900">{data.balanced_equation}</p>
        </div>
      )}
      {data.fun_fact && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Star size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Fun Fact</p>
            <p className="text-xs text-amber-800 leading-relaxed">{data.fun_fact}</p>
          </div>
        </div>
      )}
      {data.safety_info && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
          <Shield size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-0.5">Safety</p>
            <p className="text-xs text-red-800 leading-relaxed">{data.safety_info}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PropertiesTab({ properties }) {
  if (!properties) {
    return <p className="text-sm text-gray-400 text-center py-8">No property data available.</p>;
  }

  const rows = [
    { label: "Molar Mass",    value: properties.molar_mass,        icon: Weight },
    { label: "State",         value: properties.state_at_room_temp, icon: Beaker },
    { label: "Appearance",    value: properties.color,              icon: Sparkles },
    { label: "Melting Point", value: properties.melting_point,      icon: Thermometer },
    { label: "Boiling Point", value: properties.boiling_point,      icon: Flame },
    { label: "Solubility",    value: properties.solubility,         icon: Droplets },
    ...(properties.ph ? [{ label: "pH", value: properties.ph, icon: TestTube2 }] : []),
  ];

  return (
    <motion.div
      key="properties"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ label, value, icon: PIcon }, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <PIcon size={10} className="text-gray-400" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-xs font-semibold text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function UsesTab({ uses }) {
  if (!uses || uses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No uses data available.</p>;
  }
  return (
    <motion.div
      key="uses"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-2"
    >
      {uses.map((use, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <p className="text-xs text-blue-900 leading-relaxed">{use}</p>
        </div>
      ))}
    </motion.div>
  );
}

export default function CompoundInfoModal({ data, onClose }) {
  const [tab, setTab] = useState("overview");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Gradient header */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-widest">Compound Crafted!</p>
                <p className="text-white text-lg font-extrabold leading-tight">{data.compound_name}</p>
                <p className="text-emerald-100 text-sm font-semibold font-mono">{data.formula}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-1">
              <X size={18} />
            </button>
          </div>

          {data.bond_type && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white">
                <Zap size={10} /> {data.bond_type} bond
              </span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          {TABS.map(t => {
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all cursor-pointer ${
                  tab === t.id
                    ? "text-emerald-700 border-b-2 border-emerald-500 bg-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <TIcon size={11} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 340 }}>
          <AnimatePresence mode="wait">
            {tab === "overview"    && <OverviewTab    data={data} />}
            {tab === "properties"  && <PropertiesTab  properties={data.properties} />}
            {tab === "uses"        && <UsesTab        uses={data.real_world_uses} />}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
          >
            <CheckCircle2 size={14} /> Awesome, got it!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
