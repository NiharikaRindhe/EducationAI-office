import { motion, AnimatePresence } from "framer-motion";
import { Atom, Search, X, HelpCircle, FlaskConical } from "lucide-react";
import { useState, useRef } from "react";
import { BASIC_ELEMENTS, COMPOUND_RECIPES } from "../ElementDb";
import REACTIONS from "../Reactions";
import InventoryCard from "./InventoryCard";

// ── Tab order for slide-direction calculation ────────────────────────────────
const TAB_ORDER = ["builder", "crafter", "free"];

// ── Staggered grid container variant ────────────────────────────────────────
const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
  exit:   {},
};

// ── Section header — slides + fades in ──────────────────────────────────────
function SectionHeader({ icon: Icon, label, accent, count }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-2 px-0.5 mb-1"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 400, damping: 20 }}
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: accent + "20" }}
      >
        <Icon size={11} style={{ color: accent }} />
      </motion.div>

      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: accent }}>
        {label}
      </span>

      <div className="flex-1 h-px" style={{ background: accent + "25" }} />

      {count != null && (
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: accent + "15", color: accent }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

// ── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, onClear, placeholder, focusColor = "violet" }) {
  const ringMap = {
    violet: "focus:border-violet-400 focus:ring-violet-200",
    sky:    "focus:border-sky-400 focus:ring-sky-200",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 transition-all ${ringMap[focusColor] ?? ringMap.violet}`}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={onClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Empty-state card (no compounds crafted yet) ─────────────────────────────
function EmptyCompounds({ accent, onOpenCrafter, bg, border }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 border-dashed text-center"
      style={{ borderColor: border, background: bg }}
    >
      <motion.span
        animate={{ rotate: [0, -10, 10, -6, 0] }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-2xl"
      >
        ⚗️
      </motion.span>
      <p className="text-[11px] font-semibold" style={{ color: accent === "#4a7c59" ? "#2d5a3d" : "#5b21b6" }}>
        No compounds crafted yet
      </p>
      <p className="text-[10px] leading-snug" style={{ color: accent }}>
        Switch to <strong>Compound Crafter</strong> to synthesize compounds — they'll appear here once crafted.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenCrafter}
        className="mt-1 px-3 py-1 rounded-xl text-[10px] font-bold text-white transition-colors"
        style={{ background: accent }}
      >
        Open Crafter →
      </motion.button>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function InventoryPanel({
  activeTab, setActiveTab,
  hasCompoundsInInventory,
  craftingBeaker, addToCraftingBeaker,
  craftedCompounds,
  reactionInventory,
  beaker, addToBeaker,
  setCraftingStatus,
  freeBeaker = [],
  addToFreeBeaker,
}) {
  const [craftingSearch, setCraftingSearch] = useState("");
  const [elementSearch,  setElementSearch]  = useState("");
  const [freeSearch,     setFreeSearch]     = useState("");
  const [helpOpen,       setHelpOpen]       = useState(false);
  const prevTabRef = useRef(activeTab);

  // Slide direction: positive = slide right (forward), negative = slide left (back)
  const tabIndex     = TAB_ORDER.indexOf(activeTab);
  const prevTabIndex = TAB_ORDER.indexOf(prevTabRef.current);
  const direction    = tabIndex >= prevTabIndex ? 1 : -1;

  const tabContentVariants = {
    enter:   { opacity: 0, x: direction * 24 },
    center:  { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
    exit:    { opacity: 0, x: direction * -24, transition: { duration: 0.16 } },
  };

  const handleTabChange = (id) => {
    prevTabRef.current = activeTab;
    setActiveTab(id);
    setCraftingStatus("idle");
  };

  const getCompoundItem = (id) => {
    let item = reactionInventory.find(inv => inv.id === id);
    if (item) return item;
    for (const r of REACTIONS) {
      const found = r.inventory.find(inv => inv.id === id);
      if (found) return found;
    }
    const recipe = COMPOUND_RECIPES[id];
    if (recipe) return { id, label: recipe.label, name: recipe.name, color: "#8b5cf6", dark: "#6d28d9" };
    return { id, label: id, name: id, color: "#64748b", dark: "#334155" };
  };

  const craftingElements = BASIC_ELEMENTS.filter(el => {
    const q = craftingSearch.toLowerCase();
    return !q || el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q) || String(el.atomicNum).includes(q);
  });

  const builderElements = BASIC_ELEMENTS.filter(el => {
    const q = elementSearch.toLowerCase();
    return !q || el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q) || String(el.atomicNum).includes(q);
  });

  const freeElements = BASIC_ELEMENTS.filter(el => {
    const q = freeSearch.toLowerCase();
    return !q || el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q) || String(el.atomicNum).includes(q);
  });

  return (
    <aside className="h-full flex flex-col gap-2 overflow-hidden">

      {/* ── Panel heading ────────────────────────────────────────────────── */}
      <motion.h2
        layout
        className="text-xs font-bold text-gray-500 tracking-widest uppercase"
      >
        {activeTab === "crafter" ? "Crafting Elements" : "Inventory"}
      </motion.h2>

      {/* ── Tab switcher with sliding pill indicator ─────────────────────── */}
      <div className="relative flex bg-gray-200/60 p-1 rounded-xl border border-gray-300/40 shrink-0 gap-0.5">
        {/* Sliding background pill */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm pointer-events-none"
          style={{ width: "calc(33.33% - 2px)" }}
          animate={{ x: `calc(${TAB_ORDER.indexOf(activeTab)} * 100% + ${TAB_ORDER.indexOf(activeTab)} * 2px)` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        {[
          { id: "builder", label: "Builder" },
          { id: "crafter", label: "Crafter" },
          { id: "free",    label: "Free Lab" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="relative flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none z-10"
            style={{
              color: activeTab === tab.id
                ? tab.id === "free" ? "#2d5a3d" : "#6d28d9"
                : "#6b7280",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable content with directional slide ────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5">
        <AnimatePresence mode="wait" initial={false}>

          {/* ════════ COMPOUND CRAFTER TAB ════════ */}
          {activeTab === "crafter" && (
            <motion.div
              key="crafter"
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-2"
            >
              <SearchBar
                value={craftingSearch}
                onChange={setCraftingSearch}
                onClear={() => setCraftingSearch("")}
                placeholder="Search elements..."
                focusColor="violet"
              />
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-2"
              >
                {craftingElements.map((item, i) => (
                  <InventoryCard
                    key={item.id}
                    index={i}
                    item={item}
                    onAdd={addToCraftingBeaker}
                    disabled={craftingBeaker.some(b => b.id === item.id)}
                    showAtomicNum
                  />
                ))}
              </motion.div>
              {craftingElements.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="col-span-2 py-8 flex flex-col items-center gap-2 text-gray-400"
                >
                  <Search size={20} className="opacity-30" />
                  <p className="text-xs font-medium">No elements match "{craftingSearch}"</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════════ REACTION BUILDER TAB ════════ */}
          {activeTab === "builder" && (
            <motion.div
              key="builder"
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Components section */}
              {(hasCompoundsInInventory || craftedCompounds.length > 0) && (
                <div className="flex flex-col gap-2">
                  <SectionHeader icon={FlaskConical} label="Components" accent="#7c3aed" count={craftedCompounds.length} />
                  {craftedCompounds.length === 0 ? (
                    <EmptyCompounds
                      accent="#7c3aed"
                      bg="#f5f3ff"
                      border="#c4b5fd"
                      onOpenCrafter={() => handleTabChange("crafter")}
                    />
                  ) : (
                    <motion.div
                      variants={gridVariants} initial="hidden" animate="show"
                      className="grid grid-cols-2 gap-2"
                    >
                      {craftedCompounds.map((id, i) => {
                        const item = getCompoundItem(id);
                        if (!item) return null;
                        return (
                          <InventoryCard
                            key={item.id} index={i} item={item}
                            onAdd={addToBeaker}
                            disabled={beaker.some(b => b.id === item.id)}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Elements section */}
              <div className="flex flex-col gap-2">
                <SectionHeader icon={Atom} label="Elements" accent="#0284c7" />
                <SearchBar
                  value={elementSearch}
                  onChange={setElementSearch}
                  onClear={() => setElementSearch("")}
                  placeholder="Search all 118 elements…"
                  focusColor="sky"
                />
                <motion.div
                  variants={gridVariants} initial="hidden" animate="show"
                  className="grid grid-cols-2 gap-2"
                >
                  {builderElements.map((item, i) => (
                    <InventoryCard
                      key={item.id} index={i} item={item}
                      onAdd={addToBeaker}
                      disabled={beaker.some(b => b.id === item.id)}
                      showAtomicNum
                    />
                  ))}
                </motion.div>
                {builderElements.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-8 flex flex-col items-center gap-2 text-gray-400"
                  >
                    <Search size={20} className="opacity-30" />
                    <p className="text-xs font-medium">No elements match "{elementSearch}"</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════ FREE LAB TAB ════════ */}
          {activeTab === "free" && (
            <motion.div
              key="free"
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Intro badge */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.22 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: "#f0f7f2", borderColor: "#a8d4b5" }}
              >
                <motion.span
                  animate={{ rotate: [0, -12, 12, -6, 0] }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                  className="text-lg"
                >
                  🧪
                </motion.span>
                <p className="text-[10px] leading-snug font-medium" style={{ color: "#2d5a3d" }}>
                  Mix anything freely — the AI will tell you what happens!
                </p>
              </motion.div>

              {/* Components */}
              <div className="flex flex-col gap-2">
                <SectionHeader icon={FlaskConical} label="Components" accent="#4a7c59" count={craftedCompounds.length} />
                <AnimatePresence mode="wait">
                  {craftedCompounds.length === 0 ? (
                    <EmptyCompounds
                      key="empty"
                      accent="#4a7c59"
                      bg="#f0f7f2"
                      border="#a8d4b5"
                      onOpenCrafter={() => handleTabChange("crafter")}
                    />
                  ) : (
                    <motion.div
                      key="grid"
                      variants={gridVariants} initial="hidden" animate="show"
                      className="grid grid-cols-2 gap-2"
                    >
                      {craftedCompounds.map((id, i) => {
                        const item = getCompoundItem(id);
                        if (!item) return null;
                        return (
                          <InventoryCard
                            key={item.id} index={i} item={item}
                            onAdd={addToFreeBeaker}
                            disabled={freeBeaker.some(b => b.id === item.id)}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Elements */}
              <div className="flex flex-col gap-2">
                <SectionHeader icon={Atom} label="Elements" accent="#4a7c59" />
                <SearchBar
                  value={freeSearch}
                  onChange={setFreeSearch}
                  onClear={() => setFreeSearch("")}
                  placeholder="Search all 118 elements…"
                  focusColor="sky"
                />
                <motion.div
                  variants={gridVariants} initial="hidden" animate="show"
                  className="grid grid-cols-2 gap-2"
                >
                  {freeElements.map((item, i) => (
                    <InventoryCard
                      key={item.id} index={i} item={item}
                      onAdd={addToFreeBeaker}
                      disabled={freeBeaker.some(b => b.id === item.id)}
                      showAtomicNum
                    />
                  ))}
                </motion.div>
                {freeElements.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-8 flex flex-col items-center gap-2 text-gray-400"
                  >
                    <Search size={20} className="opacity-30" />
                    <p className="text-xs font-medium">No elements match "{freeSearch}"</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Help tooltip ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-lg text-xs text-gray-600 overflow-hidden"
          >
            <div className="flex items-start gap-2 p-3 border-b border-gray-100">
              <FlaskConical size={13} className="mt-0.5 shrink-0 text-violet-500" />
              <p><strong className="text-violet-600">Components</strong> — substances specific to this reaction. 🔒 items must be crafted first in the Compound Crafter.</p>
            </div>
            <div className="flex items-start gap-2 p-3">
              <Atom size={13} className="mt-0.5 shrink-0 text-sky-500" />
              <p><strong className="text-sky-600">Elements</strong> — search all 118 elements and add them directly to your beaker.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Help button ──────────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setHelpOpen(h => !h)}
        className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors self-start ${
          helpOpen ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <motion.span
          animate={{ rotate: helpOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="inline-flex"
        >
          <HelpCircle size={18} />
        </motion.span>
        {helpOpen ? "Hide help" : "How does this work?"}
      </motion.button>

    </aside>
  );
}
