import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Trophy,
  Search,
  Sparkles,
  Layers,
  GraduationCap
} from "lucide-react";
import { BIOLOGY_UNITS } from "../../../../data/biologyRegistry";

export default function SidebarNav({
  activeTopicId,
  onSelectTopic,
  masteryScores = {}
}) {
  const [expandedUnits, setExpandedUnits] = useState({
    unit1: true,
    unit2: true,
    unit3: true,
    unit4: true
  });
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUnit = (unitId) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  return (
    <aside className="w-80 h-full border-r border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Biology Hub
              {/* <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                Grades 9 & 10
              </span> */}
            </h2>
            <p className="text-xs text-slate-400">Diagram & Spatial Recall Lab</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search diagrams or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Navigation Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
        {BIOLOGY_UNITS.map((unit) => {
          const isExpanded = expandedUnits[unit.id] ?? true;
          const filteredTopics = unit.topics.filter(
            (topic) =>
              topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              topic.components.some((c) =>
                c.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
          );

          if (searchQuery && filteredTopics.length === 0) return null;

          return (
            <div
              key={unit.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/30 overflow-hidden"
            >
              {/* Unit Header Button */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {unit.title}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Topics List */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-1.5 space-y-1 bg-slate-950/20"
                  >
                    {filteredTopics.map((topic) => {
                      const isActive = activeTopicId === topic.id;
                      const mastery = masteryScores[topic.id] || 0;
                      const isMastered = mastery >= 80;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => onSelectTopic(topic.id)}
                          className={`w-full p-2 rounded-lg flex items-center justify-between text-left text-xs transition-all ${
                            isActive
                              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold shadow-sm shadow-emerald-500/10"
                              : "hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isActive
                                  ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                                  : "bg-slate-600"
                              }`}
                            />
                            <span className="truncate">{topic.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          12 NCERT Diagrams
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          Interactive Quiz
        </span>
      </div>
    </aside>
  );
}
