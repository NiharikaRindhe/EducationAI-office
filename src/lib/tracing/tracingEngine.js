/**
 * tracingEngine.js
 *
 * Top-level public API facade for the alphabet tracing engine.
 *
 * This module is the ONLY import that the UI layer (Tracing.jsx) needs.
 * It wires together:
 *   - letterPaths.js   (letter definitions)
 *   - pathSampler.js   (SVG path → sampled points)
 *   - accuracyChecker.js (geometry / scoring)
 *   - tracingState.js  (mutable game state + subscriber)
 *
 * Coordinate contract
 * ───────────────────
 * All pointer events arrive in screen/client pixels.
 * screenToSVG() converts them to SVG viewBox space (0 0 400 400) using
 * the SVG element's CTM inverse.  Every public function that accepts a
 * point performs this conversion internally; callers always pass raw
 * screen coordinates.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Engine lifecycle
 *  ─────────────────
 *  init(svgElement)                  → void
 *  loadLetter(letterName | letterData) → void
 *
 *  Pointer event handlers (screen coordinates)
 *  ────────────────────────────────────────────
 *  handlePointerDown(screenPt)       → BeginResult
 *  handlePointerMove(screenPt)       → PointFeedback | null
 *  handlePointerUp(screenPt)         → EndResult | null
 *
 *  Named API surface (spec)
 *  ────────────────────────
 *  beginStroke(screenPt)             → BeginResult
 *  addPoint(screenPt)                → PointFeedback | null
 *  endStroke()                       → EndResult | null
 *  advanceStroke()                   → AdvanceResult
 *  getLetterAccuracy()               → AccuracyReport
 *
 *  State access
 *  ────────────
 *  getState()                        → StateSnapshot
 *  subscribe(fn)                     → unsubscribeFn
 *
 *  Render helpers (for Tracing.jsx)
 *  ─────────────────────────────────
 *  getStrokeRenderProps(strokeIndex) → StrokeRenderProps
 *  getAllStrokeRenderProps()          → StrokeRenderProps[]
 *
 *  Utilities
 *  ─────────
 *  resetCurrentStroke()              → void
 *  resetLetter()                     → void
 *  screenToSVG(screenPt)             → { x, y }
 */

import LETTERS from "./letterPaths.js";
import {
  loadLetter as stateLoadLetter,
  beginStroke as stateBeginStroke,
  addPoint as stateAddPoint,
  endStroke as stateEndStroke,
  advanceStroke as stateAdvanceStroke,
  resetCurrentStroke as stateResetStroke,
  resetLetter as stateResetLetter,
  getLetterAccuracy as stateGetLetterAccuracy,
  getState,
  subscribe,
} from "./tracingState.js";

// ─────────────────────────────────────────────────────────────────────────────
// Engine-internal state
// ─────────────────────────────────────────────────────────────────────────────

/** Reference to the mounted <svg> element; set by init() */
let _svgElement = null;

/** Cached inverse CTM for fast screen → SVG conversion */
let _inverseCTM = null;

/** Whether a pointer is currently pressed */
let _pointerDown = false;

/** rAF handle for batched pointer-move processing */
let _rafHandle = null;

/** Queued pointer-move point waiting for the next rAF flush */
let _pendingPoint = null;

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a screen/client coordinate to SVG viewBox coordinates.
 * Uses the cached inverse CTM; invalidates the cache if the SVG element
 * reference changes (e.g. after a resize observer flush).
 *
 * @param {{ x: number, y: number }} screenPt
 * @returns {{ x: number, y: number }}
 */
export function screenToSVG(screenPt) {
  if (!_svgElement) {
    // No SVG mounted yet — return the point unchanged (useful in tests)
    return { x: screenPt.x, y: screenPt.y };
  }

  // Recompute CTM every call if we don't have a cache
  // (CTM is cheap to compute; we skip the cache invalidation complexity)
  const ctm = _svgElement.getScreenCTM();
  if (!ctm) return { x: screenPt.x, y: screenPt.y };

  const inv = ctm.inverse();

  // Apply: svgPt = inv × screenPt
  const x = inv.a * screenPt.x + inv.c * screenPt.y + inv.e;
  const y = inv.b * screenPt.x + inv.d * screenPt.y + inv.f;
  return { x, y };
}

// ─────────────────────────────────────────────────────────────────────────────
// init
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register the SVG element so the engine can do coordinate conversion.
 * Must be called once after the SVG mounts (e.g. in a useEffect).
 *
 * @param {SVGSVGElement} svgElement
 */
