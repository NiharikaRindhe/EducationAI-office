import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FlaskConical, Plus, Trash2, Save,
  CheckCircle2, BookOpen, GripVertical, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { BASIC_ELEMENTS } from "./ElementDb";

// ── Storage key shared with Lab.jsx ──────────────────────────────────────────
export const CUSTOM_QUESTIONS_KEY = "chem_lab_custom_questions";

// ── Reaction type options ─────────────────────────────────────────────────────
const REACTION_TYPES = [
  { id: "combination",    label: "Combination",    icon: "➕", color: "#6366f1" },
  { id: "decomposition",  label: "Decomposition",  icon: "🔀", color: "#f59e0b" },
  { id: "displacement",   label: "Displacement",   icon: "↔️",  color: "#10b981" },
  { id: "combustion",     label: "Combustion",     icon: "🔥", color: "#ef4444" },
  { id: "neutralisation", label: "Neutralisation", icon: "⚖️",  color: "#8b5cf6" },
  { id: "redox",          label: "Redox",          icon: "⚡", color: "#0ea5e9" },
];

// ── Compact element chip used in the mini periodic picker ─────────────────────
function ElementChip({ el, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(el)}
      title={`${el.name} (${el.symbol})`}
      className="relative rounded font-bold text-white text-[10px] leading-none flex items-center justify-center border-2 transition-all"
      style={{
        width: 34, height: 34,
        background: selected ? el.color : `${el.color}22`,
        borderColor: selected ? el.color : "transparent",
        color: selected ? "#fff" : el.color,
        boxShadow: selected ? `0 0 8px ${el.color}88` : "none",
      }}
    >
      {el.symbol}
      {selected && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 flex items-center justify-center">
          <CheckCircle2 size={8} className="text-white" />
        </span>
      )}
    </motion.button>
  );
}

// ── Mini periodic table grid (first 54 elements for usability) ────────────────
const DISPLAY_ELEMENTS = BASIC_ELEMENTS.slice(0, 54);

function toSubscript(num) {
  const subs = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
  };
  return String(num).split("").map(c => subs[c] || c).join("");
}

