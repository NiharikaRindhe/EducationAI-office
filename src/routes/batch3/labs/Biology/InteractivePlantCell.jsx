import { useState } from "react";

// ── Animal-cell colour theme mapped to plant organelles ─────────────────────
const ORGANELLES = [
  {
    id: "cell_wall",
    name: "Cell Wall",
    tagline: "Rigid Structural Layer",
    color: "#e3b341",
    description: "A rigid outer layer made primarily of cellulose microfibrils that gives the plant cell its characteristic rectangular box shape and provides structural protection.",
    fact: "Plant cell walls give wood its incredible strength — cellulose is the most abundant organic polymer on Earth.",
  },
  {
    id: "plasma_membrane",
    name: "Plasma Membrane",
    tagline: "Outer Boundary & Gatekeeper",
    color: "#4ade80",
    description: "A thin semi-permeable phospholipid bilayer directly beneath the cell wall that regulates the entry and exit of nutrients and substances.",
    fact: "The plasma membrane is only ~7–10 nm thick — about 10,000× thinner than a human hair.",
  },
  {
    id: "central_vacuole",
    name: "Central Vacuole",
    tagline: "Storage & Turgor Pressure",
    color: "#fbbf24",
    description: "A massive fluid-filled compartment taking up most of the cell's volume. Stores water and maintains turgor pressure to keep the cell firm and rigid.",
    fact: "A plant's central vacuole can occupy up to 90% of the cell's total volume!",
  },
  {
    id: "tonoplast",
    name: "Tonoplast",
    tagline: "Vacuole Membrane",
    color: "#f59e0b",
    description: "The single membrane enclosing the central vacuole. Controls the transport of solutes and water into and out of the vacuole via specialized channels.",
    fact: "The tonoplast contains aquaporin channels that allow rapid water movement across the membrane.",
  },
  {
    id: "chloroplast",
    name: "Chloroplasts",
    tagline: "Photosynthesis Factory",
    color: "#22c55e",
    description: "Oval green organelles containing stacked thylakoid disks (grana). They capture sunlight and convert it into sugars through photosynthesis.",
    fact: "A single leaf cell can contain 40–50 chloroplasts — each one a microscopic solar-powered sugar factory.",
  },
  {
    id: "nucleus",
    name: "Nucleus",
    tagline: "Control Centre & DNA Vault",
    color: "#f97316",
    description: "A large spherical structure containing the cell's DNA. Directs all cellular activities including growth, metabolism, protein synthesis, and cell division.",
    fact: "If the DNA in one plant cell was fully uncoiled, it could stretch several metres in length.",
  },
  {
    id: "nucleolus",
    name: "Nucleolus",
    tagline: "Ribosome Assembly Plant",
    color: "#fbbf24",
    description: "A dense, dark region inside the nucleus that synthesises ribosomal RNA (rRNA) and assembles ribosomal subunits for export to the cytoplasm.",
    fact: "Cells that are actively making lots of proteins have larger, more prominent nucleoli.",
  },
  {
    id: "nuclear_envelope",
    name: "Nuclear Envelope",
    tagline: "Nucleus Boundary",
    color: "#fb923c",
    description: "A double membrane punctured by nuclear pores that surrounds the nucleus. Protects the DNA and regulates all traffic between the nucleus and cytoplasm.",
    fact: "Each nuclear pore complex is built from ~120 proteins and can ferry up to 1,000 molecules per second.",
  },
  {
    id: "er_rough",
    name: "Rough ER",
    tagline: "Protein Manufacturing Line",
    color: "#60a5fa",
    description: "Stacked folded membranes studded with ribosomes emanating from the nuclear envelope. Synthesises, folds, and processes proteins bound for secretion or membranes.",
    fact: "The 'rough' texture is caused by thousands of ribosomes docked on its surface.",
  },
  {
    id: "er_smooth",
    name: "Smooth ER",
    tagline: "Lipid & Steroid Factory",
    color: "#818cf8",
    description: "A network of tubular membranes without ribosomes on the left side of the cell. Synthesises lipids, phospholipids, and steroids needed for cell membranes and signalling.",
    fact: "Liver cells are packed with Smooth ER because they specialise in detoxifying drugs and metabolic waste.",
  },
  {
    id: "golgi",
    name: "Golgi Apparatus",
    tagline: "Processing & Shipping Hub",
    color: "#4ade80",
    description: "A stack of flattened membranous sacs on the right side of the cell. Receives proteins from the ER, modifies, packages, and ships them to their final destinations.",
    fact: "Named after Camillo Golgi who discovered it in 1897 — scientists initially dismissed it as an artifact!",
  },
  {
    id: "mitochondria",
    name: "Mitochondria",
    tagline: "Powerhouse of the Cell",
    color: "#f87171",
    description: "Oval double-membraned organelles scattered throughout the cytoplasm. Their inner membrane folds (cristae) dramatically increase surface area for ATP generation.",
    fact: "Mitochondria carry their own DNA, inherited exclusively from the mother — evidence of ancient bacterial ancestors.",
  },
  {
    id: "ribosome",
    name: "Ribosomes",
    tagline: "Protein Builders",
    color: "#facc15",
    description: "Tiny two-subunit particles found free in the cytoplasm and bound on the Rough ER. They translate mRNA instructions into proteins chain by chain.",
    fact: "A single plant cell can contain millions of ribosomes — the most abundant organelle in any cell.",
  },
  {
    id: "plasmodesmata",
    name: "Plasmodesmata",
    tagline: "Intercellular Bridges",
    color: "#86efac",
    description: "Microscopic channels that pierce through the cell wall and connect adjacent plant cells, enabling direct transport of water, nutrients, and signals.",
    fact: "Plasmodesmata can widen to let large molecules like RNA and proteins pass directly between cells.",
  },
  {
    id: "peroxisome",
    name: "Peroxisome",
    tagline: "Detox & Fatty Acid Breakdown",
    color: "#fb923c",
    description: "Small spherical organelles visible at the top of the cell. Break down fatty acids and neutralise toxic hydrogen peroxide using catalase enzyme.",
    fact: "Peroxisomes immediately destroy the H₂O₂ they generate — one of the fastest enzyme reactions known.",
  },
  {
    id: "cytoplasm",
    name: "Cytoplasm",
    tagline: "Internal Cellular Fluid",
    color: "#7dd3fc",
    description: "The gel-like aqueous solution (~70% water) that fills the cell interior, suspending all organelles and providing the medium for most metabolic reactions.",
    fact: "The cytoplasm constantly streams — a process called cytoplasmic streaming — to distribute nutrients and organelles throughout the cell.",
  },
];

