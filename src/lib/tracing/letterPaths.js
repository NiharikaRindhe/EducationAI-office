/**
 * letterPaths.js
 *
 * Letter definitions for A–Z.
 * Each letter contains an ordered array of strokes.
 * Each stroke has:
 *   - id          : unique identifier within the letter
 *   - path        : SVG "d" attribute string (absolute coords, 400×400 viewBox)
 *   - startPoint  : { x, y } – where the stroke begins
 *   - endPoint    : { x, y } – where the stroke ends
 *   - direction   : unit vector of the dominant travel direction (for initial alignment check)
 *
 * ViewBox convention: 0 0 400 400
 * All coordinates are in that space; the engine converts to screen space via getScreenCTM().inverse().
 */

// ---------------------------------------------------------------------------
// Helper: unit vector between two points
// ---------------------------------------------------------------------------
function unitVec(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

// ---------------------------------------------------------------------------
// A
// ---------------------------------------------------------------------------
export const letterA = {
  name: "A",
  strokes: [
    {
      id: "A-stroke-1",
      // Left leg: bottom-left to apex
      path: "M 100 340 L 200 60",
      startPoint: { x: 100, y: 340 },
      endPoint: { x: 200, y: 60 },
      direction: unitVec(100, 340, 200, 60),
    },
    {
      id: "A-stroke-2",
      // Right leg: apex to bottom-right
      path: "M 200 60 L 300 340",
      startPoint: { x: 200, y: 60 },
      endPoint: { x: 300, y: 340 },
      direction: unitVec(200, 60, 300, 340),
    },
    {
      id: "A-stroke-3",
      // Crossbar
      path: "M 135 210 L 265 210",
      startPoint: { x: 135, y: 210 },
      endPoint: { x: 265, y: 210 },
      direction: unitVec(135, 210, 265, 210),
    },
  ],
};

// ---------------------------------------------------------------------------
// B
// ---------------------------------------------------------------------------
export const letterB = {
  name: "B",
  strokes: [
    {
      id: "B-stroke-1",
      // Vertical spine
      path: "M 120 60 L 120 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 60, 120, 340),
    },
    {
      id: "B-stroke-2",
      // Upper bump: top of spine → right → midpoint
      path: "M 120 60 C 260 60 260 200 120 200",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 200 },
      direction: unitVec(120, 60, 200, 60),
    },
    {
      id: "B-stroke-3",
      // Lower bump: midpoint → right → bottom of spine
      path: "M 120 200 C 280 200 280 340 120 340",
      startPoint: { x: 120, y: 200 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 200, 220, 200),
    },
  ],
};