function ElementPicker({ selected, onToggle, onUpdateValue, label, typeKey }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? DISPLAY_ELEMENTS.filter(e =>
        e.symbol.toLowerCase().includes(search.toLowerCase()) ||
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    : DISPLAY_ELEMENTS;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search element to add…"
          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {/* Selected Reactants with Steppers */}
      {selected.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {selected.map((item, idx) => {
            const displayFormula = `${item.coefficient > 1 ? item.coefficient : ""}${item.symbol}${item.atomCount > 1 ? toSubscript(item.atomCount) : ""}`;
            return (
              <motion.div
                key={item.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-150 shadow-sm"
              >
                {/* Element preview circle */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                  style={{ background: item.color }}
                >
                  {item.symbol}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Formula: <span className="font-bold text-gray-700">{displayFormula}</span></p>
                </div>

                {/* Coeff stepper */}
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 pl-1.5">Qty</span>
                  <button
                    type="button"
                    onClick={() => onUpdateValue(typeKey, idx, { coefficient: Math.max(1, item.coefficient - 1) })}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-gray-800">{item.coefficient}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateValue(typeKey, idx, { coefficient: Math.min(9, item.coefficient + 1) })}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* AtomCount stepper */}
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 pl-1.5">Atoms</span>
                  <button
                    type="button"
                    onClick={() => onUpdateValue(typeKey, idx, { atomCount: Math.max(1, item.atomCount - 1) })}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-gray-800">{item.atomCount}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateValue(typeKey, idx, { atomCount: Math.min(9, item.atomCount + 1) })}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Mini periodic elements grid */}
      <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1 border border-gray-100 rounded-xl p-1.5 bg-gray-50/50">
        {filtered.map(el => (
          <ElementChip
            key={el.id}
            el={el}
            selected={selected.some(s => s.symbol === el.symbol)}
            onClick={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ── A single question card in the builder ────────────────────────────────────
function QuestionCard({ q, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(index === 0);

  const toggleAnswerEl = useCallback((el) => {
    const exists = q.correctReactants.find(r => r.symbol === el.symbol);
    if (exists) {
      onUpdate(index, {
        correctReactants: q.correctReactants.filter(r => r.symbol !== el.symbol),
      });
    } else {
      onUpdate(index, {
        correctReactants: [...q.correctReactants, {
          id: el.id,
          symbol: el.symbol,
          name: el.name,
          color: el.color,
          dark: el.dark,
          atomCount: 1,
          coefficient: 1,
        }],
      });
    }
  }, [q.correctReactants, index, onUpdate]);

  const toggleDistractor = useCallback((el) => {
    const exists = q.distractors.find(d => d.symbol === el.symbol);
    if (exists) {
      onUpdate(index, {
        distractors: q.distractors.filter(d => d.symbol !== el.symbol),
      });
    } else {
      // Don't allow if already in correct reactants
      if (q.correctReactants.some(r => r.symbol === el.symbol)) return;
      onUpdate(index, {
        distractors: [...q.distractors, {
          id: el.id,
          symbol: el.symbol,
          name: el.name,
          color: el.color,
          dark: el.dark,
          atomCount: 1,
          coefficient: 1,
        }],
      });
    }
  }, [q.correctReactants, q.distractors, index, onUpdate]);

  const updateReactantValue = useCallback((typeKey, reactantIndex, patch) => {
    if (typeKey === "correct") {
      const updated = q.correctReactants.map((r, i) => i === reactantIndex ? { ...r, ...patch } : r);
      onUpdate(index, { correctReactants: updated });
    } else {
      const updated = q.distractors.map((d, i) => i === reactantIndex ? { ...d, ...patch } : d);
      onUpdate(index, { distractors: updated });
    }
  }, [q.correctReactants, q.distractors, index, onUpdate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: expanded ? "1px solid #f3f4f6" : "none" }}
        onClick={() => setExpanded(v => !v)}
      >
        <GripVertical size={14} className="text-gray-300 shrink-0" />
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "#6366f1" }}
        >
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-800 truncate">
          {q.question || <span className="text-gray-400 italic">Untitled question…</span>}
        </p>
        <div className="flex items-center gap-1">
          {/* Correct elements preview */}
          {q.correctReactants.map(el => (
            <span
              key={el.symbol}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ background: el.color }}
            >
              {el.coefficient > 1 ? el.coefficient : ""}{el.symbol}{el.atomCount > 1 ? toSubscript(el.atomCount) : ""}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={e => { e.stopPropagation(); onMoveUp(index); }}
            disabled={isFirst}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronUp size={13} className="text-gray-400" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMoveDown(index); }}
            disabled={isLast}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(index); }}
            className="p-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Card body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-5">
              {/* Question text */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Question / Prompt
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hydrogen gas burns in the presence of oxygen to form water. Which reactants do you need?"
                  value={q.question}
                  onChange={e => onUpdate(index, { question: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 resize-none"
                />
              </div>

              {/* Hint */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Hint <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Look for the lightest gas and the gas we breathe…"
                  value={q.hint}
                  onChange={e => onUpdate(index, { hint: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                />
              </div>

              {/* Reaction type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Reaction Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {REACTION_TYPES.map(rt => (
                    <button
                      key={rt.id}
                      onClick={() => onUpdate(index, { type: rt.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={{
                        borderColor: q.type === rt.id ? rt.color : "#e5e7eb",
                        background: q.type === rt.id ? `${rt.color}18` : "transparent",
                        color: q.type === rt.id ? rt.color : "#6b7280",
                      }}
                    >
                      {rt.icon} {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Correct answer elements */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <ElementPicker
                  label="✅  Correct Answer Elements (what students must place in the beaker)"
                  selected={q.correctReactants}
                  onToggle={toggleAnswerEl}
                  onUpdateValue={updateReactantValue}
                  typeKey="correct"
                  accentColor="#10b981"
                />
              </div>

              {/* Distractor elements */}
              {/* <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                <ElementPicker
                  label="🎭  Distractor Elements (shown in inventory but not part of the answer)"
                  selected={q.distractors}
                  onToggle={toggleDistractor}
                  onUpdateValue={updateReactantValue}
                  typeKey="distractor"
                  accentColor="#f59e0b"
                />
              </div> */}

              {/* Balanced equation (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Balanced Equation <span className="text-gray-400 font-normal">(for display only)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2H₂ + O₂ → 2H₂O"
                  value={q.balancedEquation}
                  onChange={e => onUpdate(index, { balancedEquation: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 font-mono"
                />
              </div>

              {/* Explanation (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Explanation / Summary <span className="text-gray-400 font-normal">(shown after student answers)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. When hydrogen burns in oxygen, each oxygen atom forms two O–H bonds, creating water (H₂O)."
                  value={q.explanation}
                  onChange={e => onUpdate(index, { explanation: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Blank question template ───────────────────────────────────────────────────
function blankQuestion(id) {
  return {
    id: `custom-${id}`,
    question: "",
    hint: "",
    type: "combination",
    correctReactants: [],   // array of element objects { id, symbol, label, name, color, dark }
    distractors: [],        // array of element objects
    balancedEquation: "",
    explanation: "",
    isCustom: true,
  };
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TeacherQuestionBuilder() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [blankQuestion(Date.now())];
  });

  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [...prev, blankQuestion(Date.now())]);
    setSaved(false);
  };

  const deleteQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const updateQuestion = (index, patch) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...patch } : q));
    setSaved(false);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setQuestions(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
    setSaved(false);
  };

  const moveDown = (index) => {
    setQuestions(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
    setSaved(false);
  };

  const handleSave = () => {
    // Validate: only include questions with at least a question text and one correct element
    const valid = questions.filter(q => q.question.trim() && q.correctReactants.length > 0);
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(valid));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearAll = () => {
    if (!window.confirm("Clear all custom questions? This cannot be undone.")) return;
    localStorage.removeItem(CUSTOM_QUESTIONS_KEY);
    setQuestions([blankQuestion(Date.now())]);
    setSaved(false);
  };

  const validCount = questions.filter(q => q.question.trim() && q.correctReactants.length > 0).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/30"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/batch3/labs/chemistry")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft size={15} /> Back to Lab
            </motion.button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <BookOpen size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none">Question Builder</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Teacher Mode · Chemistry Lab</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {validCount} of {questions.length} question{questions.length !== 1 ? "s" : ""} ready
            </span>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Eye size={13} /> Preview
            </motion.button>
          </div>
        </div>

        {/* Inline info banner */}
        <div className="px-5 py-2 bg-violet-50 border-t border-violet-100 flex items-center gap-2">
          <FlaskConical size={13} className="text-violet-500 shrink-0" />
          <p className="text-xs text-violet-700">
            Students will solve these questions in the Chemistry Lab.
            Select the <strong>correct answer elements</strong> students must combine and optionally add <strong>distractors</strong> to increase difficulty.
          </p>
        </div>
      </motion.header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                isFirst={i === 0}
                isLast={i === questions.length - 1}
              />
            ))}
          </AnimatePresence>

          {/* Add question button */}
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={addQuestion}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-2 text-sm font-semibold text-violet-500 hover:text-violet-700"
          >
            <Plus size={16} /> Add Question
          </motion.button>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-600 transition-colors underline-offset-2 hover:underline"
            >
              Clear all custom questions
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-all"
              style={{
                background: saved
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
              }}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved ? "Questions Saved!" : `Save ${validCount} Question${validCount !== 1 ? "s" : ""}`}
            </motion.button>
          </div>
        </div>
      </main>

      {/* ── Preview Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">Student Preview</p>
                  <p className="text-xs text-gray-400">How questions will appear to students</p>
                </div>
                <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
                {questions.filter(q => q.question.trim() && q.correctReactants.length > 0).length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No complete questions yet.<br/>Add a question with at least one answer element.</p>
                ) : (
                  questions.filter(q => q.question.trim() && q.correctReactants.length > 0).map((q, i) => (
                    <div key={q.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#6366f1" }}>Q{i + 1}</span>
                        <span className="text-xs text-gray-400">{REACTION_TYPES.find(r => r.id === q.type)?.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-3">{q.question}</p>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1.5">Inventory (shown to student)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...q.correctReactants, ...q.distractors].map(el => {
                            const nameText = el.coefficient > 1 ? `${el.coefficient} × ${el.name}` : el.name;
                            return (
                              <span key={el.symbol} className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ background: el.color }}>
                                {el.coefficient > 1 ? el.coefficient : ""}{el.symbol}{el.atomCount > 1 ? toSubscript(el.atomCount) : ""} — {nameText}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {q.hint && (
                        <p className="text-xs text-gray-400 mt-2 italic">💡 Hint: {q.hint}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleSave(); setPreviewOpen(false); navigate("/batch3/labs/chemistry"); }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  Save & Go to Lab
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
