import { motion } from "framer-motion";
import { FormulaText } from "../utils/formulaUtils";

// ── Per-card entrance variant — driven by stagger from parent ────────────────
export const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show:   (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.045,
      type: "spring",
      stiffness: 340,
      damping: 24,
    },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.14 } },
};

/**
 * A clickable card for an inventory item.
 *
 * Props:
 *  - item         — the substance / element object
 *  - onAdd        — called with `item` when clicked
 *  - disabled     — card is greyed out and non-interactive
 *  - isLocked     — compound that needs crafting first (shows lock)
 *  - showAtomicNum — if true, shows the atomic number badge (top-right)
 *  - index        — stagger index (passed from parent grid)
 */
export default function InventoryCard({ item, onAdd, disabled, isLocked, showAtomicNum = false, index = 0 }) {
  return (
    <motion.button
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={
        !disabled && !isLocked
          ? { y: -4, boxShadow: `0 10px 24px ${item.color}28`, scale: 1.02 }
          : isLocked
            ? { scale: 1.01 }
            : {}
      }
      whileTap={!disabled || isLocked ? { scale: 0.94 } : {}}
      onClick={() => onAdd(item)}
      disabled={disabled && !isLocked}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 bg-white cursor-pointer transition-colors duration-150 ${
        isLocked ? "opacity-60 border-dashed border-gray-300" : ""
      } ${disabled && !isLocked ? "opacity-40" : ""}`}
      style={{ borderColor: isLocked ? "#d1d5db" : item.color + "50" }}
    >
      {/* Top colour bar */}
      <div
        className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
        style={{ background: isLocked ? "#d1d5db" : item.color }}
      />

      {/* Atomic number badge */}
      {showAtomicNum && item.atomicNum != null && (
        <span
          className="absolute top-1.5 right-2 text-[9px] font-bold opacity-50"
          style={{ color: item.dark }}
        >
          {item.atomicNum}
        </span>
      )}

      {/* Symbol / formula */}
      <span
        className="text-xl font-extrabold mt-1 flex items-center gap-1"
        style={{ color: isLocked ? "#9ca3af" : item.dark }}
      >
        <FormulaText formula={item.label} />
        {isLocked && <span className="text-xs">🔒</span>}
      </span>

      {/* Name */}
      <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
        {isLocked ? "Needs Crafting" : item.name}
      </span>

      {/* "Added" overlay flash when item lands in beaker */}
      {disabled && !isLocked && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: item.color + "25" }}
        />
      )}
    </motion.button>
  );
}
