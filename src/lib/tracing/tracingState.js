/**
 * tracingState.js
 *
 * Centralised, mutable game state for the tracing engine.
 * This module owns the canonical state object and exposes mutation functions
 * that keep it consistent.  It never touches the DOM.
 *
 * All coordinate values are in SVG viewBox space (0 0 400 400).
 * The rendering layer (Tracing.jsx) reads state to drive SVG attributes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * State shape
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * gameState = {
 *   // Which letter is loaded
 *   currentLetter:     string | null,          // "A" … "Z"
 *   letterData:        LetterDef | null,        // from letterPaths.js
 *   sampledStrokes:    Map<strokeId, SampledPath>,  // from pathSampler
 *
 *   // Stroke progress
 *   currentStrokeIndex: number,                // 0-based
 *   strokesCompleted:   StrokeResult[],        // one per finished stroke
 *
 *   // Active tracing session
 *   isTracing:          boolean,
 *   lockedStrokeId:     string | null,         // which stroke is being traced
 *   currentStrokePoints: InputPoint[],         // { x, y, timestamp }
 *   maxIndexReached:    number,                // furthest sample index hit
 *
 *   // Per-point rendering data (updated each addPoint call)
 *   renderState: {
 *     validSegments:   boolean[],   // one flag per sample index: valid trace?
 *     dashOffset:      number,      // stroke-dashoffset for current stroke
 *     progress:        number,      // 0–1 fraction of current stroke covered
 *   },
 *
 *   // Accumulated letter accuracy
 *   letterAccuracy: {
 *     strokes: StrokeResult[],
 *     overall: number,              // 0–100, mean of completed stroke scores
 *   },
 *
 *   // Lifecycle status
 *   status: "idle" | "active" | "stroke_complete" | "letter_complete",
 * }
 *
 * StrokeResult = {
 *   strokeId:   string,
 *   score:      number,   // 0–100
 *   coverage:   number,   // 0–100
 *   deviations: number,   // average px
 *   tier:       string,   // "perfect" | "acceptable" | "retry" | "invalid"
 *   completed:  boolean,
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { sampleLetter } from "./pathSampler.js";
import {
  calculateAccuracy,
  realtimePointFeedback,
  isNearStrokeStart,
  isNearStrokeEnd,
  scoreTier,
  THRESHOLDS,
} from "./accuracyChecker.js";

// ─────────────────────────────────────────────────────────────────────────────
// Initial state factory  (always build fresh copies — never mutate the default)
// ─────────────────────────────────────────────────────────────────────────────

function makeInitialState() {
  return {
    currentLetter: null,
    letterData: null,
    sampledStrokes: new Map(),

    currentStrokeIndex: 0,
    strokesCompleted: [],

    isTracing: false,
    lockedStrokeId: null,
    currentStrokePoints: [],
    maxIndexReached: 0,

    renderState: {
      validSegments: [],   // boolean[]
      dashOffset: 0,
      progress: 0,
    },

    letterAccuracy: {
      strokes: [],
      overall: 0,
    },

    status: "idle",
  };
}

// The single mutable state object for the session
let _state = makeInitialState();

// Subscriber list for reactive UI updates
const _subscribers = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Notify all subscribers with a shallow copy of current state */
function _notify() {
  const snapshot = getState();
  for (const fn of _subscribers) fn(snapshot);
}

/** Return the stroke definition at the current index (or null) */
function _currentStrokeDef() {
  const { letterData, currentStrokeIndex } = _state;
  if (!letterData) return null;
  return letterData.strokes[currentStrokeIndex] ?? null;
}

/** Recalculate letterAccuracy.overall from all stroke results */
function _recalcOverall() {
  const results = _state.letterAccuracy.strokes;
  if (results.length === 0) {
    _state.letterAccuracy.overall = 0;
    return;
  }
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  _state.letterAccuracy.overall = sum / results.length;
}

