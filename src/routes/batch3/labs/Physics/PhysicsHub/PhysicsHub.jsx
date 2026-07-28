import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FlaskConical, ChevronRight, Sun, Moon } from "lucide-react";
import { CLR as hubCLR, TABS } from "./constants/hubConstants";
import { CLR as frictionCLR } from "../FrictionSimulator/constants/frictionConstants";
import { CLR as physicsCLR } from "../ProjectileMotion/constants/physicsConstants";
import { CLR as soundCLR } from "../SoundWave/constants/soundConstants";

import ProjectileMotion from "../ProjectileMotion/ProjectileMotion";
import FrictionSimulator from "../FrictionSimulator/FrictionSimulator";
import SoundWaveTank from "../SoundWave/SoundWaveTank";
import OpticsMirrorLab from "./OpticsMirrorLab";
import CircuitBuilder from "./components/CircuitBuilder";

// Define local copy of CLR for backwards compatibility inside the component file structure
const CLR = hubCLR;

const TAB_ACCENT = {
  motion: "#58a6ff",
  friction: "#56d364",
  sound: "#00e5ff",
  power: "#39d353", // Glowing green for Circuit Sandbox
  optics: "#e3b341",
};

// ─── Left nav tab item ────────────────────────────────────────────────────────
function NavItem({ tab, active, onClick }) {
  const accent = TAB_ACCENT[tab.id];
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-colors relative items-start"
      style={{
        background: active ? `${accent}16` : "transparent",
        border: `1px solid ${active ? accent + "55" : "transparent"}`,
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: accent }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}

      <span className="text-base leading-none ml-1 mt-0.5">{tab.icon}</span>

      <div className="flex flex-col min-w-0 flex-1 pt-0.5">
        <span
          className="text-[11px] font-semibold leading-tight"
          style={{ color: active ? accent : CLR.text }}
        >
          {tab.label}
        </span>
        <span
          className="text-[9px] mt-0.5 leading-snug text-left"
          style={{ color: active ? accent : CLR.muted }}
        >
          {tab.description}
        </span>
      </div>

      <ChevronRight
        size={12}
        className="mt-1"
        style={{ color: active ? accent : "transparent", flexShrink: 0 }}
      />
    </motion.button>
  );
}

// ─── Wrapper for existing full-screen simulators ──────────────────────────────
function SimulatorPane({ children }) {
  return <div className="absolute inset-0 overflow-hidden">{children}</div>;
}

// ─── Theme mutator (module-level so ESLint immutability rule is satisfied) ────
// Called synchronously at the top of each render so all CLR references are
// already updated before JSX evaluates style={{ background: CLR.bg }} etc.
function applyTheme(isDark) {
  localStorage.setItem("physics-theme", isDark ? "dark" : "light");

  hubCLR.bg = isDark ? "#0d1117" : "#f8fafc";
  hubCLR.panel = isDark ? "#161b22" : "#ffffff";
  hubCLR.border = isDark ? "#30363d" : "#cbd5e1";
  hubCLR.text = isDark ? "#f0f6fc" : "#0f172a";
  hubCLR.muted = isDark ? "#8b949e" : "#475569";
  hubCLR.grid = isDark ? "rgba(48,54,61,0.55)" : "rgba(203,213,225,0.7)";
  hubCLR.axis = isDark ? "rgba(139,148,158,0.4)" : "rgba(71,85,105,0.5)";

  frictionCLR.bg = isDark ? "#0d1117" : "#f8fafc";
  frictionCLR.panel = isDark ? "#161b22" : "#ffffff";
  frictionCLR.border = isDark ? "#30363d" : "#cbd5e1";
  frictionCLR.text = isDark ? "#e6edf3" : "#0f172a";
  frictionCLR.muted = isDark ? "#8b949e" : "#475569";
  frictionCLR.ramp = isDark ? "#21262d" : "#e2e8f0";
  frictionCLR.rampEdge = isDark ? "#30363d" : "#94a3b8";
  frictionCLR.grid = isDark ? "rgba(48,54,61,0.6)" : "rgba(203,213,225,0.7)";

  physicsCLR.bg = isDark ? "#0d1117" : "#ffffff";
  physicsCLR.panel = isDark ? "#161b22" : "#f8fafc";
  physicsCLR.border = isDark ? "#30363d" : "#cbd5e1";
  physicsCLR.text = isDark ? "#e6edf3" : "#0f172a";
  physicsCLR.muted = isDark ? "#8b949e" : "#475569";
  physicsCLR.grid = isDark ? "rgba(48,54,61,0.9)" : "rgba(203,213,225,0.75)";
  physicsCLR.ground = isDark ? "#30363d" : "#475569";

  soundCLR.bg = isDark ? "#0d1117" : "#f8fafc";
  soundCLR.panel = isDark ? "#161b22" : "#ffffff";
  soundCLR.border = isDark ? "#30363d" : "#cbd5e1";
  soundCLR.text = isDark ? "#f0f6fc" : "#0f172a";
  soundCLR.muted = isDark ? "#8b949e" : "#475569";
  soundCLR.grid = isDark ? "rgba(48,54,61,0.55)" : "rgba(203,213,225,0.7)";
  soundCLR.speaker = isDark ? "#21262d" : "#cbd5e1";
  soundCLR.speakerEdge = isDark ? "#30363d" : "#94a3b8";
  soundCLR.particle = isDark ? "rgba(240,246,252,0.22)" : "rgba(15,23,42,0.14)";
}