// ---------------------------------------------------------------------------
// C
// ---------------------------------------------------------------------------
export const letterC = {
  name: "C",
  strokes: [
    {
      id: "C-stroke-1",
      // Arc from upper-right, counterclockwise to lower-right
      path: "M 290 110 C 290 60 80 60 80 200 C 80 340 290 340 290 290",
      startPoint: { x: 290, y: 110 },
      endPoint: { x: 290, y: 290 },
      direction: unitVec(290, 110, 200, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// D
// ---------------------------------------------------------------------------
export const letterD = {
  name: "D",
  strokes: [
    {
      id: "D-stroke-1",
      // Vertical spine
      path: "M 120 60 L 120 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 60, 120, 340),
    },
    {
      id: "D-stroke-2",
      // Curved right side
      path: "M 120 60 C 320 60 320 340 120 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 60, 220, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// E
// ---------------------------------------------------------------------------
export const letterE = {
  name: "E",
  strokes: [
    {
      id: "E-stroke-1",
      // Vertical spine
      path: "M 130 60 L 130 340",
      startPoint: { x: 130, y: 60 },
      endPoint: { x: 130, y: 340 },
      direction: unitVec(130, 60, 130, 340),
    },
    {
      id: "E-stroke-2",
      // Top horizontal
      path: "M 130 60 L 290 60",
      startPoint: { x: 130, y: 60 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(130, 60, 290, 60),
    },
    {
      id: "E-stroke-3",
      // Middle horizontal
      path: "M 130 200 L 260 200",
      startPoint: { x: 130, y: 200 },
      endPoint: { x: 260, y: 200 },
      direction: unitVec(130, 200, 260, 200),
    },
    {
      id: "E-stroke-4",
      // Bottom horizontal
      path: "M 130 340 L 290 340",
      startPoint: { x: 130, y: 340 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(130, 340, 290, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// F
// ---------------------------------------------------------------------------
export const letterF = {
  name: "F",
  strokes: [
    {
      id: "F-stroke-1",
      path: "M 130 60 L 130 340",
      startPoint: { x: 130, y: 60 },
      endPoint: { x: 130, y: 340 },
      direction: unitVec(130, 60, 130, 340),
    },
    {
      id: "F-stroke-2",
      path: "M 130 60 L 290 60",
      startPoint: { x: 130, y: 60 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(130, 60, 290, 60),
    },
    {
      id: "F-stroke-3",
      path: "M 130 200 L 260 200",
      startPoint: { x: 130, y: 200 },
      endPoint: { x: 260, y: 200 },
      direction: unitVec(130, 200, 260, 200),
    },
  ],
};

// ---------------------------------------------------------------------------
// G
// ---------------------------------------------------------------------------
export const letterG = {
  name: "G",
  strokes: [
    {
      id: "G-stroke-1",
      // Arc (like C) then horizontal shelf
      path: "M 290 110 C 290 60 80 60 80 200 C 80 370 290 340 290 220 L 210 220",
      startPoint: { x: 290, y: 110 },
      endPoint: { x: 210, y: 220 },
      direction: unitVec(290, 110, 200, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// H
// ---------------------------------------------------------------------------
export const letterH = {
  name: "H",
  strokes: [
    {
      id: "H-stroke-1",
      path: "M 120 60 L 120 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 60, 120, 340),
    },
    {
      id: "H-stroke-2",
      path: "M 280 60 L 280 340",
      startPoint: { x: 280, y: 60 },
      endPoint: { x: 280, y: 340 },
      direction: unitVec(280, 60, 280, 340),
    },
    {
      id: "H-stroke-3",
      path: "M 120 200 L 280 200",
      startPoint: { x: 120, y: 200 },
      endPoint: { x: 280, y: 200 },
      direction: unitVec(120, 200, 280, 200),
    },
  ],
};

// ---------------------------------------------------------------------------
// I
// ---------------------------------------------------------------------------
export const letterI = {
  name: "I",
  strokes: [
    {
      id: "I-stroke-1",
      // Top serif
      path: "M 150 60 L 250 60",
      startPoint: { x: 150, y: 60 },
      endPoint: { x: 250, y: 60 },
      direction: unitVec(150, 60, 250, 60),
    },
    {
      id: "I-stroke-2",
      // Vertical bar
      path: "M 200 60 L 200 340",
      startPoint: { x: 200, y: 60 },
      endPoint: { x: 200, y: 340 },
      direction: unitVec(200, 60, 200, 340),
    },
    {
      id: "I-stroke-3",
      // Bottom serif
      path: "M 150 340 L 250 340",
      startPoint: { x: 150, y: 340 },
      endPoint: { x: 250, y: 340 },
      direction: unitVec(150, 340, 250, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// J
// ---------------------------------------------------------------------------
export const letterJ = {
  name: "J",
  strokes: [
    {
      id: "J-stroke-1",
      // Top serif
      path: "M 170 60 L 260 60",
      startPoint: { x: 170, y: 60 },
      endPoint: { x: 260, y: 60 },
      direction: unitVec(170, 60, 260, 60),
    },
    {
      id: "J-stroke-2",
      // Vertical + bottom hook
      path: "M 220 60 L 220 290 C 220 360 120 360 120 290",
      startPoint: { x: 220, y: 60 },
      endPoint: { x: 120, y: 290 },
      direction: unitVec(220, 60, 220, 200),
    },
  ],
};

// ---------------------------------------------------------------------------
// K
// ---------------------------------------------------------------------------
export const letterK = {
  name: "K",
  strokes: [
    {
      id: "K-stroke-1",
      path: "M 120 60 L 120 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 340 },
      direction: unitVec(120, 60, 120, 340),
    },
    {
      id: "K-stroke-2",
      // Upper diagonal from spine midpoint to top-right
      path: "M 120 200 L 290 60",
      startPoint: { x: 120, y: 200 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(120, 200, 290, 60),
    },
    {
      id: "K-stroke-3",
      // Lower diagonal from midpoint to bottom-right
      path: "M 120 200 L 290 340",
      startPoint: { x: 120, y: 200 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(120, 200, 290, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// L
// ---------------------------------------------------------------------------
export const letterL = {
  name: "L",
  strokes: [
    {
      id: "L-stroke-1",
      path: "M 130 60 L 130 340",
      startPoint: { x: 130, y: 60 },
      endPoint: { x: 130, y: 340 },
      direction: unitVec(130, 60, 130, 340),
    },
    {
      id: "L-stroke-2",
      path: "M 130 340 L 290 340",
      startPoint: { x: 130, y: 340 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(130, 340, 290, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// M
// ---------------------------------------------------------------------------
export const letterM = {
  name: "M",
  strokes: [
    {
      id: "M-stroke-1",
      path: "M 100 340 L 100 60",
      startPoint: { x: 100, y: 340 },
      endPoint: { x: 100, y: 60 },
      direction: unitVec(100, 340, 100, 60),
    },
    {
      id: "M-stroke-2",
      // Left diagonal down to valley
      path: "M 100 60 L 200 200",
      startPoint: { x: 100, y: 60 },
      endPoint: { x: 200, y: 200 },
      direction: unitVec(100, 60, 200, 200),
    },
    {
      id: "M-stroke-3",
      // Right diagonal up from valley
      path: "M 200 200 L 300 60",
      startPoint: { x: 200, y: 200 },
      endPoint: { x: 300, y: 60 },
      direction: unitVec(200, 200, 300, 60),
    },
    {
      id: "M-stroke-4",
      path: "M 300 60 L 300 340",
      startPoint: { x: 300, y: 60 },
      endPoint: { x: 300, y: 340 },
      direction: unitVec(300, 60, 300, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// N
// ---------------------------------------------------------------------------
export const letterN = {
  name: "N",
  strokes: [
    {
      id: "N-stroke-1",
      path: "M 120 340 L 120 60",
      startPoint: { x: 120, y: 340 },
      endPoint: { x: 120, y: 60 },
      direction: unitVec(120, 340, 120, 60),
    },
    {
      id: "N-stroke-2",
      path: "M 120 60 L 280 340",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 280, y: 340 },
      direction: unitVec(120, 60, 280, 340),
    },
    {
      id: "N-stroke-3",
      path: "M 280 340 L 280 60",
      startPoint: { x: 280, y: 340 },
      endPoint: { x: 280, y: 60 },
      direction: unitVec(280, 340, 280, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// O
// ---------------------------------------------------------------------------
export const letterO = {
  name: "O",
  strokes: [
    {
      id: "O-stroke-1",
      // Perfect circle with center (200, 200) and radius 140
      // Split into 4 quadrants using the standard Bezier circle approximation (r * 0.5523)
      path: "M 200 60 C 277.32 60 340 122.68 340 200 C 340 277.32 277.32 340 200 340 C 122.68 340 60 277.32 60 200 C 60 122.68 122.68 60 200 60 Z",
      startPoint: { x: 200, y: 60 },
      endPoint: { x: 200, y: 60 },
      direction: unitVec(200, 60, 277.32, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// P
// ---------------------------------------------------------------------------
export const letterP = {
  name: "P",
  strokes: [
    {
      id: "P-stroke-1",
      path: "M 120 340 L 120 60",
      startPoint: { x: 120, y: 340 },
      endPoint: { x: 120, y: 60 },
      direction: unitVec(120, 340, 120, 60),
    },
    {
      id: "P-stroke-2",
      // Upper bump
      path: "M 120 60 C 280 60 280 200 120 200",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 200 },
      direction: unitVec(120, 60, 220, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// Q
// ---------------------------------------------------------------------------
export const letterQ = {
  name: "Q",
  strokes: [
    {
      id: "Q-stroke-1",
      // Same accurate circle as O — 4 quadrants, Bezier circle approximation (r=140, center 200,200)
      path: "M 200 60 C 277.32 60 340 122.68 340 200 C 340 277.32 277.32 340 200 340 C 122.68 340 60 277.32 60 200 C 60 122.68 122.68 60 200 60 Z",
      startPoint: { x: 200, y: 60 },
      endPoint: { x: 200, y: 60 },
      direction: unitVec(200, 60, 277.32, 60),
    },
    {
      id: "Q-stroke-2",
      // Tail
      path: "M 255 280 L 310 360",
      startPoint: { x: 255, y: 280 },
      endPoint: { x: 310, y: 340 },
      direction: unitVec(255, 280, 310, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// R
// ---------------------------------------------------------------------------
export const letterR = {
  name: "R",
  strokes: [
    {
      id: "R-stroke-1",
      path: "M 120 340 L 120 60",
      startPoint: { x: 120, y: 340 },
      endPoint: { x: 120, y: 60 },
      direction: unitVec(120, 340, 120, 60),
    },
    {
      id: "R-stroke-2",
      // Upper bump
      path: "M 120 60 C 280 60 280 200 120 200",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 120, y: 200 },
      direction: unitVec(120, 60, 220, 60),
    },
    {
      id: "R-stroke-3",
      // Diagonal leg
      path: "M 120 200 L 290 340",
      startPoint: { x: 120, y: 200 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(120, 200, 290, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// S
// ---------------------------------------------------------------------------
export const letterS = {
  name: "S",
  strokes: [
    {
      id: "S-stroke-1",
      // A beautifully balanced, fluid S-curve
      path: "M 280 120 C 280 60 120 60 120 170 C 120 230 280 210 280 280 C 280 340 120 340 120 280",
      startPoint: { x: 280, y: 120 },
      endPoint: { x: 120, y: 280 },
      // Tangent direction at the start pointing smoothly into the upper loop
      direction: unitVec(280, 120, 240, 60), 
    },
  ],
};

// ---------------------------------------------------------------------------
// T
// ---------------------------------------------------------------------------
export const letterT = {
  name: "T",
  strokes: [
    {
      id: "T-stroke-1",
      // Top horizontal bar
      path: "M 110 60 L 290 60",
      startPoint: { x: 110, y: 60 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(110, 60, 290, 60),
    },
    {
      id: "T-stroke-2",
      // Vertical stem
      path: "M 200 60 L 200 340",
      startPoint: { x: 200, y: 60 },
      endPoint: { x: 200, y: 340 },
      direction: unitVec(200, 60, 200, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// U
// ---------------------------------------------------------------------------
export const letterU = {
  name: "U",
  strokes: [
    {
      id: "U-stroke-1",
      path: "M 120 60 L 120 280 C 120 360 280 360 280 280 L 280 60",
      startPoint: { x: 120, y: 60 },
      endPoint: { x: 280, y: 60 },
      direction: unitVec(120, 60, 120, 200),
    },
  ],
};

// ---------------------------------------------------------------------------
// V
// ---------------------------------------------------------------------------
export const letterV = {
  name: "V",
  strokes: [
    {
      id: "V-stroke-1",
      path: "M 110 60 L 200 340",
      startPoint: { x: 110, y: 60 },
      endPoint: { x: 200, y: 340 },
      direction: unitVec(110, 60, 200, 340),
    },
    {
      id: "V-stroke-2",
      path: "M 200 340 L 290 60",
      startPoint: { x: 200, y: 340 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(200, 340, 290, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// W
// ---------------------------------------------------------------------------
export const letterW = {
  name: "W",
  strokes: [
    {
      id: "W-stroke-1",
      path: "M 80 60 L 140 340",
      startPoint: { x: 80, y: 60 },
      endPoint: { x: 140, y: 340 },
      direction: unitVec(80, 60, 140, 340),
    },
    {
      id: "W-stroke-2",
      path: "M 140 340 L 200 180",
      startPoint: { x: 140, y: 340 },
      endPoint: { x: 200, y: 180 },
      direction: unitVec(140, 340, 200, 180),
    },
    {
      id: "W-stroke-3",
      path: "M 200 180 L 260 340",
      startPoint: { x: 200, y: 180 },
      endPoint: { x: 260, y: 340 },
      direction: unitVec(200, 180, 260, 340),
    },
    {
      id: "W-stroke-4",
      path: "M 260 340 L 320 60",
      startPoint: { x: 260, y: 340 },
      endPoint: { x: 320, y: 60 },
      direction: unitVec(260, 340, 320, 60),
    },
  ],
};

// ---------------------------------------------------------------------------
// X
// ---------------------------------------------------------------------------
export const letterX = {
  name: "X",
  strokes: [
    {
      id: "X-stroke-1",
      path: "M 110 60 L 290 340",
      startPoint: { x: 110, y: 60 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(110, 60, 290, 340),
    },
    {
      id: "X-stroke-2",
      path: "M 290 60 L 110 340",
      startPoint: { x: 290, y: 60 },
      endPoint: { x: 110, y: 340 },
      direction: unitVec(290, 60, 110, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// Y
// ---------------------------------------------------------------------------
export const letterY = {
  name: "Y",
  strokes: [
    {
      id: "Y-stroke-1",
      path: "M 110 60 L 200 200",
      startPoint: { x: 110, y: 60 },
      endPoint: { x: 200, y: 200 },
      direction: unitVec(110, 60, 200, 200),
    },
    {
      id: "Y-stroke-2",
      path: "M 290 60 L 200 200",
      startPoint: { x: 290, y: 60 },
      endPoint: { x: 200, y: 200 },
      direction: unitVec(290, 60, 200, 200),
    },
    {
      id: "Y-stroke-3",
      path: "M 200 200 L 200 340",
      startPoint: { x: 200, y: 200 },
      endPoint: { x: 200, y: 340 },
      direction: unitVec(200, 200, 200, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// Z
// ---------------------------------------------------------------------------
export const letterZ = {
  name: "Z",
  strokes: [
    {
      id: "Z-stroke-1",
      path: "M 110 60 L 290 60",
      startPoint: { x: 110, y: 60 },
      endPoint: { x: 290, y: 60 },
      direction: unitVec(110, 60, 290, 60),
    },
    {
      id: "Z-stroke-2",
      path: "M 290 60 L 110 340",
      startPoint: { x: 290, y: 60 },
      endPoint: { x: 110, y: 340 },
      direction: unitVec(290, 60, 110, 340),
    },
    {
      id: "Z-stroke-3",
      path: "M 110 340 L 290 340",
      startPoint: { x: 110, y: 340 },
      endPoint: { x: 290, y: 340 },
      direction: unitVec(110, 340, 290, 340),
    },
  ],
};

// ---------------------------------------------------------------------------
// Master lookup map
// ---------------------------------------------------------------------------
export const LETTERS = {
  A: letterA,
  B: letterB,
  C: letterC,
  D: letterD,
  E: letterE,
  F: letterF,
  G: letterG,
  H: letterH,
  I: letterI,
  J: letterJ,
  K: letterK,
  L: letterL,
  M: letterM,
  N: letterN,
  O: letterO,
  P: letterP,
  Q: letterQ,
  R: letterR,
  S: letterS,
  T: letterT,
  U: letterU,
  V: letterV,
  W: letterW,
  X: letterX,
  Y: letterY,
  Z: letterZ,
};

export default LETTERS;
