/**
 * accuracyChecker.js
 *
 * Pure functions — no DOM, no side effects, no state.
 * All inputs/outputs are plain JS objects so this module is trivially testable.
 *
 * Coordinate space: SVG viewBox (0 0 400 400).
 * The caller (tracingEngine) is responsible for converting screen → SVG coords
 * before passing points into these functions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Validation thresholds (tunable constants at the top)
 * ─────────────────────────────────────────────────────────────────────────────
 *   MAX_DEVIATION_PX      – max perpendicular distance from ideal path        (20 px)
 *   MIN_DIRECTION_ALIGN   – min dot-product for forward direction alignment    (0.7)
 *   MIN_COVERAGE          – fraction of path length that must be covered       (0.80)
 *   START_RADIUS_PX       – snap radius to accept a stroke-start point         (30 px)
 *   END_RADIUS_PX         – proximity to end that marks stroke complete         (30 px)
 *   MAX_JUMP_PX           – gap between consecutive points treated as a lift    (50 px)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ─────────────────────────────────────────────────────────────────────────────
 *   findNearestPoint(userPt, sampledPath)              → NearestResult
 *   getLocalDirection(points, index)                   → { x, y }
 *   filterJumps(points)                               → InputPoint[]
 *   isNearStrokeStart(userPt, stroke, svgMatrix?)      → boolean
 *   isNearStrokeEnd(userPt, stroke)                    → boolean
 *   calculatePathCoverage(userPoints, sampledPath)     → number (0–1)
 *   calculateAccuracy(userPoints, sampledPath)         → AccuracyResult
 *   scoreTier(score)                                   → ScoreTier
 *   realtimePointFeedback(userPt, userPoints, sampledPath) → PointFeedback
 */

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds
// ─────────────────────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  MAX_DEVIATION_PX: 40,       // was 20 — wider tolerance band around the ideal path
  MIN_DIRECTION_ALIGN: 0.2,   // was 0.5 — almost any forward-ish direction accepted
  MIN_COVERAGE: 0.55,         // was 0.80 — only need to cover ~55% of the stroke
  START_RADIUS_PX: 55,        // was 40  — much easier tap-to-start
  END_RADIUS_PX: 55,          // was 40
  MAX_JUMP_PX: 80,            // was 50  — tolerate larger gaps between samples
  MIN_POINT_DISTANCE_PX: 2,
  MAX_INDEX_JUMP: 25,         // was 15  — faster reveal, still prevents circle wrap-around
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitive geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Euclidean distance between two {x,y} points */
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Dot product of two 2-D vectors */
function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/** Normalise a 2-D vector; returns {x:1, y:0} for zero-length input */
function normalise(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

// ─────────────────────────────────────────────────────────────────────────────
// findNearestPoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Linear scan of sampledPath.points to find the closest point to userPt.
 *
 * @param {{ x:number, y:number }} userPt
 * @param {SampledPath} sampledPath   – from pathSampler.samplePath()
 * @returns {{ index:number, point:SampledPoint, distance:number,
 *             tangent:{ x:number, y:number } }}
 */
export function findNearestPoint(userPt, sampledPath) {
  const pts = sampledPath.points;
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < pts.length; i++) {
    const d = dist(userPt, pts[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return {
    index: bestIdx,
    point: pts[bestIdx],
    distance: bestDist,
    tangent: pts[bestIdx].tangent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getLocalDirection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate the travel direction at a particular index in the user's point array.
 * Uses a small window (±2 neighbours) to smooth noise.
 *
 * @param {InputPoint[]} points   – full array of { x, y, timestamp }
 * @param {number}       index    – current point index
 * @returns {{ x:number, y:number }}  unit vector
 */
export function getLocalDirection(points, index) {
  const WINDOW = 2;
  const lo = Math.max(0, index - WINDOW);
  const hi = Math.min(points.length - 1, index + WINDOW);

  if (lo === hi) return { x: 1, y: 0 }; // single point, no direction info

  const dx = points[hi].x - points[lo].x;
  const dy = points[hi].y - points[lo].y;
  return normalise({ x: dx, y: dy });
}

// ─────────────────────────────────────────────────────────────────────────────
// filterJumps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove inter-point gaps larger than MAX_JUMP_PX (accidental pen-lifts /
 * touch interruptions).  Splits into continuous segments and returns the
 * longest one — or all points if no jump is detected.
 *
 * @param {InputPoint[]} points
 * @returns {InputPoint[]}
 */
export function filterJumps(points) {
  if (points.length <= 1) return points;

  // Split into continuous segments
  const segments = [];
  let current = [points[0]];

  for (let i = 1; i < points.length; i++) {
    if (dist(points[i - 1], points[i]) > THRESHOLDS.MAX_JUMP_PX) {
      segments.push(current);
      current = [];
    }
    current.push(points[i]);
  }
  segments.push(current);

  // Return the longest segment (most likely the intentional stroke)
  return segments.reduce((best, seg) => (seg.length > best.length ? seg : best), []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Stroke start / end proximity checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether a point is close enough to the stroke's start point to begin
 * capturing that stroke.
 *
 * @param {{ x:number, y:number }} userPt  – in SVG coordinate space
 * @param {Stroke}                 stroke  – from letterPaths.js
 * @returns {boolean}
 */
export function isNearStrokeStart(userPt, stroke) {
  return dist(userPt, stroke.startPoint) <= THRESHOLDS.START_RADIUS_PX;
}

/**
 * Whether the last captured point is close enough to the stroke end point
 * to mark the stroke as finished.
 *
 * @param {{ x:number, y:number }} userPt
 * @param {Stroke}                 stroke
 * @returns {boolean}
 */
export function isNearStrokeEnd(userPt, stroke) {
  return dist(userPt, stroke.endPoint) <= THRESHOLDS.END_RADIUS_PX;
}

// ─────────────────────────────────────────────────────────────────────────────
// calculatePathCoverage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What fraction of the ideal path length did the user actually pass through?
 *
 * Strategy: project each user point to its nearest sample, mark the sample
 * "visited", then count the arc-length of visited samples vs total length.
 * Uses a tolerance bucket (±1 sample index) to avoid requiring pixel-perfect
 * coverage.
 *
 * @param {InputPoint[]}  userPoints
 * @param {SampledPath}   sampledPath
 * @returns {number}  0–1
 */
export function calculatePathCoverage(userPoints, sampledPath) {
  const { points, totalLength } = sampledPath;
  if (totalLength === 0 || points.length === 0) return 0;

  // Boolean visited array over sample indices
  const visited = new Uint8Array(points.length);

  for (const up of userPoints) {
    const { index } = findNearestPoint(up, sampledPath);
    // Mark the hit index and one neighbour each side (tolerance)
    visited[Math.max(0, index - 1)] = 1;
    visited[index] = 1;
    visited[Math.min(points.length - 1, index + 1)] = 1;
  }

  // Arc-length of visited samples
  let coveredLength = 0;
  for (let i = 0; i < points.length; i++) {
    if (visited[i]) {
      // Width of this sample's segment = half-step to prev + half-step to next
      const prev = i > 0 ? points[i - 1].distanceFromStart : points[i].distanceFromStart;
      const next =
        i < points.length - 1 ? points[i + 1].distanceFromStart : points[i].distanceFromStart;
      coveredLength += (points[i].distanceFromStart - prev) / 2 +
                       (next - points[i].distanceFromStart) / 2;
    }
  }

  return Math.min(coveredLength / totalLength, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateAccuracy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core accuracy algorithm (matches the spec).
 *
 * For each user point:
 *   1. Find nearest sample on the ideal path.
 *   2. Measure deviation distance.
 *   3. Check local travel direction aligns with path tangent.
 *   4. Accept point only if deviation < MAX_DEVIATION_PX AND alignment > MIN_DIRECTION_ALIGN.
 *
 * Final score = (validPoints / totalPoints) × (1 − avgDeviation / MAX_DEVIATION) × coverage
 *
 * @param {InputPoint[]}  userPoints   – { x, y, timestamp }[] in SVG space
 * @param {SampledPath}   sampledPath  – from pathSampler.samplePath()
 * @returns {AccuracyResult}
 *   {
 *     score:      number,   // 0–100 composite
 *     coverage:   number,   // 0–100 path coverage
 *     deviations: number,   // average deviation in px (lower = better)
 *     validRatio: number,   // fraction of points that passed both checks
 *     maxIndexReached: number  // highest sample index the user reached
 *   }
 */
export function calculateAccuracy(userPoints, sampledPath) {
  if (!userPoints || userPoints.length === 0) {
    return { score: 0, coverage: 0, deviations: 0, validRatio: 0, maxIndexReached: 0 };
  }

  // Remove jump artefacts first
  const cleanPoints = filterJumps(userPoints);

  let totalDeviation = 0;
  let validPoints = 0;
  let maxIndexReached = 0;

  for (let i = 0; i < cleanPoints.length; i++) {
    const up = cleanPoints[i];
    const nearest = findNearestPoint(up, sampledPath);
    const deviation = nearest.distance;

    // Track how far along the path the user reached
    if (nearest.index > maxIndexReached) maxIndexReached = nearest.index;

    // Direction alignment check
    const userDir = getLocalDirection(cleanPoints, i);
    const pathDir = nearest.tangent;
    const alignment = dot(userDir, pathDir);

    if (deviation < THRESHOLDS.MAX_DEVIATION_PX && alignment > THRESHOLDS.MIN_DIRECTION_ALIGN) {
      totalDeviation += deviation;
      validPoints++;
    }
  }

  const n = cleanPoints.length;
  const validRatio = validPoints / n;

  // Avoid division by zero when no valid points
  const avgDeviation = validPoints > 0 ? totalDeviation / validPoints : THRESHOLDS.MAX_DEVIATION_PX;

  const coverage = calculatePathCoverage(cleanPoints, sampledPath);

  // Composite score (spec formula)
  const rawScore = validRatio * (1 - avgDeviation / (THRESHOLDS.MAX_DEVIATION_PX)) * coverage;
  const score = Math.min(rawScore * 100, 100);

  return {
    score,
    coverage: coverage * 100,
    deviations: avgDeviation,
    validRatio,
    maxIndexReached,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// scoreTier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify an accuracy score into one of four result tiers (spec table).
 *
 * @param {number} score  – 0–100
 * @returns {{ tier: string, label: string, completed: boolean, retry: boolean }}
 */
export function scoreTier(score) {
  if (score >= 60) {
    return { tier: "perfect",     label: "Perfect!",           completed: true,  retry: false };
  }
  if (score >= 35) {
    return { tier: "acceptable",  label: "Good job!",          completed: true,  retry: false };
  }
  if (score >= 15) {
    return { tier: "retry",       label: "Almost — try again", completed: true,  retry: true  };
  }
  return   { tier: "invalid",     label: "Let's restart",      completed: false, retry: true  };
}

// ─────────────────────────────────────────────────────────────────────────────
// realtimePointFeedback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called on every addPoint() to give immediate per-point feedback.
 * Lightweight — no full accuracy recalc; just check deviation + alignment for
 * the single latest point.
 *
 * @param {{ x:number, y:number }}  userPt          – latest point in SVG space
 * @param {InputPoint[]}            allPoints       – full accumulated array
 * @param {SampledPath}             sampledPath
 * @param {number}                  [windowStart=0] – restrict nearest-point search
 *                                                    to indices >= windowStart.
 *                                                    Critical for closed paths (O, Q)
 *                                                    so we don't jump to the physically-
 *                                                    close-but-already-passed end.
 * @returns {{
 *   valid:          boolean,
 *   deviation:      number,
 *   alignment:      number,
 *   nearestIndex:   number,
 *   progress:       number,
 * }}
 */
export function realtimePointFeedback(userPt, allPoints, sampledPath, windowStart = 0) {
  const nearest = findNearestPointInWindow(userPt, sampledPath, windowStart);
  const deviation = nearest.distance;

  const idx = allPoints.length - 1;
  const userDir = getLocalDirection(allPoints, idx >= 0 ? idx : 0);
  const alignment = dot(userDir, nearest.tangent);

  // For the very first few points the direction estimate is unreliable;
  // skip the alignment check until we have a proper window of samples.
  const skipAlignCheck = allPoints.length < 4;

  const valid =
    deviation < THRESHOLDS.MAX_DEVIATION_PX &&
    (skipAlignCheck || alignment > THRESHOLDS.MIN_DIRECTION_ALIGN);

  const progress = nearest.index / Math.max(sampledPath.points.length - 1, 1);

  return { valid, deviation, alignment, nearestIndex: nearest.index, progress };
}

/**
 * Like findNearestPoint but only searches within [windowStart, end].
 * Used by realtimePointFeedback to prevent closed-path wrap-around.
 *
 * @param {{ x:number, y:number }} userPt
 * @param {SampledPath}            sampledPath
 * @param {number}                 windowStart  – first index to consider
 * @returns {{ index:number, point:SampledPoint, distance:number, tangent:{ x,y } }}
 */
export function findNearestPointInWindow(userPt, sampledPath, windowStart) {
  const pts = sampledPath.points;
  const start = Math.max(0, Math.min(windowStart, pts.length - 1));
  let bestIdx  = start;
  let bestDist = Infinity;

  for (let i = start; i < pts.length; i++) {
    const dx = userPt.x - pts[i].x;
    const dy = userPt.y - pts[i].y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      bestIdx  = i;
    }
  }

  return {
    index:   bestIdx,
    point:   pts[bestIdx],
    distance: bestDist,
    tangent: pts[bestIdx].tangent,
  };
}
