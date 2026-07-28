// ─── Simulation constants ─────────────────────────────────────────────────────
export const G  = 9.81;    // m/s² — gravitational acceleration
export const DT = 0.016;   // seconds per frame tick

// Ramp geometry — canvas layout
export const RAMP_ORIGIN_PAD_X = 0.12; // fraction of canvas width  from left
export const RAMP_ORIGIN_PAD_Y = 0.88; // fraction of canvas height from top (ground level)
export const RAMP_LENGTH       = 0.75; // fraction of canvas width — hypotenuse length

// Block dimensions in pixels
export const BLOCK_SIZE = 32; // px

// ─── Surface material presets ─────────────────────────────────────────────────
export const SURFACE_PRESETS = {
  ice:    { label: "Ice / Ice",          icon: "🧊", us: 0.10, uk: 0.03 },
  wood:   { label: "Wood / Wood",        icon: "🪵", us: 0.50, uk: 0.30 },
  rubber: { label: "Rubber / Concrete",  icon: "🔩", us: 0.90, uk: 0.70 },
};

// ─── Obsidian colour palette (mirrors ProjectileMotion CLR) ───────────────────
export const CLR = {
  bg:        "#0d1117",
  panel:     "#161b22",
  border:    "#30363d",
  text:      "#e6edf3",
  muted:     "#8b949e",
  accent:    "#58a6ff",
  neon:      "#39d353",

  // Vector colours
  gravity:   "#f47067",   // muted red   — gravity vector
  normal:    "#56d364",   // muted teal  — normal force
  friction:  "#e3b341",   // muted amber — friction vector

  // Ramp / block
  ramp:      "#21262d",
  rampEdge:  "#30363d",
  block:     "#58a6ff",
  blockEdge: "#a5d3ff",

  grid:      "rgba(48,54,61,0.6)",
};
