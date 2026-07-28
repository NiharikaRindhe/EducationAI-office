// ─── Simulation constants ─────────────────────────────────────────────────────
export const DEFAULT_SCALE = 15;  // pixels per metre — starting zoom level
export const MIN_SCALE     = 1.5; // never zoom out further than this
export const SCALE         = DEFAULT_SCALE; // kept for any legacy import references
export const DT            = 0.016; // seconds per frame tick

// How much padding (in world-metres) to add around the trajectory so it never
// touches the canvas edge.  Applied on all sides.
export const WORLD_PADDING = 5; // metres

// ─── Gravity presets ──────────────────────────────────────────────────────────
export const GRAVITY_PRESETS = {
  earth:  { label: "Earth",  value: 9.81, icon: "🌍" },
  moon:   { label: "Moon",   value: 1.62, icon: "🌙" },
  mars:   { label: "Mars",   value: 3.71, icon: "🔴" },
  custom: { label: "Custom", value: 5.0,  icon: "⚙️" },
};

// ─── Obsidian colour palette ──────────────────────────────────────────────────
export const CLR = {
  bg:       "#0d1117",
  panel:    "#161b22",
  border:   "#30363d",
  text:     "#e6edf3",
  muted:    "#8b949e",
  accent:   "#58a6ff",
  neon:     "#39d353",
  neonDim:  "rgba(57,211,83,0.18)",
  velTotal: "#f0c05a",
  velX:     "#58a6ff",
  velY:     "#f47067",
  grid:     "rgba(48,54,61,0.9)",
  ground:   "#30363d",
  apex:     "#f0c05a",
};
