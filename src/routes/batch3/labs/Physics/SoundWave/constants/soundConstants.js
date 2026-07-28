// ─── Simulation timing ────────────────────────────────────────────────────────
export const DT = 0.016; // seconds per frame tick

// ─── Wave generator defaults ──────────────────────────────────────────────────
export const DEFAULT_FREQ      = 3.0;  // Hz
export const DEFAULT_AMP       = 0.6;  // 0-1 normalised
export const DEFAULT_PHASE_DEG = 0;    // degrees
export const DEFAULT_TEMP_C    = 20;   // °C

// ─── Particle grid ────────────────────────────────────────────────────────────
export const PARTICLE_COLS = 80;  // columns across tank width
export const PARTICLE_ROWS = 12;  // rows of molecules
export const MAX_DISP_PX   = 18;  // max pixel displacement of a particle

// ─── Medium speed-of-sound presets ───────────────────────────────────────────
// Base values at reference temperature. Actual v is computed via computeSpeedOfSound().
export const MEDIUM_PRESETS = {
  gas:    { label: "Gas (Air)",    icon: "💨", vRef: 343,  color: "#8b949e", tRef: 20,  tMin: -50, tMax: 200 },
  liquid: { label: "Liquid (H₂O)", icon: "💧", vRef: 1480, color: "#58a6ff", tRef: 20,  tMin:  0,  tMax: 100 },
  solid:  { label: "Solid (Iron)", icon: "⚙️", vRef: 5120, color: "#e3b341", tRef: 20,  tMin: -50, tMax: 500 },
};

/**
 * Compute speed of sound for a given medium at temperature T (°C).
 *
 * Gas  (Air):   v = 331.3 × √(1 + T / 273.15)          — ideal-gas approximation
 * Liquid (H₂O): v = 1402.4 + 5.01×T − 0.055×T²         — valid 0–100 °C
 * Solid  (Fe):  v ≈ 5120 − 0.5×(T − 20)                — linear elastic modulus approx
 */
export function computeSpeedOfSound(mediumKey, tempC) {
  switch (mediumKey) {
    case "gas":
      return Math.round(331.3 * Math.sqrt(1 + tempC / 273.15));
    case "liquid": {
      const v = 1402.4 + 5.01 * tempC - 0.055 * tempC * tempC;
      return Math.round(Math.max(1200, Math.min(1600, v)));
    }
    case "solid":
      return Math.round(Math.max(4000, 5120 - 0.5 * (tempC - 20)));
    default:
      return 343;
  }
}

// ─── Boundary types ───────────────────────────────────────────────────────────
export const BOUNDARY = {
  ABSORB: "absorb",   // foam — no reflection
  RIGID:  "rigid",    // wall — 180° phase-shifted reflection
};

// ─── Game mission modes ───────────────────────────────────────────────────────
export const MISSION = {
  FREE:       "free",       // no mission — sandbox
  RESONANCE:  "resonance",  // match the target silhouette
  CANCEL:     "cancel",     // destructive interference
  SONAR:      "sonar",      // echo rangefinder
};

// ─── Obsidian colour palette ──────────────────────────────────────────────────
export const CLR = {
  bg:       "#0d1117",
  panel:    "#161b22",
  border:   "#30363d",
  text:     "#f0f6fc",
  muted:    "#8b949e",
  accent:   "#58a6ff",

  // Wave / graph colours
  wave:     "#00e5ff",   // neon cyan  — user wave trace
  waveGlow: "rgba(0,229,255,0.18)",
  noise:    "#ff5252",   // hostile noise wave (Mode 2)
  target:   "#ffb300",   // neon amber — target silhouette (Mode 1)
  sonar:    "#69ff47",   // sonar pulse / echo

  // Particle medium
  particle: "rgba(240,246,252,0.22)",
  particleHi: "rgba(0,229,255,0.55)",  // compressed region highlight

  // Speaker / piston
  speaker:  "#21262d",
  speakerEdge: "#30363d",

  // Misc
  grid:     "rgba(48,54,61,0.55)",
  submarine: "#e3b341",
};
