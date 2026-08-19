/**
 * pathSampler.js
 *
 * Pre-samples SVG path elements into equidistant point arrays.
 * Sampling is done once at load time via a hidden <path> element;
 * results are cached so per-frame cost is zero.
 *
 * Public API
 * ----------
 * samplePath(pathD, numSamples?)  → SampledPoint[]
 * sampleLetter(letterData)        → Map<strokeId, SampledPath>
 * getTangentAt(sampledPath, t)    → { x, y }   (t = 0..1)
 *
 * SampledPoint  { x, y, distanceFromStart, tangent: { x, y } }
 * SampledPath   { points: SampledPoint[], totalLength: number }
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Euclidean distance between two {x,y} objects */
function dist2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create a temporary SVG <path> element (not attached to DOM) so we can call
 * getTotalLength() / getPointAtLength().
 * Works in browser environments; in SSR/test environments the caller should
 * pass a pre-built element.
 */
function createSVGPath(d) {
  // Use the SVG namespace to get a proper SVGPathElement
  const svgNS = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", d);
  return path;
}

/**
 * Compute a unit tangent vector at a given arc-length position.
 * Uses a small forward/backward epsilon to approximate the derivative.
 */
function tangentAt(pathEl, length, totalLength) {
  const eps = Math.max(totalLength * 0.001, 0.1);
  const t0 = Math.max(0, length - eps);
  const t1 = Math.min(totalLength, length + eps);

  const p0 = pathEl.getPointAtLength(t0);
  const p1 = pathEl.getPointAtLength(t1);

  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

// ---------------------------------------------------------------------------
// Cache  (Map<pathD, SampledPath>)
// ---------------------------------------------------------------------------
const _cache = new Map();

// ---------------------------------------------------------------------------
// samplePath
// ---------------------------------------------------------------------------

/**
 * Sample a single SVG path string into `numSamples` equidistant points.
 *
 * @param {string}  pathD       – SVG "d" attribute value
 * @param {number}  [numSamples=100]
 * @param {SVGPathElement} [pathEl]  – supply a real DOM element to avoid
 *                                    creating a temporary one (useful when the
 *                                    element is already mounted in the SVG)
 * @returns {SampledPath}
 */
export function samplePath(pathD, numSamples = 100, pathEl = null) {
  const cacheKey = `${pathD}::${numSamples}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  const el = pathEl ?? createSVGPath(pathD);
  const totalLength = el.getTotalLength();

  if (totalLength === 0) {
    // Degenerate path – return a single point
    const pt = el.getPointAtLength(0);
    const result = {
      points: [{ x: pt.x, y: pt.y, distanceFromStart: 0, tangent: { x: 1, y: 0 } }],
      totalLength: 0,
    };
    _cache.set(cacheKey, result);
    return result;
  }

  const points = [];
  const step = totalLength / (numSamples - 1);

  for (let i = 0; i < numSamples; i++) {
    const arcLen = Math.min(i * step, totalLength);
    const svgPt = el.getPointAtLength(arcLen);
    const tan = tangentAt(el, arcLen, totalLength);

    points.push({
      x: svgPt.x,
      y: svgPt.y,
      distanceFromStart: arcLen,
      tangent: tan,
    });
  }

  const result = { points, totalLength };
  _cache.set(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// sampleLetter
// ---------------------------------------------------------------------------

/**
 * Pre-sample every stroke in a letter definition.
 * Returns a Map keyed by stroke.id so the engine can look up O(1).
 *
 * @param {object} letterData  – one entry from letterPaths.js (e.g. letterA)
 * @param {number} [numSamples=100]
 * @returns {Map<string, SampledPath>}
 */
export function sampleLetter(letterData, numSamples = 100) {
  const map = new Map();
  for (const stroke of letterData.strokes) {
    map.set(stroke.id, samplePath(stroke.path, numSamples));
  }
  return map;
}

// ---------------------------------------------------------------------------
// getTangentAt  (parametric t = 0..1)
// ---------------------------------------------------------------------------

/**
 * Interpolate the tangent direction at a fractional position along the path.
 *
 * @param {SampledPath} sampledPath
 * @param {number} t  – 0 = start, 1 = end
 * @returns {{ x: number, y: number }}  unit tangent vector
 */
export function getTangentAt(sampledPath, t) {
  const { points } = sampledPath;
  if (points.length === 0) return { x: 1, y: 0 };

  const idx = Math.round(t * (points.length - 1));
  const clamped = Math.max(0, Math.min(points.length - 1, idx));
  return points[clamped].tangent;
}

// ---------------------------------------------------------------------------
// findNearestSampledPoint
// ---------------------------------------------------------------------------

/**
 * Given a user point in SVG space, find the closest point in a sampled path.
 * Returns the index into sampledPath.points as well as the point itself and
 * the Euclidean distance.
 *
 * Linear scan — 100 points is fast enough; no spatial index needed.
 *
 * @param {{ x: number, y: number }} userPt  – in SVG coordinate space
 * @param {SampledPath} sampledPath
 * @returns {{ index: number, point: SampledPoint, distance: number }}
 */
export function findNearestSampledPoint(userPt, sampledPath) {
  let bestIdx = 0;
  let bestDist = Infinity;

  const pts = sampledPath.points;
  for (let i = 0; i < pts.length; i++) {
    const d = dist2D(userPt, pts[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return { index: bestIdx, point: pts[bestIdx], distance: bestDist };
}

// ---------------------------------------------------------------------------
// getProgressAlongPath
// ---------------------------------------------------------------------------

/**
 * Estimate how far along the path (0–1) the user has reached based on
 * the furthest nearest-point index seen so far.
 *
 * @param {number} maxReachedIndex  – highest index reached in sampledPath.points
 * @param {SampledPath} sampledPath
 * @returns {number}  0..1
 */
export function getProgressAlongPath(maxReachedIndex, sampledPath) {
  const len = sampledPath.points.length;
  if (len <= 1) return 1;
  return maxReachedIndex / (len - 1);
}

// ---------------------------------------------------------------------------
// clearCache  (useful for testing)
// ---------------------------------------------------------------------------
export function clearSampleCache() {
  _cache.clear();
}