/**
 * Build the validSegments array and compute dashOffset for the current stroke.
 * validSegments[i] = true means the user traced near sample point i correctly.
 */
function _updateRenderState(feedback) {
  const { maxIndexReached, renderState, sampledStrokes, lockedStrokeId } = _state;
  if (!lockedStrokeId) return;

  const sampled = sampledStrokes.get(lockedStrokeId);
  if (!sampled) return;

  const totalPts = sampled.points.length;
  const totalLen = sampled.totalLength;

  // Grow validSegments array if needed
  if (renderState.validSegments.length !== totalPts) {
    renderState.validSegments = new Array(totalPts).fill(false);
  }

  // Mark the nearest index as valid if this point passed both checks
  if (feedback && feedback.valid) {
    renderState.validSegments[feedback.nearestIndex] = true;
  }

  // Progress = how far along the path the user has reached
  renderState.progress = maxIndexReached / Math.max(totalPts - 1, 1);

  // stroke-dashoffset: totalLength → 0 as user advances
  // We reveal only to the max index reached, not further
  const revealedLength =
    sampled.points[maxIndexReached]?.distanceFromStart ?? 0;
  renderState.dashOffset = totalLen - revealedLength;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: state access
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a shallow snapshot of the current state.
 * Callers should not mutate the returned object.
 */
export function getState() {
  return { ..._state };
}

/**
 * Subscribe to state changes.  The callback receives a snapshot on every change.
 * Returns an unsubscribe function.
 *
 * @param {(state: object) => void} fn
 * @returns {() => void}
 */
export function subscribe(fn) {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// loadLetter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise state for a new letter.
 * Pre-samples all strokes (results are cached by pathSampler).
 *
 * @param {LetterDef} letterData  – one entry from letterPaths.js
 */
export function loadLetter(letterData) {
  _state = makeInitialState();
  _state.currentLetter = letterData.name;
  _state.letterData = letterData;
  _state.sampledStrokes = sampleLetter(letterData);
  _state.status = "active";

  // Pre-size validSegments for the first stroke
  const firstStroke = letterData.strokes[0];
  if (firstStroke) {
    const sampled = _state.sampledStrokes.get(firstStroke.id);
    if (sampled) {
      _state.renderState.validSegments = new Array(sampled.points.length).fill(false);
      _state.renderState.dashOffset = sampled.totalLength; // fully hidden initially
    }
  }

  _notify();
}

// ─────────────────────────────────────────────────────────────────────────────
// beginStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to start capturing the current stroke.
 * The start point must be within START_RADIUS_PX of the stroke's startPoint.
 *
 * @param {{ x:number, y:number }} startPoint  – in SVG coordinate space
 * @returns {{ started: boolean, strokeId: string | null, reason: string }}
 */
export function beginStroke(startPoint) {
  const strokeDef = _currentStrokeDef();

  if (!strokeDef) {
    return { started: false, strokeId: null, reason: "no_stroke_available" };
  }

  if (!isNearStrokeStart(startPoint, strokeDef)) {
    return {
      started: false,
      strokeId: null,
      reason: "too_far_from_start",
      distanceToStart:
        Math.hypot(
          startPoint.x - strokeDef.startPoint.x,
          startPoint.y - strokeDef.startPoint.y
        ),
    };
  }

  // Lock to this stroke
  _state.isTracing = true;
  _state.lockedStrokeId = strokeDef.id;
  _state.currentStrokePoints = [{ ...startPoint, timestamp: Date.now() }];
  _state.maxIndexReached = 0;

  // Reset render state for this stroke
  const sampled = _state.sampledStrokes.get(strokeDef.id);
  _state.renderState = {
    validSegments: new Array(sampled?.points.length ?? 0).fill(false),
    dashOffset: sampled?.totalLength ?? 0,
    progress: 0,
  };

  _notify();
  return { started: true, strokeId: strokeDef.id, reason: "ok" };
}

// ─────────────────────────────────────────────────────────────────────────────
// addPoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Feed a new pointer position into the active stroke.
 * Filters duplicates (< MIN_POINT_DISTANCE_PX) and returns real-time feedback.
 *
 * @param {{ x:number, y:number, timestamp?:number }} point – SVG coordinates
 * @returns {{
 *   valid:        boolean,
 *   progress:     number,   // 0–1
 *   deviation:    number,
 *   alignment:    number,
 * } | null}  null if not currently tracing
 */
export function addPoint(point) {
  if (!_state.isTracing || !_state.lockedStrokeId) return null;

  const pts = _state.currentStrokePoints;
  const incoming = { x: point.x, y: point.y, timestamp: point.timestamp ?? Date.now() };

  // Minimum distance filter — discard near-duplicate points
  if (pts.length > 0) {
    const last = pts[pts.length - 1];
    const d = Math.hypot(incoming.x - last.x, incoming.y - last.y);
    if (d < THRESHOLDS.MIN_POINT_DISTANCE_PX) return null;
  }

  pts.push(incoming);

  const sampled = _state.sampledStrokes.get(_state.lockedStrokeId);
  if (!sampled) return null;

  // Real-time per-point feedback
  // Pass the current maxIndexReached as windowStart so the nearest-point
  // search is restricted to the "ahead" portion of the path.
  // This prevents closed paths (O, Q) from snapping to the physically-close
  // far end of the circle immediately after the user touches the start.
  const feedback = realtimePointFeedback(incoming, pts, sampled, _state.maxIndexReached);

  // Advance maxIndexReached, but cap the jump per point to MAX_INDEX_JUMP
  // so a single noisy pointer event can't leap across the entire circle.
  if (feedback.nearestIndex > _state.maxIndexReached) {
    const capped = Math.min(
      feedback.nearestIndex,
      _state.maxIndexReached + THRESHOLDS.MAX_INDEX_JUMP
    );
    _state.maxIndexReached = capped;
  }

  _updateRenderState(feedback);
  _notify();

  return {
    valid: feedback.valid,
    progress: feedback.progress,
    deviation: feedback.deviation,
    alignment: feedback.alignment,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// endStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finalise the current stroke and compute its accuracy score.
 * Does NOT automatically advance to the next stroke; call advanceStroke() for that.
 *
 * @returns {{
 *   score:     number,
 *   coverage:  number,
 *   deviations:number,
 *   tier:      string,
 *   completed: boolean,   // true if stroke is considered done (score >= 50)
 *   nearEnd:   boolean,   // whether the last point was near the stroke end
 * } | null}  null if no stroke was active
 */
export function endStroke() {
  if (!_state.isTracing || !_state.lockedStrokeId) return null;

  const strokeDef = _currentStrokeDef();
  const sampled = _state.sampledStrokes.get(_state.lockedStrokeId);

  _state.isTracing = false;

  if (!strokeDef || !sampled || _state.currentStrokePoints.length === 0) {
    return { score: 0, coverage: 0, deviations: 0, tier: "invalid", completed: false, nearEnd: false };
  }

  // Final accuracy calculation
  const result = calculateAccuracy(_state.currentStrokePoints, sampled);
  const tier = scoreTier(result.score);

  // Check if the last point is near the stroke end (spatial completeness)
  const lastPt = _state.currentStrokePoints[_state.currentStrokePoints.length - 1];
  const nearEnd = isNearStrokeEnd(lastPt, strokeDef);

  // Record the stroke result regardless of pass/fail (the UI decides what to show)
  const strokeResult = {
    strokeId: strokeDef.id,
    score: result.score,
    coverage: result.coverage,
    deviations: result.deviations,
    tier: tier.tier,
    completed: tier.completed,
    nearEnd,
  };

  // Update letter accuracy store (replace if already exists for this stroke)
  const existingIdx = _state.letterAccuracy.strokes.findIndex(
    (s) => s.strokeId === strokeDef.id
  );
  if (existingIdx >= 0) {
    _state.letterAccuracy.strokes[existingIdx] = strokeResult;
  } else {
    _state.letterAccuracy.strokes.push(strokeResult);
  }

  _recalcOverall();

  // Freeze render state to fully-revealed if completed, else leave where it stopped
  if (tier.completed) {
    _state.renderState.dashOffset = 0;
    _state.renderState.progress = 1;
  }

  _state.lockedStrokeId = null;
  _state.currentStrokePoints = [];

  _notify();

  return {
    score: result.score,
    coverage: result.coverage,
    deviations: result.deviations,
    tier: tier.tier,
    completed: tier.completed,
    nearEnd,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// advanceStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move to the next stroke (or mark the letter complete if all strokes are done).
 * Safe to call whether the previous stroke was completed or retrying.
 *
 * @returns {{
 *   strokeIndex:  number,
 *   strokeId:     string | null,
 *   letterDone:   boolean,
 * }}
 */
export function advanceStroke() {
  if (!_state.letterData) {
    return { strokeIndex: 0, strokeId: null, letterDone: true };
  }

  const totalStrokes = _state.letterData.strokes.length;
  _state.currentStrokeIndex++;

  if (_state.currentStrokeIndex >= totalStrokes) {
    _state.status = "letter_complete";
    _state.currentStrokeIndex = totalStrokes; // clamp

    // Push to completed list if not already there
    const alreadyDone = _state.strokesCompleted.some(
      (r) => r.strokeId === (_state.letterData?.strokes[totalStrokes - 1]?.id)
    );
    if (!alreadyDone) {
      const lastResult = _state.letterAccuracy.strokes[_state.letterAccuracy.strokes.length - 1];
      if (lastResult) _state.strokesCompleted.push(lastResult);
    }

    _notify();
    return { strokeIndex: _state.currentStrokeIndex, strokeId: null, letterDone: true };
  }

  // Prepare render state for the new stroke
  const nextStroke = _state.letterData.strokes[_state.currentStrokeIndex];
  const sampled = _state.sampledStrokes.get(nextStroke.id);

  _state.renderState = {
    validSegments: new Array(sampled?.points.length ?? 0).fill(false),
    dashOffset: sampled?.totalLength ?? 0,
    progress: 0,
  };
  _state.maxIndexReached = 0;
  _state.status = "active";

  _notify();
  return {
    strokeIndex: _state.currentStrokeIndex,
    strokeId: nextStroke.id,
    letterDone: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// resetStroke
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reset the current stroke to its initial (un-traced) state without advancing.
 * Called when the user scores below the "invalid" threshold and must retry.
 */
export function resetCurrentStroke() {
  _state.isTracing = false;
  _state.lockedStrokeId = null;
  _state.currentStrokePoints = [];
  _state.maxIndexReached = 0;

  const strokeDef = _currentStrokeDef();
  const sampled = strokeDef ? _state.sampledStrokes.get(strokeDef.id) : null;

  _state.renderState = {
    validSegments: new Array(sampled?.points.length ?? 0).fill(false),
    dashOffset: sampled?.totalLength ?? 0,
    progress: 0,
  };

  _notify();
}

// ─────────────────────────────────────────────────────────────────────────────
// getLetterAccuracy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the accumulated accuracy data for the current letter.
 *
 * @returns {{ overall: number, strokes: StrokeResult[] }}
 */
export function getLetterAccuracy() {
  return {
    overall: _state.letterAccuracy.overall,
    strokes: [..._state.letterAccuracy.strokes],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// resetLetter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full reset — clears all progress for the current letter, preserves the
 * loaded letter definition so loadLetter() does not need to be called again.
 */
export function resetLetter() {
  const { letterData } = _state;
  if (letterData) {
    loadLetter(letterData); // re-initialises with same letter
  } else {
    _state = makeInitialState();
    _notify();
  }
}