export default function PhysicsHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("motion");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("physics-theme");
    return saved !== "light"; // default to dark (obsidian theme)
  });

  const handleTabChange = useCallback((id) => setActiveTab(id), []);

  // Apply theme synchronously every render — CLR objects are updated before
  // JSX evaluates so all inline styles and canvas draw calls get fresh values.
  applyTheme(isDarkMode);

  return (
    <div
      className="flex h-screen overflow-hidden flex-col"
      style={{ background: CLR.bg, fontFamily: "Inter, sans-serif" }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex min-h-[68px] items-center justify-between gap-4 border-b px-4 py-3 shrink-0"
        style={{ background: CLR.panel, borderColor: CLR.border }}
      >
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ x: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
            style={{ color: CLR.muted, background: "rgba(148,163,184,0.08)" }}
          >
            <ArrowLeft size={12} /> Back
          </motion.button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(88,166,255,0.24), rgba(0,229,255,0.08))", border: `1px solid ${CLR.accent}33` }}
          >
            <FlaskConical size={15} style={{ color: CLR.accent }} />
          </div>
          <div>
            <p
              className="text-[13px] font-bold leading-none"
              style={{ color: CLR.text }}
            >
              Easy Physics Lab
            </p>
            <p
              className="text-[10px] mt-1 leading-none"
              style={{ color: CLR.muted }}
            >
              Try one idea at a time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border p-1.5" style={{ borderColor: CLR.border, background: "rgba(148,163,184,0.05)" }}>
          {TABS.map((tab) => {
            const accent = TAB_ACCENT[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTabChange(tab.id)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap border"
                style={{
                  background: isActive
                    ? `${accent}16`
                    : "rgba(7, 20, 39, 0.08)",
                  borderColor: isActive ? accent + "55" : CLR.border,
                  color: isActive ? accent : CLR.text,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold border"
            style={{
              borderColor: CLR.border,
              background: "rgba(148,163,184,0.08)",
              color: CLR.text,
            }}
          >
            {isDarkMode ? (
              <Moon size={12} style={{ color: CLR.accent }} />
            ) : (
              <Sun size={12} style={{ color: CLR.amber }} />
            )}
            <span>{isDarkMode ? "Dark" : "Light"}</span>
          </motion.button>
        </div>
      </motion.header>

      {/* ── CONTENT AREA (fills remaining space, simulators manage their own 3-col layout) ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col overflow-hidden"
          >
            {activeTab === "motion" && (
              <SimulatorPane>
                <ProjectileMotion embedded theme={isDarkMode} />
              </SimulatorPane>
            )}
            {activeTab === "friction" && (
              <SimulatorPane>
                <FrictionSimulator embedded theme={isDarkMode} />
              </SimulatorPane>
            )}
            {activeTab === "sound" && (
              <SimulatorPane>
                <SoundWaveTank embedded theme={isDarkMode} />
              </SimulatorPane>
            )}
            {activeTab === "power" && (
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <CircuitBuilder
                  active={activeTab === "power"}
                  theme={isDarkMode}
                />
              </div>
            )}
            {activeTab === "optics" && (
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <OpticsMirrorLab
                  active={activeTab === "optics"}
                  theme={isDarkMode}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
