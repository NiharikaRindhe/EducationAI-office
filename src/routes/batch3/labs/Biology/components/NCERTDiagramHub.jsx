import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  Trophy,
  RotateCcw,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import SidebarNav from "../SidebarNav";
import DiagramViewer from "../DiagramViewer";
import InfoCard from "../InfoCard";
import { getTopicById } from "../../../../../data/biologyRegistry";
import { CLR } from "../constants/bioConstants";

// ─── Compact Mode Toggle Pill ──────────────────────────────────────────────────
function ModeToggle({ mode, onStudy, onTest }) {
  return (
    <div
      className="flex items-center p-1 rounded-xl border"
      style={{ background: CLR.bg, borderColor: CLR.border }}
    >
      <button
        onClick={onStudy}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
        style={
          mode === "study"
            ? {
                background: "#10b981",
                color: "#0d1117",
                boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
              }
            : { color: CLR.muted }
        }
      >
        <Sparkles className="w-3.5 h-3.5" />
        Study Mode
      </button>
      <button
        onClick={onTest}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
        style={
          mode === "test"
            ? {
                background: "#f59e0b",
                color: "#0d1117",
                boxShadow: "0 2px 10px rgba(245,158,11,0.3)",
              }
            : { color: CLR.muted }
        }
      >
        <Brain className="w-3.5 h-3.5" />
        Quiz Mode
      </button>
    </div>
  );
}

