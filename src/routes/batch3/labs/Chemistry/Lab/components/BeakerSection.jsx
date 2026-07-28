import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  Beaker, FlaskConical, Atom, Trash2, Zap, Loader2,
  CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import BeakerPill from "./BeakerPill";
import ReactionTypeBadge from "./ReactionTypeBadge";
import { buildFormulaString, FormulaText } from "../utils/formulaUtils";

/**
 * The centre column: question card + reaction/crafting beaker + action buttons.
 */
export default function BeakerSection({
  // Reaction
  reaction,
  typeMeta,
  questionIndex,
  attempts,
  showHint,
  setShowHint,
  beaker,
  removeFromBeaker,
  clearBeaker,
  checkReaction,
  status,
  updateCoefficient,
  updateBeakerAtomCount,
  builderMoleculeCount = 1,
  setBuilderMoleculeCount,
  // Crafting
  activeTab,
  craftingBeaker,
  removeFromCraftingBeaker,
  clearCraftingBeaker,
  handleCraftCompound,
  craftingStatus,
  craftedMessage,
  isCrafting,
  // Atom / molecule counts (crafter)
  moleculeCount = 1,
  setMoleculeCount,
  updateAtomCount,
  // Free Lab
  freeBeaker = [],
  removeFromFreeBeaker,
  clearFreeBeaker,
  updateFreeCoefficient,
  updateFreeAtomCount,
  freeMoleculeCount = 1,
  setFreeMoleculeCount,
  handleFreeReact,
  isFreeReacting,
}) {
  const TypeIcon = typeMeta?.icon;

  /** Live formula string from current crafter beaker state, e.g. "2H2O" */
  const liveFormula = buildFormulaString(craftingBeaker, moleculeCount);

  /**
   * Live formula preview for the free beaker.
   * Each element contributes symbol + atomCount subscript; the shared
   * freeMoleculeCount prefix is shown once in the strip, not per-element.
   * e.g. freeBeaker=[{symbol:"H",atomCount:2},{symbol:"O",atomCount:1}], freeMoleculeCount=2
   *   → shown in strip as "2" · pills show H₂ and O
   */
  const liveFreeFormula = buildFormulaString(freeBeaker, freeMoleculeCount);

  /** Live formula preview for the builder beaker — same pattern as crafter/free. */
  const liveBuilderFormula = buildFormulaString(beaker, builderMoleculeCount);

  const clampMol = (v) => Math.max(1, Math.min(9, v));

  return (
    <section className="h-full flex flex-col gap-3 overflow-hidden">
      {/* ── Question card ─────────────────────────────────────────────── */}
      {activeTab !== "free" && (
        <motion.div
          key={reaction.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 bg-white rounded-2xl border-2 p-3 shadow-sm"
          style={{ borderColor: typeMeta?.border || "#e2e8f0" }}
        >
          <div className="flex items-center justify-between mb-2">
            <ReactionTypeBadge type={reaction?.type} />
            <span className="text-xs text-gray-400 font-medium">Q{questionIndex + 1}</span>
          </div>

          <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">{reaction?.question}</p>

          <div
            className="flex items-start gap-2 p-2 rounded-xl"
            style={{ background: typeMeta?.bg || "#f8fafc", border: `1px solid ${typeMeta?.border || "#e2e8f0"}` }}
          >
            {TypeIcon && <TypeIcon size={12} className="shrink-0 mt-0.5" style={{ color: typeMeta?.color }} />}
            <p className="text-[11px]" style={{ color: typeMeta?.color }}>
              <span className="font-bold">{typeMeta?.label}:</span> {typeMeta?.pattern} — {typeMeta?.description}
            </p>
          </div>

          {/* Hint (unlocked after first wrong attempt) */}
          {attempts >= 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
              <button
                onClick={() => setShowHint(h => !h)}
                className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold hover:text-amber-800 transition-colors"
              >
                <Info size={12} /> {showHint ? "Hide hint" : "Show hint"}
              </button>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700"
                >
                  💡 {reaction.hint}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── Beaker card ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Colour accent bar */}
        <div
          className="h-1.5"
          style={{
            background: activeTab === "crafter"
              ? "linear-gradient(90deg, #10b981, #059669)"
              : activeTab === "free"
                ? "linear-gradient(90deg, #4a7c59, #2d5a3d)"
                : `linear-gradient(90deg, ${typeMeta?.color || "#7c3aed"}, #4f46e5)`,
          }}
        />

        {/* Beaker label */}
        <div className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-gray-100">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Beaker size={11} />{" "}
            {activeTab === "crafter"
              ? "Compound Crafting Beaker"
              : activeTab === "free"
                ? "Sandbox Beaker"
                : "Reaction Beaker"}
          </span>
          {activeTab === "crafter"
            ? craftingBeaker.length > 0 && (
                <span className="text-[11px] text-gray-400">
                  {craftingBeaker.length} element{craftingBeaker.length !== 1 ? "s" : ""}
                </span>
              )
            : activeTab === "free"
              ? freeBeaker.length > 0 && (
                  <span className="text-[11px] text-gray-400">
                    {freeBeaker.length} substance{freeBeaker.length !== 1 ? "s" : ""}
                  </span>
                )
              : beaker.length > 0 && (
                  <span className="text-[11px] text-gray-400">
                    {beaker.length} substance{beaker.length !== 1 ? "s" : ""}
                  </span>
                )
          }
        </div>

        {/* ── Molecule count stepper (crafter tab only) ─────────────── */}
        {activeTab === "crafter" && craftingBeaker.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-2.5 pb-1.5 flex items-center gap-3 border-b border-gray-100 bg-emerald-50/50"
          >
            {/* Label */}
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Molecules
            </span>

            {/* Stepper */}
            <div className="flex items-center gap-1 bg-white border-2 border-emerald-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setMoleculeCount(c => clampMol(c - 1))}
                disabled={moleculeCount <= 1}
                className="w-7 h-7 flex items-center justify-center text-sm font-black text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-25 transition-colors"
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-extrabold text-emerald-800">
                {moleculeCount}
              </span>
              <button
                onClick={() => setMoleculeCount(c => clampMol(c + 1))}
                disabled={moleculeCount >= 9}
                className="w-7 h-7 flex items-center justify-center text-sm font-black text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-25 transition-colors"
              >
                +
              </button>
            </div>

            {/* Live equation preview */}
            {liveFormula && (
              <motion.div
                key={liveFormula}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border-2 border-emerald-200 shadow-sm"
              >
                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Formula:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  <FormulaText formula={liveFormula} />
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Molecule count stepper (builder tab) ──────────────────── */}
        {activeTab === "builder" && beaker.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-2.5 pb-1.5 flex items-center gap-3 border-b border-gray-100 bg-violet-50/50"
          >
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-widest shrink-0">
              Molecules
            </span>

            <div className="flex items-center gap-1 bg-white border-2 border-violet-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setBuilderMoleculeCount(c => clampMol(c - 1))}
                disabled={builderMoleculeCount <= 1}
                className="w-7 h-7 flex items-center justify-center text-sm font-black text-violet-700 hover:bg-violet-50 active:bg-violet-100 disabled:opacity-25 transition-colors"
              >−</button>
              <span className="w-7 text-center text-sm font-extrabold text-violet-800">
                {builderMoleculeCount}
              </span>
              <button
                onClick={() => setBuilderMoleculeCount(c => clampMol(c + 1))}
                disabled={builderMoleculeCount >= 9}
                className="w-7 h-7 flex items-center justify-center text-sm font-black text-violet-700 hover:bg-violet-50 active:bg-violet-100 disabled:opacity-25 transition-colors"
              >+</button>
            </div>

            {liveBuilderFormula && (
              <motion.div
                key={liveBuilderFormula}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border-2 border-violet-200 shadow-sm"
              >
                <span className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Formula:</span>
                <span className="text-sm font-extrabold text-violet-700">
                  <FormulaText formula={liveBuilderFormula} />
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Molecule count stepper (free tab) ─────────────────────── */}
        {activeTab === "free" && freeBeaker.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-2.5 pb-1.5 flex items-center gap-3 border-b border-gray-100"
            style={{ background: "#f0f7f240" }}
          >
            {/* Label */}
            <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#2d5a3d" }}>
              Molecules
            </span>

            {/* Stepper */}
            <div className="flex items-center gap-1 bg-white rounded-xl overflow-hidden shadow-sm border-2" style={{ borderColor: "#a8d4b5" }}>
              <button
                onClick={() => setFreeMoleculeCount(c => clampMol(c - 1))}
                disabled={freeMoleculeCount <= 1}
                className="w-7 h-7 flex items-center justify-center text-sm font-black disabled:opacity-25 transition-colors hover:bg-gray-50 active:bg-gray-100"
                style={{ color: "#2d5a3d" }}
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-extrabold" style={{ color: "#2d5a3d" }}>
                {freeMoleculeCount}
              </span>
              <button
                onClick={() => setFreeMoleculeCount(c => clampMol(c + 1))}
                disabled={freeMoleculeCount >= 9}
                className="w-7 h-7 flex items-center justify-center text-sm font-black disabled:opacity-25 transition-colors hover:bg-gray-50 active:bg-gray-100"
                style={{ color: "#2d5a3d" }}
              >
                +
              </button>
            </div>

            {/* Live formula preview */}
            {liveFreeFormula && (
              <motion.div
                key={liveFreeFormula}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white shadow-sm border-2"
                style={{ borderColor: "#a8d4b5" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4a7c59" }}>Formula:</span>
                <span className="text-sm font-extrabold" style={{ color: "#2d5a3d" }}>
                  <FormulaText formula={liveFreeFormula} />
                </span>
              </motion.div>
            )}
          </motion.div>
        )}


        <div className="flex-1 min-h-0 p-3 flex flex-wrap justify-center items-center gap-2 relative overflow-y-auto">
          {activeTab === "crafter" ? (
            <>
              {craftingBeaker.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Atom size={28} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">Crafting beaker is empty</p>
                  <p className="text-xs text-gray-300">Select basic elements to synthesize compounds</p>
                </div>
              )}
              {craftingBeaker.length > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: Math.min(60, craftingBeaker.length * 12) + "px",
                    background: "linear-gradient(0deg, #10b98110 0%, transparent 100%)",
                    transition: "height 0.4s ease",
                  }}
                />
              )}
              <AnimatePresence>
                {craftingBeaker.map((item, idx) => (
                  <BeakerPill
                    key={item.id}
                    item={item}
                    index={idx}
                    onRemove={removeFromCraftingBeaker}
                    onCountChange={updateAtomCount}
                    isCrafter
                  />
                ))}
              </AnimatePresence>

              {/* Status toast — overlays pills, no layout impact */}
              <AnimatePresence>
                {craftingStatus !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className={`absolute bottom-2 left-2 right-2 flex items-center gap-2 p-2.5 rounded-xl text-xs shadow-lg backdrop-blur-sm ${
                      craftingStatus === "success"
                        ? "bg-emerald-50/95 border border-emerald-200 text-emerald-700"
                        : craftingStatus === "unsupported"
                          ? "bg-amber-50/95 border border-amber-200 text-amber-700"
                          : "bg-red-50/95 border border-red-200 text-red-700"
                    }`}
                  >
                    {craftingStatus === "success"      ? <CheckCircle2 size={13} className="shrink-0" />
                      : craftingStatus === "unsupported" ? <Info size={13} className="shrink-0" />
                      :                                    <AlertTriangle size={13} className="shrink-0" />}
                    <span className="font-semibold truncate">{craftedMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : activeTab === "free" ? (
            <>
              {freeBeaker.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FlaskConical size={28} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">Sandbox beaker is empty</p>
                  <p className="text-xs text-gray-300">Select elements and compounds to mix</p>
                </div>
              )}
              {freeBeaker.length > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: Math.min(60, freeBeaker.length * 12) + "px",
                    background: "linear-gradient(0deg, #4a7c5910 0%, transparent 100%)",
                    transition: "height 0.4s ease",
                  }}
                />
              )}
              <AnimatePresence>
                {freeBeaker.map((item, idx) => (
                  <BeakerPill
                    key={item.id}
                    item={item}
                    index={idx}
                    onRemove={removeFromFreeBeaker}
                    onCountChange={updateFreeAtomCount}
                    isFree
                  />
                ))}
              </AnimatePresence>
            </>
          ) : (
            <>
              {beaker.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FlaskConical size={28} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">Beaker is empty</p>
                  <p className="text-xs text-gray-300">Select substances from the inventory</p>
                </div>
              )}
              {beaker.length > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: Math.min(60, beaker.length * 12) + "px",
                    background: `linear-gradient(0deg, ${typeMeta?.color || "#7c3aed"}10 0%, transparent 100%)`,
                    transition: "height 0.4s ease",
                  }}
                />
              )}
              <AnimatePresence>
                {beaker.map((item, idx) => (
                  <BeakerPill
                    key={item.id}
                    item={item}
                    index={idx}
                    onRemove={removeFromBeaker}
                    onCountChange={updateBeakerAtomCount}
                    isFree
                  />
                ))}
              </AnimatePresence>

              {/* Status toast — overlays pills, no layout impact */}
              <AnimatePresence>
                {status === "wrong" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-2 left-2 right-2 flex items-center gap-2 p-2.5 rounded-xl bg-red-50/95 border border-red-200 text-xs text-red-700 shadow-lg backdrop-blur-sm"
                  >
                    <AlertTriangle size={13} className="shrink-0" />
                    <span className="font-semibold">Not quite right.</span>
                    <span>{attempts === 1 ? "Hint unlocked — try again!" : "Check the reaction type and substances needed."}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Beaker bottom decoration */}
        <div className="h-4 mx-4 mb-1 rounded-b-3xl border-b-2 border-x-2 border-gray-200" />

        {/* Action buttons */}
        <div className="px-4 py-3 flex gap-2 border-t border-gray-100 bg-gray-50/60">
          {activeTab === "crafter" ? (
            <>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCraftCompound}
                disabled={craftingBeaker.length === 0 || isCrafting}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: craftingBeaker.length >= 1 && !isCrafting
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "#9ca3af",
                  boxShadow: craftingBeaker.length >= 1 && !isCrafting ? "0 4px 14px #10b98140" : "none",
                }}
              >
                {isCrafting
                  ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
                  : <><FlaskConical size={14} /> Craft Compound</>}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearCraftingBeaker}
                disabled={craftingBeaker.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Clear
              </motion.button>
            </>
          ) : activeTab === "free" ? (
            <>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFreeReact}
                disabled={freeBeaker.length === 0 || isFreeReacting}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: freeBeaker.length >= 1 && !isFreeReacting
                    ? "linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%)"
                    : "#9ca3af",
                  boxShadow: freeBeaker.length >= 1 && !isFreeReacting ? "0 4px 14px #4a7c5940" : "none",
                }}
              >
                {isFreeReacting
                  ? <><Loader2 size={14} className="animate-spin" /> Reacting...</>
                  : <><Zap size={14} /> React!</>}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearFreeBeaker}
                disabled={freeBeaker.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Clear
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={checkReaction}
                disabled={beaker.length < 1 || status === "correct"}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: beaker.length >= 1 && status !== "correct"
                    ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
                    : "#9ca3af",
                  boxShadow: beaker.length >= 1 ? "0 4px 14px #7c3aed40" : "none",
                }}
              >
                <Zap size={14} /> Check Reaction
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearBeaker}
                disabled={beaker.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Clear
              </motion.button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
