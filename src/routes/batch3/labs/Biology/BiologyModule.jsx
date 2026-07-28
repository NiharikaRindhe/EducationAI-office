import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Award
} from "lucide-react";
import SidebarNav from "./SidebarNav";
import DiagramViewer from "./DiagramViewer";
import InfoCard from "./InfoCard";
import { BIOLOGY_UNITS, getTopicById } from "../../../../data/biologyRegistry";

export default function BiologyModule() {
  const navigate = useNavigate();

  // State
  const [activeTopicId, setActiveTopicId] = useState("animal_cell");
  const [mode, setMode] = useState("study"); // "study" | "test"
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Test Mode State
  const [testState, setTestState] = useState({
    targetComponent: null,
    remainingComponentIds: [],
    score: 0,
    totalQuestions: 0,
    correctCount: 0,
    testCompleted: false,
    attemptsCount: 0
  });

  // Topic Mastery Scores: { [topicId]: scorePercentage }
  const [masteryScores, setMasteryScores] = useState(() => {
    try {
      const saved = localStorage.getItem("ncert_bio_mastery");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Custom asset overrides uploaded locally
  const [customAssets, setCustomAssets] = useState({});

  const currentTopic = getTopicById(activeTopicId);

  // Initialize or reset when activeTopicId or mode changes
  useEffect(() => {
    if (!currentTopic) return;

    // Set first component as selected by default in Study Mode
    if (currentTopic.components && currentTopic.components.length > 0) {
      setSelectedComponent(currentTopic.components[0]);
    } else {
      setSelectedComponent(null);
    }

    // Reset Test Mode when switching topics or modes
    if (mode === "test") {
      startTestMode(currentTopic);
    }
  }, [activeTopicId, mode]);

  const startTestMode = (topicObj) => {
    const topic = topicObj || currentTopic;
    if (!topic || !topic.components || topic.components.length === 0) return;

    const shuffled = [...topic.components].sort(() => 0.5 - Math.random());
    setTestState({
      targetComponent: shuffled[0],
      remainingComponentIds: shuffled.slice(1).map((c) => c.id),
      score: 0,
      totalQuestions: topic.components.length,
      correctCount: 0,
      testCompleted: false,
      attemptsCount: 0
    });
    setSelectedComponent(null);
  };

  const handleAnswerSubmit = (clickedCompId, isCorrect) => {
    if (mode !== "test" || testState.testCompleted) return;

    setTestState((prev) => {
      const newAttempts = prev.attemptsCount + 1;
      let newScore = prev.score;
      let newCorrect = prev.correctCount;

      if (isCorrect) {
        newCorrect += 1;
        newScore += 100;
      }

      // Check if more questions remain
      if (isCorrect && prev.remainingComponentIds.length > 0) {
        const nextId = prev.remainingComponentIds[0];
        const nextComp = currentTopic.components.find((c) => c.id === nextId);

        return {
          ...prev,
          targetComponent: nextComp,
          remainingComponentIds: prev.remainingComponentIds.slice(1),
          score: newScore,
          correctCount: newCorrect,
          attemptsCount: newAttempts
        };
      } else if (isCorrect && prev.remainingComponentIds.length === 0) {
        // Test Completed!
        const finalMastery = Math.round((newCorrect / prev.totalQuestions) * 100);
        
        // Save mastery score
        setMasteryScores((prevMastery) => {
          const updated = {
            ...prevMastery,
            [activeTopicId]: Math.max(prevMastery[activeTopicId] || 0, finalMastery)
          };
          try {
            localStorage.setItem("ncert_bio_mastery", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        return {
          ...prev,
          score: newScore,
          correctCount: newCorrect,
          testCompleted: true,
          attemptsCount: newAttempts
        };
      }

      return {
        ...prev,
        attemptsCount: newAttempts
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left branding & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                NCERT Biology Diagram Hub
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                  {currentTopic?.grade}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {currentTopic?.title}
              </p>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setMode("study")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "study"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Study Mode
          </button>
          <button
            onClick={() => setMode("test")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "test"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Memory / Test Mode
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <SidebarNav
          activeTopicId={activeTopicId}
          onSelectTopic={(id) => setActiveTopicId(id)}
          masteryScores={masteryScores}
        />

        {/* Interactive Diagram Viewer Canvas */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
          <DiagramViewer
            topic={currentTopic}
            mode={mode}
            selectedComponent={selectedComponent}
            onSelectComponent={(comp) => setSelectedComponent(comp)}
            targetComponent={testState.targetComponent}
            onAnswerSubmit={handleAnswerSubmit}
            customAssetUrl={customAssets[activeTopicId]}
          />

          {/* Test Completed Overlay Card */}
          <AnimatePresence>
            {mode === "test" && testState.testCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-40"
              >
                <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-100">
                      Spatial Recall Test Completed!
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentTopic?.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400">Final Score</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono">
                        {testState.score} pts
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Accuracy</div>
                      <div className="text-lg font-bold text-amber-400 font-mono">
                        {Math.round((testState.correctCount / testState.totalQuestions) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode("study")}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                    >
                      Review in Study Mode
                    </button>
                    <button
                      onClick={() => startTestMode(currentTopic)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right InfoCard Drawer (Active in Study Mode) */}
        {mode === "study" && selectedComponent && (
          <InfoCard
            component={selectedComponent}
            topicTitle={currentTopic?.title}
            onClose={() => setSelectedComponent(null)}
          />
        )}
      </div>
    </div>
  );
}
