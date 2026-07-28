import { motion } from "framer-motion";
import { X, XCircle, AlertTriangle, Info } from "lucide-react";

export default function CraftFailureModal({ reason, elements, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <XCircle size={22} className="text-white" />
              </div>
              <div>
                <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest">Craft Failed</p>
                <p className="text-white font-extrabold text-base leading-tight">No Compound Formed</p>
                <p className="text-red-100 text-xs mt-0.5">Elements: {elements.join(" + ")}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1.5">Why It Didn't Work</p>
              <p className="text-sm text-red-900 leading-relaxed">{reason}</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-bold">Tip:</span> Try combining elements that have compatible valences,
              like metals with non-metals, or check that both elements can share electrons.
            </p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Try a Different Combination
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
