import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CLR, BIO_TABS, TAB_ACCENT } from "./constants/bioConstants";
import CellSandbox from "./components/CellSandbox";
import NCERTDiagramHub from "./components/NCERTDiagramHub";

// ─── Coming Soon Placeholder ───────────────────────────────────────────────────
function ComingSoon({ tab }) {
  const accent = TAB_ACCENT[tab?.id] || CLR.accent;
  return (
    <div className="flex flex-1 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-2xl border text-center max-w-sm"
        style={{ borderColor: accent + "33", background: accent + "08" }}>
        <span className="text-5xl">{tab?.icon}</span>
        <div>
          <p className="text-base font-bold mb-1" style={{ color: accent }}>{tab?.label}</p>
          <p className="text-xs leading-relaxed" style={{ color: CLR.muted }}>
            This lab is under construction and will be available soon.<br />
            Grade {tab?.grade} · {tab?.topic}
          </p>
        </div>
        <span className="text-[9px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border"
          style={{ borderColor: accent + "55", color: accent, background: accent + "10" }}>
          Coming Soon
        </span>
      </motion.div>
    </div>
  );
}

// ─── Biology Hub Root ──────────────────────────────────────────────────────────
export default function BioHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ncert_diagrams");

  const activeTabData = BIO_TABS.find(t => t.id === activeTab);

  const handleTabChange = useCallback((id) => setActiveTab(id), []);

  return (
    <div
      className="flex h-screen overflow-hidden flex-col"
      style={{ background: CLR.bg, fontFamily: "Inter, sans-serif" }}>



      {/* ── CONTENT AREA ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col overflow-hidden">

            {activeTab === "ncert_diagrams" && <NCERTDiagramHub active={activeTab === "ncert_diagrams"} />}
            {activeTab === "cell" && <CellSandbox active={activeTab === "cell"} />}
            {activeTab !== "ncert_diagrams" && activeTab !== "cell" && (
              <ComingSoon tab={activeTabData} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

