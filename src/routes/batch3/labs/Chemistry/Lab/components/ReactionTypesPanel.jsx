import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import REACTION_TYPES from "../constants/REACTION_TYPES";
import REACTIONS from "../Reactions";

// ── Container — staggers children on mount ───────────────────────────────────
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

// ── Each card entrance ───────────────────────────────────────────────────────
const itemVariants = {
  hidden: { opacity: 0, x: 18, scale: 0.97 },
  show:   { opacity: 1, x: 0,  scale: 1, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

export default function ReactionTypesPanel({ currentType, onSelectType }) {
  const customQuestionCount = (() => {
    try {
      const stored = localStorage.getItem("chem_lab_custom_questions");
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter(q => q?.question?.trim() && q?.correctReactants?.length).length : 0;
    } catch {
      return 0;
    }
  })();

  const cards = [
    ...Object.entries(REACTION_TYPES)
      .filter(([key]) => key !== "custom")
      .map(([key, meta]) => ({
        key,
        type: "preset",
        meta,
        count: REACTIONS.filter(r => r.type === key).length,
        isCustom: false,
        label: meta.label,
      })),
    ...(customQuestionCount > 0 ? [{
      key: "custom",
      type: "custom",
      meta: {
        label: "Custom",
        icon: Sparkles,
        color: "#8b5cf6",
        bg: "#faf5ff",
        border: "#d8b4fe",
        description: "Jump to your saved teacher-built questions.",
        pattern: "Custom",
      },
      count: customQuestionCount,
      isCustom: true,
      label: "Custom",
    }] : []),
  ];

  return (
    <aside className="h-full flex flex-col gap-2 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex items-center gap-2 shrink-0"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 20 }}
          className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center"
        >
          <BookOpen size={13} className="text-gray-500" />
        </motion.div>
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Reaction Types</h2>
      </motion.div>

      {/* ── Staggered card list ─────────────────────────────────────────── */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-0.5"
      >
        {cards.map(({ key, meta, count, isCustom }) => {
          const Icon     = meta.icon;
          const isActive = key === currentType;

          return (
            <motion.button
              key={key}
              variants={itemVariants}
              whileHover={{
                y: -2,
                boxShadow: `0 6px 18px ${meta.color}18`,
                borderColor: meta.color + "70",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectType(key)}
              className="group relative w-full text-left p-3 rounded-xl border-2 overflow-hidden transition-colors duration-150 cursor-pointer focus:outline-none"
              style={{
                background:   isActive ? meta.bg    : "#fafafa",
                borderColor:  isActive ? meta.border : "#e5e7eb",
                boxShadow:    isActive ? `0 2px 12px ${meta.color}15` : "none",
              }}
            >
              {/* ── Animated left-accent bar — slides in when active ────── */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="accent"
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    style={{
                      originY: 0.5,
                      background: meta.color,
                      position: "absolute",
                      left: 0,
                      top: "10%",
                      bottom: "10%",
                      width: 3,
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* ── Card body ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      background: isActive ? meta.color + "20" : "#f3f4f6",
                      scale: isActive ? 1.08 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                  >
                    <Icon size={12} style={{ color: isActive ? meta.color : "#9ca3af" }} />
                  </motion.div>
                  <span className="text-xs font-bold" style={{ color: isActive ? meta.color : "#374151" }}>
                    {meta.label}
                  </span>
                </div>

                {/* CURRENT / SWITCH badge */}
                <AnimatePresence mode="wait">
                  {isActive ? (
                    <motion.span
                      key="current"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: meta.color + "20", color: meta.color }}
                    >
                      CURRENT
                    </motion.span>
                  ) : (
                    <motion.span
                      key="switch"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      whileGroupHover={{ opacity: 1 }}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-400"
                    >
                      SWITCH
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed mb-1.5">{meta.description}</p>

              <div className="flex items-center justify-between">
                <motion.code
                  animate={{
                    background: isActive ? meta.color + "15" : "#f3f4f6",
                    color:      isActive ? meta.color         : "#6b7280",
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                >
                  {meta.pattern}
                </motion.code>

                {/* Progress dots */}
                <span className="text-[9px] text-gray-400 font-medium">
                  {count}{isCustom ? "✓" : "Q"}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </aside>
  );
}