export function init(svgElement) {
  _svgElement = svgElement;
  _inverseCTM = null; // will be recomputed on first screenToSVG call
}

// ─────────────────────────────────────────────────────────────────────────────
// loadLetter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a letter by name ("A"–"Z") or by passing a full letter definition
 * object directly.
 *
 * @param {string | object} letterNameOrData
 */
export function loadLetter(letterNameOrData) {
  const data =
    typeof letterNameOrData === "string"
      ? LETTERS[letterNameOrData.toUpperCase()]
      : letterNameOrData;

  if (!data) {
    console.warn(`[TracingEngine] Unknown letter: "${letterNameOrData}"`);
    return;
  }

  stateLoadLetter(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// beginStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to start the current stroke at the given screen position.
 *
 * @param {{ x: number, y: number }} screenPt
 * @returns {{ started: boolean, strokeId: string | null, reason: string }}
 */
export function beginStroke(screenPt) {
  const svgPt = screenToSVG(screenPt);
  return stateBeginStroke(svgPt);
}

// ─────────────────────────────────────────────────────────────────────────────
// addPoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Feed a new pointer position into the active stroke.
 * Converts to SVG space before delegating to state.
 *
 * @param {{ x: number, y: number, timestamp?: number }} screenPt
 * @returns {{ valid: boolean, progress: number, deviation: number, alignment: number } | null}
 */
export function addPoint(screenPt) {
  const svgPt = screenToSVG(screenPt);
  return stateAddPoint({ ...svgPt, timestamp: screenPt.timestamp ?? Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────────
// endStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finalise the current stroke.  Does NOT advance to the next stroke.
 *
 * @returns {{ score, coverage, deviations, tier, completed, nearEnd } | null}
 */
export function endStroke() {
  return stateEndStroke();
}

// ─────────────────────────────────────────────────────────────────────────────
// advanceStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move to the next stroke (or mark letter complete).
 *
 * @returns {{ strokeIndex: number, strokeId: string | null, letterDone: boolean }}
 */
export function advanceStroke() {
  return stateAdvanceStroke();
}

// ─────────────────────────────────────────────────────────────────────────────
// getLetterAccuracy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {{ overall: number, strokes: StrokeResult[] }}
 */
export function getLetterAccuracy() {
  return stateGetLetterAccuracy();
}

// ─────────────────────────────────────────────────────────────────────────────
// resetCurrentStroke / resetLetter
// ─────────────────────────────────────────────────────────────────────────────

export function resetCurrentStroke() {
  stateResetStroke();
}

export function resetLetter() {
  stateResetLetter();
}

// ─────────────────────────────────────────────────────────────────────────────
// Pointer event handlers  (wire directly to DOM events in Tracing.jsx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call from onPointerDown.
 * Returns the result of beginStroke() so the UI can react immediately.
 *
 * @param {PointerEvent | { clientX, clientY }} e
 * @returns {BeginResult}
 */
export function handlePointerDown(e) {
  _pointerDown = true;
  _pendingPoint = null;

  const screenPt = { x: e.clientX, y: e.clientY };
  return beginStroke(screenPt);
}

/**
 * Call from onPointerMove.
 * Uses requestAnimationFrame to batch rapid move events; only the latest
 * point per frame is processed to avoid flooding the accuracy checker.
 *
 * @param {PointerEvent | { clientX, clientY }} e
 */
export function handlePointerMove(e) {
  if (!_pointerDown) return;

  // Store the latest point; rAF will flush it
  _pendingPoint = { x: e.clientX, y: e.clientY, timestamp: e.timeStamp ?? Date.now() };

  if (!_rafHandle) {
    _rafHandle = requestAnimationFrame(_flushPendingPoint);
  }
}

/**
 * rAF callback: process the most recent pending point.
 */
function _flushPendingPoint() {
  _rafHandle = null;
  if (_pendingPoint) {
    addPoint(_pendingPoint);
    _pendingPoint = null;
  }
}

/**
 * Call from onPointerUp / onPointerCancel.
 * Flushes any pending point, then finalises the stroke.
 *
 * @param {PointerEvent | { clientX, clientY }} e
 * @returns {EndResult | null}
 */
export function handlePointerUp(e) {
  if (!_pointerDown) return null;
  _pointerDown = false;

  // Cancel any pending rAF and flush the last point immediately
  if (_rafHandle) {
    cancelAnimationFrame(_rafHandle);
    _rafHandle = null;
  }
  if (_pendingPoint) {
    addPoint(_pendingPoint);
    _pendingPoint = null;
  }

  return endStroke();
}

// ─────────────────────────────────────────────────────────────────────────────
// getStrokeRenderProps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute all SVG rendering attributes for a single stroke so Tracing.jsx
 * can apply them declaratively without knowing state internals.
 *
 * Rendering rules (spec):
 *   - Completed strokes       → full opacity, solid, locked (no interaction)
 *   - Current active stroke   → guide path visible (faint), traced portion darkening
 *   - Upcoming strokes        → very faint / hidden
 *
 * Returns two overlapping <path> props per stroke:
 *   guide  – the full ideal path shown as a faint guide
 *   trace  – the revealed (valid-traced) portion
 *
 * @param {number} strokeIndex
 * @returns {StrokeRenderProps | null}
 *
 * StrokeRenderProps = {
 *   strokeId:       string,
 *   pathD:          string,
 *   totalLength:    number,
 *
 *   // guide layer (full path, always drawn)
 *   guideOpacity:   number,   // 0–1
 *   guideStroke:    string,   // CSS color
 *
 *   // trace layer (revealed portion via dasharray/dashoffset)
 *   traceOpacity:   number,
 *   traceStroke:    string,
 *   dashArray:      string,   // e.g. "350 350"
 *   dashOffset:     number,   // stroke-dashoffset value
 *
 *   isActive:       boolean,
 *   isCompleted:    boolean,
 *   isUpcoming:     boolean,
 * }
 */
export function getStrokeRenderProps(strokeIndex) {
  const state = getState();
  const { letterData, sampledStrokes, currentStrokeIndex, strokesCompleted,
          renderState, letterAccuracy } = state;

  if (!letterData || strokeIndex >= letterData.strokes.length) return null;

  const stroke = letterData.strokes[strokeIndex];
  const sampled = sampledStrokes.get(stroke.id);
  const totalLength = sampled?.totalLength ?? 0;

  const isCompleted = letterAccuracy.strokes.some(
    (r) => r.strokeId === stroke.id && r.completed
  );
  const isActive = strokeIndex === currentStrokeIndex && !isCompleted;
  const isUpcoming = strokeIndex > currentStrokeIndex;

  // ── Guide layer ──────────────────────────────────────────────────────────
  let guideOpacity;
  let guideStroke;

  if (isCompleted) {
    guideOpacity = 1;
    guideStroke = "#1e40af"; // completed: solid dark-blue
  } else if (isActive) {
    guideOpacity = 0.55;     // clearly visible guide so user knows where to trace
    guideStroke = "#93c5fd"; // blue-300
  } else {
    guideOpacity = 0.25;     // upcoming: visible outline of the full letter
    guideStroke = "#bfdbfe"; // blue-200
  }

  // ── Trace layer ──────────────────────────────────────────────────────────
  let traceOpacity;
  let traceStroke;
  let dashOffset;

  if (isCompleted) {
    // Fully revealed; dashoffset drives reveal only for active stroke
    traceOpacity = 0; // guide layer handles completed strokes
    traceStroke = "#1e40af";
    dashOffset = 0;
  } else if (isActive) {
    traceOpacity = 1;
    traceStroke = "#2563eb"; // blue-600 as user traces
    dashOffset = renderState.dashOffset;
  } else {
    traceOpacity = 0;
    traceStroke = "transparent";
    dashOffset = totalLength;
  }

  return {
    strokeId: stroke.id,
    pathD: stroke.path,
    totalLength,

    guideOpacity,
    guideStroke,

    traceOpacity,
    traceStroke,
    dashArray: `${totalLength} ${totalLength}`,
    dashOffset,

    isActive,
    isCompleted,
    isUpcoming,
  };
}

/**
 * Convenience: render props for every stroke in the current letter.
 *
 * @returns {StrokeRenderProps[]}
 */
export function getAllStrokeRenderProps() {
  const state = getState();
  if (!state.letterData) return [];

  return state.letterData.strokes.map((_, i) => getStrokeRenderProps(i));
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export state access helpers so UI only imports from tracingEngine
// ─────────────────────────────────────────────────────────────────────────────

export { getState, subscribe };

// ─────────────────────────────────────────────────────────────────────────────
// Re-export LETTERS map for letter-picker UIs
// ─────────────────────────────────────────────────────────────────────────────

export { LETTERS };