// ─── Score Readout (Test Mode Only) ────────────────────────────────────────────
function ScoreBadge({ mode, testState, onRestart }) {
  if (mode !== "test") return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
      style={{ background: "#f59e0b10", borderColor: "#f59e0b44" }}
    >
      <Trophy className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-[10px] font-mono font-bold text-amber-300">
        {testState.score} pts · {testState.correctCount}/{testState.totalQuestions}
      </span>
      <button
        onClick={onRestart}
        className="p-0.5 hover:bg-amber-500/20 rounded transition-colors text-amber-300"
        title="Restart Quiz"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Single Unified Top Bar ───────────────────────────────────────────────────
function TopicStrip({ topic, mode, testState, onStudy, onTest, onRestart, onBack }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div
      className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 border-b select-none"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Left: Back button + Divider + Topic Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
          style={{
            color: CLR.muted,
            background: "rgba(148,163,184,0.08)",
            borderColor: CLR.border,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="h-5 w-px shrink-0" style={{ background: CLR.border }} />

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(57,211,83,0.12)" }}
        >
          <BookOpen className="w-4 h-4" style={{ color: CLR.accent }} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 truncate">
            <h1 className="text-xs font-bold truncate" style={{ color: CLR.text }}>
              {topic?.title || "Select a Topic"}
            </h1>
            {topic?.grade && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0"
                style={{
                  background: "rgba(57,211,83,0.15)",
                  color: CLR.accent,
                  borderColor: "rgba(57,211,83,0.3)",
                }}
              >
                {topic.grade}
              </span>
            )}
          </div>
          <p className="text-[10px] truncate" style={{ color: CLR.muted }}>
            {topic?.components?.length || 0} interactive regions
          </p>
        </div>
      </div>

      {/* Right: Study Mode & Quiz Mode Toggle Switch + Live Quiz Score */}
      <div className="flex items-center gap-3 shrink-0">
        <ModeToggle mode={mode} onStudy={onStudy} onTest={onTest} />
        {mode === "test" && (
          <ScoreBadge
            mode={mode}
            testState={testState}
            onRestart={onRestart}
          />
        )}
      </div>
    </div>
  );
}

// ─── Test Completed Overlay ────────────────────────────────────────────────────
function TestCompleteOverlay({ testState, topicTitle, onStudy, onRetake }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="absolute inset-0 flex items-center justify-center p-6 z-40"
      style={{ background: "rgba(13,17,23,0.92)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-6 shadow-2xl text-center space-y-5 border"
        style={{ background: CLR.panel, borderColor: CLR.accent + "44" }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border"
          style={{ background: CLR.accent + "18", borderColor: CLR.accent + "44" }}
        >
          <Trophy className="w-8 h-8" style={{ color: CLR.accent }} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold" style={{ color: CLR.text }}>
            Spatial Recall Complete!
          </h2>
          <p className="text-xs mt-1" style={{ color: CLR.muted }}>{topicTitle}</p>
        </div>

        {/* Stats grid */}
        {/* <div
          className="grid grid-cols-2 gap-3 p-4 rounded-xl border"
          style={{ background: CLR.bg, borderColor: CLR.border }}
        >
          <div>
            <div className="text-[11px]" style={{ color: CLR.muted }}>Final Score</div>
            <div className="text-lg font-bold font-mono" style={{ color: CLR.accent }}>
              {testState.score} pts
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: CLR.muted }}>Accuracy</div>
            <div className="text-lg font-bold font-mono" style={{ color: CLR.amber }}>
              {testState.totalQuestions > 0
                ? Math.round((testState.correctCount / testState.totalQuestions) * 100)
                : 0}%
            </div>
          </div>
        </div> */}

        <div className="flex gap-3">
          <button
            onClick={onStudy}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border"
            style={{ background: CLR.panel, borderColor: CLR.border, color: CLR.text }}
          >
            Review in Study Mode
          </button>
          <button
            onClick={onRetake}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg"
            style={{
              background: CLR.accent,
              color: CLR.bg,
              boxShadow: `0 4px 14px ${CLR.accent}33`,
            }}
          >
            Retake Test
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main NCERTDiagramHub Tab Component ──────────────────────────────────────
export default function NCERTDiagramHub({ active }) {
  const [activeTopicId, setActiveTopicId] = useState("animal_cell");
  const [mode, setMode] = useState("study"); // "study" | "test"
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [customAssets] = useState({});

  const [testState, setTestState] = useState({
    targetComponent: null,
    remainingComponentIds: [],
    solvedIds: [],
    score: 0,
    totalQuestions: 0,
    correctCount: 0,
    testCompleted: false,
    attemptsCount: 0,
  });

  const [masteryScores, setMasteryScores] = useState(() => {
    try {
      const saved = localStorage.getItem("ncert_bio_mastery");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentTopic = getTopicById(activeTopicId);

  // Auto-select first component on topic/mode change
  useEffect(() => {
    if (!currentTopic) return;
    if (currentTopic.components?.length > 0) {
      setSelectedComponent(currentTopic.components[0]);
    } else {
      setSelectedComponent(null);
    }
    if (mode === "test") startTestMode(currentTopic);
  }, [activeTopicId, mode]);

  const startTestMode = (topicObj) => {
    const topic = topicObj || currentTopic;
    if (!topic?.components?.length) return;
    const shuffled = [...topic.components].sort(() => 0.5 - Math.random());
    setTestState({
      targetComponent: shuffled[0],
      remainingComponentIds: shuffled.slice(1).map((c) => c.id),
      solvedIds: [],
      score: 0,
      totalQuestions: topic.components.length,
      correctCount: 0,
      testCompleted: false,
      attemptsCount: 0,
    });
    setSelectedComponent(null);
  };

  const handleAnswerSubmit = (clickedCompId, isCorrect) => {
    if (mode !== "test" || testState.testCompleted) return;

    setTestState((prev) => {
      const newAttempts = prev.attemptsCount + 1;
      let newScore = isCorrect ? prev.score + 100 : prev.score;
      let newCorrect = isCorrect ? prev.correctCount + 1 : prev.correctCount;

      if (isCorrect && prev.remainingComponentIds.length > 0) {
        const nextId = prev.remainingComponentIds[0];
        const nextComp = currentTopic.components.find((c) => c.id === nextId);
        return {
          ...prev,
          targetComponent: nextComp,
          remainingComponentIds: prev.remainingComponentIds.slice(1),
          solvedIds: [...prev.solvedIds, prev.targetComponent.id],
          score: newScore,
          correctCount: newCorrect,
          attemptsCount: newAttempts,
        };
      }

      if (isCorrect && prev.remainingComponentIds.length === 0) {
        const finalMastery = Math.round((newCorrect / prev.totalQuestions) * 100);
        setMasteryScores((pm) => {
          const updated = {
            ...pm,
            [activeTopicId]: Math.max(pm[activeTopicId] || 0, finalMastery),
          };
          try { localStorage.setItem("ncert_bio_mastery", JSON.stringify(updated)); } catch {}
          return updated;
        });
        return {
          ...prev,
          score: newScore,
          correctCount: newCorrect,
          solvedIds: [...prev.solvedIds, prev.targetComponent.id],
          testCompleted: true,
          attemptsCount: newAttempts,
        };
      }

      return { ...prev, attemptsCount: newAttempts };
    });
  };

  if (!active) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: CLR.bg }}>
      {/* ── Compact Topic Strip / Mode Bar ─────────────────── */}
      <TopicStrip
        topic={currentTopic}
        mode={mode}
        testState={testState}
        masteryScores={masteryScores}
        onStudy={() => setMode("study")}
        onTest={() => setMode("test")}
        onRestart={() => startTestMode(currentTopic)}
      />

      {/* ── Main 3-column workspace ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar Nav */}
        <SidebarNav
          activeTopicId={activeTopicId}
          onSelectTopic={(id) => setActiveTopicId(id)}
          masteryScores={masteryScores}
        />

        {/* Center: Diagram Viewer */}
        <main className="flex-1 relative overflow-hidden flex flex-col" style={{ background: CLR.bg }}>
          <DiagramViewer
            topic={currentTopic}
            mode={mode}
            selectedComponent={selectedComponent}
            onSelectComponent={(comp) => setSelectedComponent(comp)}
            targetComponent={testState.targetComponent}
            onAnswerSubmit={handleAnswerSubmit}
            customAssetUrl={customAssets[activeTopicId]}
            solvedIds={testState.solvedIds || []}
          />

          {/* Test Complete Overlay */}
          <AnimatePresence>
            {mode === "test" && testState.testCompleted && (
              <TestCompleteOverlay
                testState={testState}
                topicTitle={currentTopic?.title}
                onStudy={() => setMode("study")}
                onRetake={() => startTestMode(currentTopic)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Right: InfoCard (Study Mode only) */}
        <AnimatePresence>
          {mode === "study" && selectedComponent && (
            <InfoCard
              component={selectedComponent}
              topicTitle={currentTopic?.title}
              onClose={() => setSelectedComponent(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
