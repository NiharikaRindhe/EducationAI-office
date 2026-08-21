import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FlaskConical, Trophy } from "lucide-react";

export default function LabHeader({ navigate, questionIndex, totalQuestions, score }) {
  const progressPct = ((questionIndex) / totalQuestions) * 100;

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="shrink-0 z-40 bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Left — back + brand */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft size={15} /> Back
          </motion.button>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeInOut" }}
              className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"
            >
              <FlaskConical size={16} className="text-violet-600" />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">Virtual Chemistry Lab</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Reaction Builder Challenge</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
