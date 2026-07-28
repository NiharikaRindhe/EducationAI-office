import { motion } from "framer-motion";
import { X } from "lucide-react";
import { FormulaText } from "../utils/formulaUtils";

/**
 * Pill chip for a substance in a beaker.
 *
 * Builder tab (default)
 *   — Coefficient stepper (±) on both sides of the label.
 *   — Shows item.label with proper subscripts via FormulaText.
 *
 * Crafter tab (`isCrafter=true`)
 *   — Atom-count stepper adjusts the subscript on a bare element symbol.
 *
 * Free Lab tab (`isFree=true`)
 *   — Same as crafter: atom-count stepper, overall coefficient handled
 *     by the molecule-count strip in BeakerSection.
 */
export default function BeakerPill({
  item,
  index,
  onRemove,
  onCountChange,       // crafter / free: atomCount (subscript)
  onCoefficientChange, // builder: coefficient (prefix)
  isCrafter = false,
  isFree    = false,
}) {
  const atomCount   = item.atomCount   ?? 1;
  const coefficient = item.coefficient ?? 1;

  const useAtomStepper = isCrafter || isFree;

  // Label shown in the centre of the pill:
  // - Crafter/Free with a bare element (has symbol): build live from symbol + atomCount
  // - Free/Builder with a compound (has label but no symbol field, or label ≠ symbol):
  //   use label as-is so subscripts stay correct (e.g. H₂O stays H₂O)
  const isBareSingleElement = useAtomStepper && (item.symbol === item.id || item.atomicNum !== undefined);
  const liveLabel = isBareSingleElement
    ? `${item.symbol || item.id}${atomCount > 1 ? atomCount : ""}`
    : item.label;

  const stepBtn =
    "flex items-center justify-center w-7 h-full text-[17px] font-black transition-colors disabled:opacity-20 hover:bg-black/5 active:bg-black/10 select-none";

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="flex items-center w-fit rounded-2xl border-2 select-none overflow-hidden"
      style={{ background: item.color + "12", borderColor: item.color + "60" }}
    >
      {/* ── [−] stepper ─────────────────────────────────────────────── */}
      <button
        onClick={() =>
          useAtomStepper
            ? onCountChange && onCountChange(index, atomCount - 1)
            : onCoefficientChange && onCoefficientChange(index, coefficient - 1)
        }
        disabled={useAtomStepper ? atomCount <= 1 : coefficient <= 1}
        className={`${stepBtn} pl-2`}
        style={{ color: item.dark }}
        title={useAtomStepper ? "Decrease atom count" : "Decrease coefficient"}
      >
        −
      </button>

      {/* ── Formula label ────────────────────────────────────────────── */}
      <span className="px-1.5 py-1.5 text-2xl font-bold" style={{ color: item.dark }}>
        {/* Coefficient prefix in builder mode when > 1 */}
        {!useAtomStepper && coefficient > 1 && (
          <span className="mr-0.5 text-xl">{coefficient}</span>
        )}
        <FormulaText formula={liveLabel} />
      </span>

      {/* ── [+] stepper ─────────────────────────────────────────────── */}
      <button
        onClick={() =>
          useAtomStepper
            ? onCountChange && onCountChange(index, atomCount + 1)
            : onCoefficientChange && onCoefficientChange(index, coefficient + 1)
        }
        disabled={useAtomStepper ? atomCount >= 9 : coefficient >= 9}
        className={`${stepBtn} pr-1`}
        style={{ color: item.dark }}
        title={useAtomStepper ? "Increase atom count" : "Increase coefficient"}
      >
        +
      </button>

      {/* ── Remove ──────────────────────────────────────────────────── */}
      <button
        onClick={() => onRemove(index)}
        className="flex items-center justify-center w-6 h-full opacity-40 hover:opacity-100 transition-opacity mr-1.5"
        title="Remove"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}
