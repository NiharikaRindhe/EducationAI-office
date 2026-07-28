import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import REACTIONS from "./Reactions";
import { COMPOUND_RECIPES } from "./ElementDb";
import REACTION_TYPES from "./constants/REACTION_TYPES";
import { checkAnswer, buildFormulaString } from "./utils/formulaUtils";

// Layout panels
import LabHeader from "./components/LabHeader";
import InventoryPanel from "./components/InventoryPanel";
import BeakerSection from "./components/BeakerSection";
import ReactionTypesPanel from "./components/ReactionTypesPanel";

// Modals
import ExplanationModal from "./components/ExplanationModal";
import CompoundInfoModal from "./components/CompoundInfoModal";
import CraftFailureModal from "./components/CraftFailureModal";
import FreeReactionModal from "./components/FreeReactionModal";
import ResultsScreen from "./components/ResultsScreen";

// The standalone FastAPI service this lab shipped against now lives inside the
// platform API (api/src/services/chemistryLab.service.ts). Same endpoint names
// and same request/response shapes, so only the base URL changes here — plus
// the bearer token every authenticated platform route requires.
const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api"}/student/chemistry`;
const authHeaders = () => {
  const token = localStorage.getItem("eduai_access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function Lab() {
  const navigate = useNavigate();

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [questionIndex, setQuestionIndex] = useState(0);
  const [beaker, setBeaker] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | wrong | correct
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ── Crafting state ────────────────────────────────────────────────────────
  // craftedCompounds persists across question navigation so students can use
  // compounds they've crafted in the Free Lab at any time.
  const [craftedCompounds, setCraftedCompounds] = useState([]);
  const [craftingBeaker, setCraftingBeaker] = useState([]);
  const [moleculeCount, setMoleculeCount] = useState(1);
  const [builderMoleculeCount, setBuilderMoleculeCount] = useState(1);
  const [activeTab, setActiveTab] = useState("builder");
  const [craftingStatus, setCraftingStatus] = useState("idle");
  const [craftedMessage, setCraftedMessage] = useState("");

  // ── AI compound info state ────────────────────────────────────────────────
  const [isCrafting, setIsCrafting] = useState(false);
  const [compoundInfoData, setCompoundInfoData] = useState(null);
  const [showCompoundInfo, setShowCompoundInfo] = useState(false);
  const [showCraftFailure, setShowCraftFailure] = useState(false);
  const [craftFailureReason, setCraftFailureReason] = useState("");
  const [failedElements, setFailedElements] = useState([]);

  // ── Free Lab state ──────────────────────────────────────────────────────
  const [freeBeaker, setFreeBeaker] = useState([]);
  const [freeMoleculeCount, setFreeMoleculeCount] = useState(1);
  const [isFreeReacting, setIsFreeReacting] = useState(false);
  const [freeReactionData, setFreeReactionData] = useState(null);
  const [showFreeResult, setShowFreeResult] = useState(false);

  // ── Load custom questions from localStorage, fallback to default REACTIONS ──
  const toSubscript = (num) => {
    const subs = {
      "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
      "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
    };
    return String(num).split("").map(c => subs[c] || c).join("");
  };

  const questionsList = (() => {
    const defaultQuestions = REACTIONS;
    let customQuestions = [];

    try {
      const stored = localStorage.getItem("chem_lab_custom_questions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customQuestions = parsed.map((q, idx) => ({
            id: q.id || `custom-${idx}`,
            type: q.isCustom ? "custom" : (q.type || "combination"),
            question: q.question,
            hint: q.hint || "",
            equation: {
              reactants: q.correctReactants.map(r => `${r.coefficient > 1 ? r.coefficient : ""}${r.symbol}${r.atomCount > 1 ? toSubscript(r.atomCount) : ""}`),
              arrow: "→",
              products: [q.balancedEquation ? q.balancedEquation.split("→")[1]?.trim() || "Product" : "Product"],
              balanced: q.balancedEquation || `${q.correctReactants.map(r => `${r.coefficient > 1 ? r.coefficient : ""}${r.symbol}${r.atomCount > 1 ? toSubscript(r.atomCount) : ""}`).join(" + ")} → Product`
            },
            correctReactants: q.correctReactants.map(r => `${r.symbol}${r.atomCount > 1 ? r.atomCount : ""}`),
            inventory: [
              ...q.correctReactants.map(r => ({
                id: `${r.symbol}${r.atomCount > 1 ? r.atomCount : ""}`,
                label: `${r.symbol}${r.atomCount > 1 ? toSubscript(r.atomCount) : ""}`,
                name: r.coefficient > 1 ? `${r.coefficient} × ${r.name}` : r.name,
                color: r.color,
                dark: r.dark,
                symbol: r.symbol,
                atomicNum: r.atomicNum
              })),
              ...q.distractors.map(d => ({
                id: `${d.symbol}${d.atomCount > 1 ? d.atomCount : ""}`,
                label: `${d.symbol}${d.atomCount > 1 ? toSubscript(d.atomCount) : ""}`,
                name: d.coefficient > 1 ? `${d.coefficient} × ${d.name}` : d.name,
                color: d.color,
                dark: d.dark,
                symbol: d.symbol,
                atomicNum: d.atomicNum
              }))
            ],
            explanation: {
              summary: `${(q.type || "custom").charAt(0).toUpperCase() + (q.type || "custom").slice(1)} Reaction`,
              mechanism: [q.explanation || "Correct reaction combined successfully!"],
              realWorld: "",
              energyType: ""
            }
          }));
        }
      }
    } catch (e) {
      console.error("Error loading custom questions:", e);
    }

    return [...defaultQuestions, ...customQuestions];
  })();

  // ── Derived ───────────────────────────────────────────────────────────────
  const reaction = questionsList[questionIndex] || questionsList[0];
  const typeMeta = REACTION_TYPES[reaction.type];
  const totalQuestions = questionsList.length;
  const hasCompoundsInInventory = reaction.inventory.some(
    item => COMPOUND_RECIPES[item.id] !== undefined
  );

  // ── Beaker actions ────────────────────────────────────────────────────────
  const addToBeaker = (item) => {
    if (beaker.find(b => b.id === item.id)) return;
    const match = item.id.match(/^([A-Za-z]+)(\d+)$/);
    const defaultAtomCount = match ? parseInt(match[2], 10) : 1;
    setBeaker(prev => [...prev, { ...item, atomCount: defaultAtomCount, coefficient: 1 }]);
    setStatus("idle");
  };
  const removeFromBeaker = (index) => { setBeaker(prev => prev.filter((_, i) => i !== index)); setStatus("idle"); };
  const clearBeaker = () => { setBeaker([]); setStatus("idle"); setBuilderMoleculeCount(1); };

  /** Update the stoichiometric coefficient of one substance in the reaction beaker. */
  const updateCoefficient = (index, newCoeff) => {
    const clamped = Math.max(1, Math.min(9, newCoeff));
    setBeaker(prev => prev.map((el, i) => i === index ? { ...el, coefficient: clamped } : el));
  };

  /** Update the atomCount subscript of one element in the reaction builder beaker,
   *  dynamically updating its ID so that it matches checking logic (e.g. H + subscript 2 -> ID "H2").
   */
  const updateBuilderAtomCount = (index, newCount) => {
    const clamped = Math.max(1, Math.min(9, newCount));
    setBeaker(prev => prev.map((el, i) => {
      if (i === index) {
        const baseSymbol = el.symbol || el.id.replace(/\d+$/, "");
        const newId = `${baseSymbol}${clamped > 1 ? clamped : ""}`;
        return { ...el, id: newId, atomCount: clamped };
      }
      return el;
    }));
  };


  // ── Free Lab beaker actions ─────────────────────────────────────────────
  const addToFreeBeaker = (item) => {
    if (freeBeaker.find(b => b.id === item.id)) return;
    setFreeBeaker(prev => [...prev, { ...item, atomCount: 1, coefficient: 1 }]);
  };
  const removeFromFreeBeaker = (index) => setFreeBeaker(prev => prev.filter((_, i) => i !== index));
  const clearFreeBeaker = () => { setFreeBeaker([]); setFreeMoleculeCount(1); };

  const updateFreeCoefficient = (index, newCoeff) => {
    const clamped = Math.max(1, Math.min(9, newCoeff));
    setFreeBeaker(prev => prev.map((el, i) => i === index ? { ...el, coefficient: clamped } : el));
  };

  /** Update the atomCount subscript of one element in the free beaker (e.g. H → H₂). */
  const updateFreeAtomCount = (index, newCount) => {
    const clamped = Math.max(1, Math.min(9, newCount));
    setFreeBeaker(prev => prev.map((el, i) => i === index ? { ...el, atomCount: clamped } : el));
  };

  /** Call the /free_react API with whatever is in the free beaker. */
  const handleFreeReact = async () => {
    if (freeBeaker.length === 0) return;
    setIsFreeReacting(true);
    try {
      // Build per-substance formula strings that encode both atomCount (subscript)
      // and the shared molecule coefficient: e.g. 2H₂O → "2H2O"
      const reactants = freeBeaker.map(b => {
        const atomPart = `${b.symbol || b.id}${(b.atomCount ?? 1) > 1 ? (b.atomCount) : ""}`;
        const molPrefix = freeMoleculeCount > 1 ? freeMoleculeCount : "";
        return `${molPrefix}${atomPart}`;
      });
      const res = await fetch(`${API}/free_react`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reactants }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setFreeReactionData(data);
      setShowFreeResult(true);
    } catch (err) {
      console.error("Free react failed:", err);
    } finally {
      setIsFreeReacting(false);
    }
  };

  // ── Crafting beaker actions ───────────────────────────────────────────────
  const addToCraftingBeaker = (item) => {
    if (craftingBeaker.find(b => b.id === item.id)) return;
    setCraftingBeaker(prev => [...prev, { ...item, atomCount: 1 }]);
    setCraftingStatus("idle");
  };
  const removeFromCraftingBeaker = (index) => { setCraftingBeaker(prev => prev.filter((_, i) => i !== index)); setCraftingStatus("idle"); };
  const clearCraftingBeaker = () => { setCraftingBeaker([]); setMoleculeCount(1); setCraftingStatus("idle"); };

  /** Update the atomCount of one element in the crafting beaker. */
  const updateAtomCount = (index, newCount) => {
    const clamped = Math.max(1, Math.min(9, newCount));
    setCraftingBeaker(prev => prev.map((el, i) => i === index ? { ...el, atomCount: clamped } : el));
  };

  // ── Craft compound (calls AI) ─────────────────────────────────────────────
  const handleCraftCompound = async () => {
    const ids = craftingBeaker.map(b => b.id);
    if (ids.length === 0) return;

    // Build a fingerprint from the crafter beaker: { elementId → atomCount }
    // e.g. [{id:"H", atomCount:2}, {id:"O", atomCount:2}] → { H:"2", O:"2" }
    const beakerFingerprint = Object.fromEntries(
      craftingBeaker.map(el => [el.id, el.atomCount ?? 1])
    );

    // Local check: does the combination match any compound in the current reaction inventory?
    const matched = reaction.inventory.find(item => {
      const recipe = COMPOUND_RECIPES[item.id];
      if (!recipe) return false;

      // If the recipe has atomCounts, do an exact per-element count match
      if (recipe.atomCounts) {
        const recipeElems = Object.keys(recipe.atomCounts).sort();
        const beakerElems = Object.keys(beakerFingerprint).sort();
        if (recipeElems.join(",") !== beakerElems.join(",")) return false;
        return recipeElems.every(el => recipe.atomCounts[el] === beakerFingerprint[el]);
      }

      // Fallback: element-set match (for any recipe without atomCounts)
      return [...ids].sort().join(",") === [...recipe.elements].sort().join(",");
    });

    if (matched) {
      setCraftingBeaker([]);
    }

    setIsCrafting(true);
    setCraftingStatus("idle");

    try {
      const elementNames = craftingBeaker.map(b => b.symbol || b.id);
      const attemptedFormula = buildFormulaString(craftingBeaker, moleculeCount);

      const res = await fetch(`${API}/craft_compound`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ elements: elementNames, attempted_formula: attemptedFormula }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data.success) {
        // Add to craftedCompounds — use matched.id if it's a known recipe compound,
        // otherwise derive an id from the formula returned by the API so it still
        // shows up in the Free Lab Components list.
        const compoundId = matched?.id ?? (data.formula || attemptedFormula);
        setCraftedCompounds(prev => prev.includes(compoundId) ? prev : [...prev, compoundId]);
        setCompoundInfoData(data);
        setShowCompoundInfo(true);
        setCraftingStatus(matched ? "success" : "unsupported");
        setCraftedMessage(
          matched
            ? `Crafted ${data.compound_name} — added to inventory!`
            : `${data.compound_name} crafted! Added to Free Lab components.`
        );
      } else {
        setFailedElements(elementNames);
        setCraftFailureReason(data.failure_reason);
        setShowCraftFailure(true);
        setCraftingStatus("wrong");
        setCraftedMessage("These elements don't form a stable compound.");
      }
    } catch {
      // Graceful fallback if API is unreachable
      if (matched) {
        setCraftedCompounds(prev => prev.includes(matched.id) ? prev : [...prev, matched.id]);
        const compound = COMPOUND_RECIPES[matched.id];
        setCraftingStatus("success");
        setCraftedMessage(`Crafted ${compound.label} (${compound.name})!`);
      } else {
        setCraftingStatus("wrong");
        setCraftedMessage("No compound matches this combination. (AI unavailable)");
      }
    } finally {
      setIsCrafting(false);
    }
  };

  // ── Reaction check ────────────────────────────────────────────────────────
  const checkReaction = () => {
    // Compare the IDs of items currently in the beaker against the
    // reaction's correctReactants list (order-independent).
    const beakerIds = beaker.map(item => item.id);
    const correct = checkAnswer(beakerIds, reaction.correctReactants);

    if (correct) {
      setStatus("correct");
      setScore(prev => prev + 1);
      setTimeout(() => setShowExplanation(true), 400);
    } else {
      setStatus("wrong");
      setAttempts(prev => prev + 1);
    }
  };



  // ── Navigation ────────────────────────────────────────────────────────────
  const resetQuestion = () => {
    setBeaker([]); setStatus("idle"); setAttempts(0); setShowHint(false);
    setBuilderMoleculeCount(1);
    // craftedCompounds intentionally NOT reset here — compounds persist across questions
    // so students can use them in Free Lab at any time.
    setCraftingBeaker([]); setMoleculeCount(1); setCraftingStatus("idle");
    setActiveTab("builder");
  };

  const goToNext = () => {
    setShowExplanation(false);
    if (questionIndex + 1 >= totalQuestions) {
      setShowResults(true);
    } else {
      setQuestionIndex(prev => prev + 1);
      resetQuestion();
    }
  };

  const handleRestart = () => {
    setQuestionIndex(0); setScore(0); setShowResults(false);
    setCraftedCompounds([]); // clear crafted compounds on full restart only
    resetQuestion();
  };

  const handleSelectReactionType = (typeKey) => {
    if (typeKey === "custom") {
      const customStartIndex = questionsList.findIndex(q => q.id?.startsWith?.("custom-"));
      if (customStartIndex !== -1) {
        setQuestionIndex(customStartIndex);
        resetQuestion();
        return;
      }
    }

    const index = questionsList.findIndex(r => r.type === typeKey);
    if (index !== -1) { setQuestionIndex(index); resetQuestion(); }
  };

  // ── Results screen ────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <ResultsScreen
        score={score}
        total={totalQuestions}
        onRestart={handleRestart}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExplanation && (
          <ExplanationModal
            reaction={reaction}
            onNext={goToNext}
            onClose={() => setShowExplanation(false)}
            isLastQuestion={questionIndex + 1 >= totalQuestions}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompoundInfo && compoundInfoData && (
          <CompoundInfoModal
            data={compoundInfoData}
            onClose={() => { setShowCompoundInfo(false); setCompoundInfoData(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFreeResult && freeReactionData && (
          <FreeReactionModal
            data={freeReactionData}
            reactantLabels={freeBeaker.map(b => {
              const atomPart = `${b.symbol || b.id}${(b.atomCount ?? 1) > 1 ? (b.atomCount) : ""}`;
              const molPrefix = freeMoleculeCount > 1 ? freeMoleculeCount : "";
              return `${molPrefix}${atomPart}`;
            })}
            onClose={() => { setShowFreeResult(false); setFreeReactionData(null); clearFreeBeaker(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCraftFailure && (
          <CraftFailureModal
            reason={craftFailureReason}
            elements={failedElements}
            onClose={() => setShowCraftFailure(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LabHeader
        navigate={navigate}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        score={score}
      />

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <main className={`flex-1 min-h-0 w-full px-4 py-3 grid grid-cols-1 ${activeTab === "free" ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-[260px_1fr_300px]"
        } gap-3 overflow-hidden`}>

        <InventoryPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasCompoundsInInventory={hasCompoundsInInventory}
          craftingBeaker={craftingBeaker}
          addToCraftingBeaker={addToCraftingBeaker}
          craftedCompounds={craftedCompounds}
          reactionInventory={reaction.inventory}
          beaker={beaker}
          addToBeaker={addToBeaker}
          setCraftingStatus={setCraftingStatus}
          freeBeaker={freeBeaker}
          addToFreeBeaker={addToFreeBeaker}
        />

        <BeakerSection
          reaction={reaction}
          typeMeta={typeMeta}
          questionIndex={questionIndex}
          attempts={attempts}
          showHint={showHint}
          setShowHint={setShowHint}
          beaker={beaker}
          removeFromBeaker={removeFromBeaker}
          clearBeaker={clearBeaker}
          checkReaction={checkReaction}
          status={status}
          updateCoefficient={updateCoefficient}
          updateBeakerAtomCount={updateBuilderAtomCount}
          builderMoleculeCount={builderMoleculeCount}
          setBuilderMoleculeCount={setBuilderMoleculeCount}
          activeTab={activeTab}
          craftingBeaker={craftingBeaker}
          removeFromCraftingBeaker={removeFromCraftingBeaker}
          clearCraftingBeaker={clearCraftingBeaker}
          handleCraftCompound={handleCraftCompound}
          craftingStatus={craftingStatus}
          craftedMessage={craftedMessage}
          isCrafting={isCrafting}
          moleculeCount={moleculeCount}
          setMoleculeCount={setMoleculeCount}
          updateAtomCount={updateAtomCount}
          freeBeaker={freeBeaker}
          removeFromFreeBeaker={removeFromFreeBeaker}
          clearFreeBeaker={clearFreeBeaker}
          updateFreeCoefficient={updateFreeCoefficient}
          updateFreeAtomCount={updateFreeAtomCount}
          freeMoleculeCount={freeMoleculeCount}
          setFreeMoleculeCount={setFreeMoleculeCount}
          handleFreeReact={handleFreeReact}
          isFreeReacting={isFreeReacting}
          onNext={goToNext}
          setShowExplanation={setShowExplanation}
          isLastQuestion={questionIndex + 1 >= totalQuestions}
        />

        {activeTab !== "free" && (
          <ReactionTypesPanel
            currentType={reaction.type}
            onSelectType={handleSelectReactionType}
          />
        )}

      </main>

    </div>
  );
}