const DATA = Object.fromEntries(ORGANELLES.map((o) => [o.id, o]));

export default function InteractivePlantCell() {
  const [activeId, setActiveId] = useState("nucleus");
  const [hoveredId, setHoveredId] = useState(null);

  const currentId = hoveredId || activeId;
  const currentData = DATA[currentId] || DATA.nucleus;
  const hl = (id) => id === activeId || id === hoveredId;

  // orgProps always goes on a wrapping <g> — never directly on styled SVG elements
  const orgProps = (id) => ({
    onClick: () => setActiveId(id),
    onMouseEnter: () => setHoveredId(id),
    onMouseLeave: () => setHoveredId(null),
    style: { cursor: "pointer" },
  });

  // ── Label connectors ─────────────────────────────────────────────────────
  // [id, lx, ly, ax, ay, textAnchor, displayLabel]
  const LABELS = [
    // Right-side labels
    ["er_rough",         492,  80, 380, 100, "start", "Rough ER"],
    ["peroxisome",       492, 110, 185, 162, "start", "Peroxisome"],
    ["chloroplast",      492, 140, 264, 125, "start", "Chloroplast"],
    ["nucleus",          492, 188, 336, 210, "start", "Nucleus"],
    ["nuclear_envelope", 492, 218, 370, 230, "start", "Nuclear Envelope"],
    ["golgi",            492, 258, 410, 275, "start", "Golgi Apparatus"],
    ["cell_wall",        492, 295, 412, 342, "start", "Cell Wall"],
    ["plasma_membrane",  492, 328, 404, 335, "start", "Plasma Membrane"],
    ["mitochondria",     492, 362, 380, 365, "start", "Mitochondria"],
    // Left-side labels
    ["er_smooth",         64, 215, 110, 220, "end",   "Smooth ER"],
    ["cytoplasm",         64, 185, 160, 180, "end",   "Cytoplasm"],
    ["central_vacuole",   64, 305, 120, 310, "end",   "Central Vacuole"],
    // Bottom labels
    ["chloroplast",      162, 474, 165, 385, "middle", "Chloroplast"],
    ["ribosome",         270, 474, 276, 396, "middle", "Ribosomes"],
    ["plasmodesmata",    385, 474, 270, 425, "middle", "Plasmodesmata"],
    // Top label
    ["tonoplast",        215,  38, 218, 186, "middle", "Tonoplast"],
  ];

  return (
    <div style={{
      display: "flex", width: "100%", height: "100%", minHeight: 0,
      background: "transparent", color: "#f1f5f9",
      fontFamily: "'Inter','Segoe UI',sans-serif", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", flex: 1, minHeight: 0, gap: "20px",
        padding: "20px", overflow: "hidden",
      }}>

        {/* ── SVG Diagram ─────────────────────────────────────────────────── */}
        <div style={{
          flex: "0 0 auto", width: "875px", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 560 510" width="575" height="575"
            style={{ display: "block", userSelect: "none", overflow: "visible" }}
            xmlns="http://www.w3.org/2000/svg">

            <defs>
              {/* Cytoplasm — pale aqua like animal cell */}
              <radialGradient id="pcCyto" cx="42%" cy="38%" r="62%">
                <stop offset="0%"   stopColor="rgba(186,230,253,0.30)" />
                <stop offset="100%" stopColor="rgba(103,232,249,0.07)" />
              </radialGradient>
              {/* Central Vacuole — golden amber (matches image) */}
              <radialGradient id="pcVac" cx="38%" cy="33%" r="62%">
                <stop offset="0%"   stopColor="#fef9c3" />
                <stop offset="50%"  stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.75" />
              </radialGradient>
              {/* Nucleus — orange gradient (exact animal-cell colour) */}
              <radialGradient id="pcNuc" cx="36%" cy="32%" r="62%">
                <stop offset="0%"   stopColor="#fed7aa" />
                <stop offset="48%"  stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2410c" stopOpacity="0.92" />
              </radialGradient>
              {/* Nucleolus */}
              <radialGradient id="pcNol" cx="35%" cy="35%" r="60%">
                <stop offset="0%"   stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
              {/* Mitochondria — red */}
              <radialGradient id="pcMito" cx="36%" cy="33%" r="65%">
                <stop offset="0%"   stopColor="#fecaca" />
                <stop offset="58%"  stopColor="#f87171" />
                <stop offset="100%" stopColor="#b91c1c" />
              </radialGradient>
              {/* Chloroplast — vivid green */}
              <radialGradient id="pcChloro" cx="35%" cy="35%" r="65%">
                <stop offset="0%"   stopColor="#bbf7d0" />
                <stop offset="55%"  stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </radialGradient>
              {/* Cell wall gradient — tan / amber */}
              <linearGradient id="pcWall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#d4a96a" />
                <stop offset="100%" stopColor="#a07840" />
              </linearGradient>
            </defs>

            {/* ══ LABEL CONNECTORS ══════════════════════════════════════════ */}
            {LABELS.map(([id, lx, ly, ax, ay, ta, label], idx) => {
              const info = DATA[id];
              const hi = hl(id);
              return (
                <g key={idx} {...orgProps(id)}
                  opacity={hi ? 1 : 0.5}
                  style={{ cursor: "pointer", transition: "opacity 0.2s" }}>
                  <line x1={ax} y1={ay} x2={lx} y2={ly}
                    stroke={hi ? info.color : "#475569"}
                    strokeWidth={hi ? 1.4 : 0.75}
                    strokeDasharray={hi ? "" : "3 2"} />
                  <text x={lx} y={ly + 4}
                    textAnchor={ta}
                    fontSize="10" fontWeight={hi ? 700 : 500}
                    fill={hi ? info.color : "#94a3b8"}
                    style={{ fontFamily: "'Inter','Segoe UI',sans-serif", transition: "fill 0.2s" }}>
                    {label}
                  </text>
                </g>
              );
            })}

            {/* ══ ADJACENT CELL WALL (visible bottom-right corner) ════════ */}
            {/* <rect x={387} y={450} width={90} height={32} rx={6}
              fill="url(#pcWall)" stroke="#a07840" strokeWidth={2} opacity={0.65} />
            <text x={437} y={496} textAnchor="middle" fontSize="9" fill="#94a3b8"
              style={{ fontFamily: "'Inter',sans-serif" }}>Adjacent Cell Wall</text> */}

            {/* ══ CELL WALL — thick golden-brown hexagonal boundary ════ */}
            <g {...orgProps("cell_wall")}>
              <polygon points="155,70 385,70 483,260 385,450 155,450 57,260"
                fill="none"
                stroke={hl("cell_wall") ? "#e3b341" : "#a07840"}
                strokeWidth={hl("cell_wall") ? 22 : 17}
                strokeLinejoin="round"
                style={{ filter: hl("cell_wall") ? "drop-shadow(0 0 10px #e3b341)" : "none", transition: "all 0.2s" }} />
            </g>

            {/* ══ PLASMODESMATA — channels in the cell wall ════════════════ */}
            {[
              [270, 70],                                    // top wall center
              [270, 450],                                   // bottom wall center
              [106, 165],                                   // top-left slanted wall center
              [106, 355],                                   // bottom-left slanted wall center
              [434, 165],                                   // top-right slanted wall center
              [434, 355],                                   // bottom-right slanted wall center
            ].map(([px, py], i) => (
              <g key={i} {...orgProps("plasmodesmata")}>
                <circle cx={px} cy={py} r={5.5}
                  fill={hl("plasmodesmata") ? "#86efac" : "rgba(134,239,172,0.5)"}
                  stroke={hl("plasmodesmata") ? "#4ade80" : "#166534"}
                  strokeWidth={1.2}
                  style={{ filter: hl("plasmodesmata") ? "drop-shadow(0 0 4px #86efac)" : "none", transition: "all 0.2s" }} />
              </g>
            ))}

            {/* ══ PLASMA MEMBRANE — thin green inner hexagon line ══════════════════ */}
            <g {...orgProps("plasma_membrane")}>
              <polygon points="160,79 380,79 473,260 380,441 160,441 67,260"
                fill="url(#pcCyto)"
                stroke={hl("plasma_membrane") ? "#4ade80" : "#16a34a"}
                strokeWidth={hl("plasma_membrane") ? 3.5 : 2}
                strokeLinejoin="round"
                style={{ filter: hl("plasma_membrane") ? "drop-shadow(0 0 6px #4ade80)" : "none", transition: "all 0.2s" }} />
            </g>

            {/* ══ CENTRAL VACUOLE — large golden oval, lower-left area ════ */}
            {/* Tonoplast membrane around vacuole */}
            <g {...orgProps("tonoplast")}>
              <ellipse cx={218} cy={306} rx={132} ry={120}
                fill="none"
                stroke={hl("tonoplast") ? "#f59e0b" : "rgba(245,158,11,0.55)"}
                strokeWidth={hl("tonoplast") ? 3 : 1.8}
                strokeDasharray={hl("tonoplast") ? "" : "5 2.5"}
                style={{ filter: hl("tonoplast") ? "drop-shadow(0 0 6px #f59e0b)" : "none", transition: "all 0.2s" }} />
            </g>
            {/* Vacuole fill */}
            <g {...orgProps("central_vacuole")}>
              <ellipse cx={218} cy={306} rx={127} ry={115}
                fill="url(#pcVac)"
                stroke={hl("central_vacuole") ? "#fbbf24" : "rgba(251,191,36,0.3)"}
                strokeWidth={hl("central_vacuole") ? 2 : 0.5}
                style={{ transition: "all 0.2s" }} />
            </g>

            {/* ══ SMOOTH ER — left side, coiled tubular shapes ═════════════ */}
            <g {...orgProps("er_smooth")}>
              {/* 5 kidney-shaped tubes forming a coiled stack on the left */}
              {[
                "M 90,170 C 108,157 142,163 154,178 C 142,193 108,197 90,183 Z",
                "M 87,193 C 106,180 142,186 155,201 C 142,216 106,219 87,206 Z",
                "M 87,215 C 106,202 143,207 156,223 C 143,238 106,241 87,228 Z",
                "M 88,237 C 107,224 144,229 157,245 C 144,260 107,263 88,250 Z",
                "M 90,258 C 108,246 144,250 156,266 C 144,282 108,284 90,271 Z",
              ].map((d, i) => (
                <path key={i} d={d}
                  fill={`rgba(129,140,248,${0.10 + i * 0.05})`}
                  stroke={hl("er_smooth") ? "#818cf8" : "#6366f1"}
                  strokeWidth={hl("er_smooth") ? 2.5 : 1.8}
                  style={{ filter: hl("er_smooth") ? "drop-shadow(0 0 5px #818cf8)" : "none", transition: "all 0.2s" }} />
              ))}
            </g>

            {/* ══ ROUGH ER — top right, horizontal wavy stacks + ribosomes ═ */}
            {/* Connects to / emanates from the nuclear envelope */}
            {[0, 14, 28, 42, 55].map((dy, i) => {
              const hi2 = hl("er_rough");
              const x0 = 350, y0 = 82 + dy;
              return (
                <g key={i}>
                  <g {...orgProps("er_rough")}>
                    <path
                      d={`M ${x0},${y0} C ${x0+22},${y0-10} ${x0+52},${y0+9} ${x0+82},${y0} C ${x0+96},${y0-8} ${x0+114},${y0+6} ${x0+130},${y0}`}
                      fill={`rgba(96,165,250,${0.07 + i * 0.04})`}
                      stroke={hi2 ? "#60a5fa" : "#3b82f6"}
                      strokeWidth={hi2 ? 12 : 10}
                      style={{ filter: hi2 ? "drop-shadow(0 0 5px #60a5fa)" : "none", transition: "all 0.2s" }} />
                  </g>
                  {/* Ribosome dots on outer (top) face of each rough ER layer */}
                  {[354, 366, 378, 390, 402, 414, 426, 438, 450, 462, 474].map((rx2, j) => (
                    <g key={j} {...orgProps("ribosome")}>
                      <circle cx={rx2} cy={y0 - 5} r={2.8}
                        fill={hl("ribosome") ? "#facc15" : "#ca8a04"}
                        opacity={hl("ribosome") ? 1 : 0.7}
                        style={{ filter: hl("ribosome") ? "drop-shadow(0 0 3px #facc15)" : "none", transition: "all 0.2s" }} />
                    </g>
                  ))}
                </g>
              );
            })}

            {/* ══ CHLOROPLASTS — oval with grana stacks ════════════════════ */}
            {[
              // Top-left pair (near rough ER)
              { cx: 192, cy: 130, rx: 33, ry: 14, angle: -5  },
              { cx: 264, cy: 125, rx: 31, ry: 13, angle:  8  },
              // Bottom pair
              { cx: 165, cy: 385, rx: 30, ry: 13, angle: 12  },
              { cx: 248, cy: 385, rx: 28, ry: 12, angle: -8  },
              // Left-middle (beside smooth ER)
              { cx: 125, cy: 335, rx: 27, ry: 12, angle: 28  },
            ].map((c, i) => {
              const hi2 = hl("chloroplast");
              const grx = c.rx, gry = c.ry;
              return (
                <g key={i} transform={`rotate(${c.angle},${c.cx},${c.cy})`}
                  {...orgProps("chloroplast")}>
                  {/* Chloroplast body */}
                  <ellipse cx={c.cx} cy={c.cy} rx={grx} ry={gry}
                    fill={hi2 ? "rgba(34,197,94,0.82)" : "rgba(34,197,94,0.58)"}
                    stroke={hi2 ? "#4ade80" : "#15803d"}
                    strokeWidth={hi2 ? 2 : 1.3}
                    style={{ filter: hi2 ? "drop-shadow(0 0 7px #22c55e)" : "none", transition: "all 0.2s" }} />
                  {/* Grana (thylakoid stack lines) */}
                  {[-grx*0.48, -grx*0.16, grx*0.16, grx*0.48].map((dx, j) => (
                    <ellipse key={j}
                      cx={c.cx + dx} cy={c.cy}
                      rx={grx * 0.11} ry={gry * 0.75}
                      fill={hi2 ? "rgba(21,128,61,0.85)" : "rgba(21,100,50,0.6)"}
                      stroke="none" />
                  ))}
                </g>
              );
            })}

            {/* ══ NUCLEAR ENVELOPE — double membrane with pores ═══════════ */}
            <g {...orgProps("nuclear_envelope")}>
              {/* Outer membrane */}
              <circle cx={336} cy={210} r={66}
                fill="none"
                stroke={hl("nuclear_envelope") ? "#fb923c" : "rgba(251,146,60,0.52)"}
                strokeWidth={hl("nuclear_envelope") ? 5.5 : 4}
                style={{ filter: hl("nuclear_envelope") ? "drop-shadow(0 0 9px #fb923c)" : "none", transition: "all 0.2s" }} />
              {/* Inner membrane */}
              <circle cx={336} cy={210} r={59}
                fill="none"
                stroke={hl("nuclear_envelope") ? "rgba(251,146,60,0.5)" : "rgba(251,146,60,0.25)"}
                strokeWidth={hl("nuclear_envelope") ? 2 : 1.5} />
              {/* Nuclear pores */}
              {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const px = 336 + 66 * Math.cos(rad);
                const py = 210 + 66 * Math.sin(rad);
                return (
                  <circle key={deg} cx={px} cy={py} r={3.2}
                    fill={hl("nuclear_envelope") ? "#fb923c" : "rgba(251,146,60,0.6)"}
                    stroke={hl("nuclear_envelope") ? "#c2410c" : "rgba(194,65,12,0.45)"}
                    strokeWidth={0.8} />
                );
              })}
            </g>

            {/* ══ NUCLEUS — orange gradient sphere ════════════════════════ */}
            <g {...orgProps("nucleus")}>
              <circle cx={336} cy={210} r={57}
                fill="url(#pcNuc)"
                fillOpacity={hl("nucleus") ? 1 : 0.9}
                stroke={hl("nucleus") ? "#f97316" : "#ea580c"}
                strokeWidth={hl("nucleus") ? 2.5 : 1.5}
                style={{ filter: hl("nucleus") ? "drop-shadow(0 0 14px rgba(249,115,22,0.6))" : "none", transition: "all 0.2s" }} />
            </g>

            {/* ══ NUCLEOLUS — dense amber core inside nucleus ═════════════ */}
            <g {...orgProps("nucleolus")}>
              <circle cx={326} cy={200} r={20}
                fill="url(#pcNol)"
                fillOpacity={hl("nucleolus") ? 0.98 : 0.88}
                stroke={hl("nucleolus") ? "#fbbf24" : "#d97706"}
                strokeWidth={hl("nucleolus") ? 2 : 1.3}
                style={{ filter: hl("nucleolus") ? "drop-shadow(0 0 8px rgba(251,191,36,0.75))" : "none", transition: "all 0.2s" }} />
            </g>

            {/* ══ GOLGI APPARATUS — stacked wavy green sacs (right side) ══ */}
            <g {...orgProps("golgi")}>
              {[0, 13, 25, 36].map((dy, i) => {
                const w = 60 - i * 8, ox = 398 + i * 3, oy = 262 + dy;
                return (
                  <path key={i}
                    d={`M ${ox},${oy} Q ${ox+w/2},${oy-11} ${ox+w},${oy} Q ${ox+w+9},${oy+6} ${ox+w},${oy+12} Q ${ox+w/2},${oy+2} ${ox},${oy+12} Q ${ox-9},${oy+5} ${ox},${oy} Z`}
                    fill={`rgba(74,222,128,${0.18 + i * 0.09})`}
                    stroke={hl("golgi") ? "#4ade80" : "#16a34a"}
                    strokeWidth={hl("golgi") ? 2 : 1.4}
                    style={{ filter: hl("golgi") ? "drop-shadow(0 0 8px #4ade80)" : "none", transition: "all 0.2s" }} />
                );
              })}
              {/* Golgi vesicle buds */}
              {[[462, 270], [455, 283], [460, 296]].map(([vx, vy], i) => (
                <circle key={i} cx={vx} cy={vy} r={5}
                  fill={hl("golgi") ? "rgba(74,222,128,0.7)" : "rgba(74,222,128,0.38)"}
                  stroke={hl("golgi") ? "#4ade80" : "#16a34a"}
                  strokeWidth={0.8} />
              ))}
            </g>

            {/* ══ MITOCHONDRIA — red ovals with cristae, scattered ════════ */}
            {[
              { cx: 140, cy: 190, rx: 22, ry: 11, angle: -32 },
              { cx: 352, cy: 345, rx: 20, ry: 10, angle:  20 },
              { cx: 380, cy: 365, rx: 18, ry:  9, angle: -14 },
              { cx: 185, cy: 375, rx: 17, ry:  8, angle:  10 },
              { cx: 390, cy: 165, rx: 17, ry:  8, angle:   6 },
            ].map((m, i) => (
              <g key={i} transform={`rotate(${m.angle},${m.cx},${m.cy})`}
                {...orgProps("mitochondria")}>
                {/* Outer membrane */}
                <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry}
                  fill={hl("mitochondria") ? "rgba(248,113,113,0.65)" : "rgba(248,113,113,0.42)"}
                  stroke={hl("mitochondria") ? "#f87171" : "#ef4444"}
                  strokeWidth={hl("mitochondria") ? 2.5 : 1.5}
                  style={{ filter: hl("mitochondria") ? "drop-shadow(0 0 7px #f87171)" : "none", transition: "all 0.2s" }} />
                {/* Cristae — inner membrane folds */}
                {[-m.rx*0.38, 0, m.rx*0.38].map((dx, j) => (
                  <path key={j}
                    d={`M ${m.cx+dx},${m.cy - m.ry*0.65} C ${m.cx+dx+3.5},${m.cy} ${m.cx+dx-3.5},${m.cy} ${m.cx+dx},${m.cy + m.ry*0.65}`}
                    fill="none"
                    stroke={hl("mitochondria") ? "rgba(254,202,202,0.75)" : "rgba(254,202,202,0.32)"}
                    strokeWidth={0.9} />
                ))}
              </g>
            ))}

            {/* ══ PEROXISOMES — small orange spheres near top ═════════════ */}
            {[
              { cx: 155, cy: 145 },
              { cx: 172, cy: 155 },
              { cx: 190, cy: 145 },
            ].map((p, i) => (
              <g key={i} {...orgProps("peroxisome")}>
                <circle cx={p.cx} cy={p.cy} r={8.5}
                  fill={hl("peroxisome") ? "rgba(251,146,60,0.8)" : "rgba(251,146,60,0.52)"}
                  stroke={hl("peroxisome") ? "#fb923c" : "#c2410c"}
                  strokeWidth={hl("peroxisome") ? 2 : 1.3}
                  style={{ filter: hl("peroxisome") ? "drop-shadow(0 0 7px #fb923c)" : "none", transition: "all 0.2s" }} />
                {/* Highlight */}
                <circle cx={p.cx - 3} cy={p.cy - 3} r={3.2}
                  fill="rgba(255,237,213,0.55)" />
              </g>
            ))}

            {/* ══ SCATTERED RIBOSOMES in cytoplasm ════════════════════════ */}
            {[
              [165, 215], [180, 204], [198, 218], [150, 198],
              [302, 165], [314, 176], [328, 163],
              [260, 385], [276, 396], [290, 382],
              [390, 340], [405, 330],
            ].map(([rx2, ry2], i) => (
              <g key={i} {...orgProps("ribosome")}>
                <circle cx={rx2} cy={ry2} r={3.5}
                  fill={hl("ribosome") ? "#facc15" : "#ca8a04"}
                  style={{ filter: hl("ribosome") ? "drop-shadow(0 0 4px #facc15)" : "none", transition: "all 0.2s" }} />
                <circle cx={rx2 + 2.4} cy={ry2 - 2} r={2.2}
                  fill={hl("ribosome") ? "#fef3c7" : "#92400e"} opacity={0.8} />
              </g>
            ))}

          </svg>

          {/* Hint badge */}
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            background: "rgba(15,23,42,0.85)", border: "1px solid rgba(100,116,139,0.4)",
            backdropFilter: "blur(8px)", borderRadius: "999px",
            padding: "4px 14px", fontSize: "10.5px", color: "#94a3b8",
            whiteSpace: "nowrap", pointerEvents: "none",
          }}>
            Click or hover an organelle to learn more
          </div>
        </div>

        {/* ── Info Panel ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", minWidth: 0 }}>

          {/* Header card */}
          <div style={{
            background: "rgba(15,23,42,0.92)",
            border: `1px solid ${currentData.color}35`,
            borderRadius: "16px", padding: "18px 20px",
            boxShadow: `0 8px 24px ${currentData.color}16`,
            transition: "all 0.25s ease", minHeight: 115,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: currentData.color, boxShadow: `0 0 8px ${currentData.color}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                {currentData.tagline}
              </span>
            </div>
            <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
              {currentData.name}
            </h2>
            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
              {currentData.description}
            </p>
          </div>

          {/* Fun fact card */}
          <div style={{
            background: `linear-gradient(135deg, ${currentData.color}14, rgba(15,23,42,0.72))`,
            border: `1px solid ${currentData.color}28`,
            borderRadius: "12px", padding: "14px 16px",
            transition: "all 0.25s ease",
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: currentData.color, marginBottom: "6px" }}>
              Did you know?
            </div>
            <p style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: 1.55, margin: 0 }}>
              {currentData.fact}
            </p>
          </div>

          {/* Organelle selector grid */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "8px", minHeight: 0 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
              All Organelles
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px",
              overflowY: "auto", paddingRight: "4px", boxSizing: "border-box",
            }}>
              {ORGANELLES.map((o) => {
                const selected = activeId === o.id;
                return (
                  <button key={o.id}
                    onClick={() => setActiveId(o.id)}
                    onMouseEnter={() => setHoveredId(o.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "7px 10px", borderRadius: "10px",
                      border: `1px solid ${selected ? o.color + "60" : "rgba(71,85,105,0.4)"}`,
                      background: selected ? `${o.color}18` : "rgba(15,23,42,0.6)",
                      color: selected ? o.color : "#cbd5e1",
                      fontSize: "11.5px", fontWeight: selected ? 600 : 500,
                      cursor: "pointer", textAlign: "left", outline: "none",
                      boxShadow: selected ? `0 0 0 1px ${o.color}18` : "none",
                      height: "38px", width: "100%",
                      justifyContent: "flex-start", flexShrink: 0,
                      transition: "background 0.15s, border-color 0.15s",
                    }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: o.color, flexShrink: 0,
                      boxShadow: selected ? `0 0 6px ${o.color}` : "none",
                    }} />
                    <span style={{ lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {o.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}