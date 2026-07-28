// ─── Cell Canvas Drawing Utilities ────────────────────────────────────────────
import { CELL_TYPES, ORGANELLES } from "../constants/cellConstants";

const TWO_PI = Math.PI * 2;

// ── Helpers ────────────────────────────────────────────────────────────────────
function circle(ctx, x, y, r, fillStyle, strokeStyle, lineWidth = 1.5) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
  if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function glowCircle(ctx, x, y, r, color, glowColor, glowRadius = 22) {
  const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r + glowRadius);
  g.addColorStop(0, glowColor.replace("0.35", "0.55"));
  g.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, r + glowRadius, 0, TWO_PI);
  ctx.fillStyle = g;
  ctx.fill();
  circle(ctx, x, y, r, color + "22", color, 2);
}

function text(ctx, str, x, y, color, size = 11, align = "center", bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? "700" : "500"} ${size}px Inter, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
}

// ── Cell membrane outline ──────────────────────────────────────────────────────
function drawCellBoundary(ctx, cx, cy, rx, ry, cellType, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  if (cellType === CELL_TYPES.PLANT || cellType === CELL_TYPES.BACTERIAL) {
    // Square-ish rounded rect for plant/bacteria
    const w = rx * 2, h = ry * 2;
    const rad = 18;
    const x = cx - rx, y = cy - ry;
    // Cell wall (outer thick rect)
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 8, w + 16, h + 16, rad + 6);
    ctx.strokeStyle = "#e3b341";
    ctx.lineWidth = 7;
    ctx.setLineDash([]);
    ctx.stroke();

    // Cell membrane (inner)
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = color + "10";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else {
    // Smooth animal cell ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TWO_PI);
    ctx.fillStyle = color + "10";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ── Individual organelle renderers ─────────────────────────────────────────────
function drawNucleus(ctx, x, y, scale = 1) {
  const r = 38 * scale; // Clean, proportional nucleus size

  // Outer nuclear envelope glow
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.4);
  glow.addColorStop(0, "rgba(255,160,60,0.18)");
  glow.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(x, y, r * 1.4, 0, TWO_PI);
  ctx.fillStyle = glow; ctx.fill();

  // Main nucleus fill — warm orange radial gradient (like reference)
  const nFill = ctx.createRadialGradient(x - r * 0.25, y - r * 0.2, r * 0.05, x, y, r);
  nFill.addColorStop(0, "rgba(255,200,100,0.85)");
  nFill.addColorStop(0.5, "rgba(255,140,40,0.75)");
  nFill.addColorStop(1, "rgba(210,90,20,0.65)");
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fillStyle = nFill; ctx.fill();

  // Nuclear envelope (double membrane)
  ctx.strokeStyle = "rgba(255,160,60,0.9)";
  ctx.lineWidth = 2.2 * scale;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.stroke();
  ctx.strokeStyle = "rgba(255,180,80,0.4)";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath(); ctx.arc(x, y, r - 4 * scale, 0, TWO_PI); ctx.stroke();

  // Nuclear pores — small notches around boundary
  ctx.strokeStyle = "rgba(255,120,30,0.8)";
  ctx.lineWidth = 1.5 * scale;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TWO_PI;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(px, py, 3 * scale, 0, TWO_PI);
    ctx.fillStyle = "rgba(30,10,0,0.6)"; ctx.fill();
    ctx.stroke();
  }

  // Nucleolus — large golden inner sphere, offset
  const nx = x + r * 0.18, ny = y - r * 0.1;
  const nr = r * 0.38;
  const nGrad = ctx.createRadialGradient(nx - nr * 0.3, ny - nr * 0.3, 0, nx, ny, nr);
  nGrad.addColorStop(0, "rgba(255,220,120,0.9)");
  nGrad.addColorStop(1, "rgba(200,110,20,0.75)");
  ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TWO_PI);
  ctx.fillStyle = nGrad; ctx.fill();
  ctx.strokeStyle = "rgba(230,150,40,0.6)";
  ctx.lineWidth = 1.2 * scale;
  ctx.stroke();

  // Label
  text(ctx, "Nucleus", x, y + r + 14, "rgba(255,160,60,0.9)", 9.5, "center", true);
}

function drawMitochondria(ctx, x, y, scale = 1, t = 0, angle = 0) {
  const w = 42 * scale, h = 20 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.sin(t * 0.4) * 0.08);

  // Outer membrane — warm pink gradient fill (bean shape)
  const mFill = ctx.createLinearGradient(-w, -h, w, h);
  mFill.addColorStop(0, "rgba(255,160,150,0.35)");
  mFill.addColorStop(0.5, "rgba(240,100,100,0.25)");
  mFill.addColorStop(1, "rgba(200,60,60,0.15)");
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, TWO_PI);
  ctx.fillStyle = mFill;
  ctx.fill();
  ctx.strokeStyle = "#f08080";
  ctx.lineWidth = 2.2 * scale;
  ctx.stroke();

  // Inner membrane (slightly inset)
  ctx.strokeStyle = "rgba(240,120,100,0.35)";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.8, h * 0.7, 0, 0, TWO_PI);
  ctx.stroke();

  // Cristae — 4 curved folds perpendicular to long axis (like reference)
  ctx.strokeStyle = "rgba(240,110,90,0.75)";
  ctx.lineWidth = 1.5 * scale;
  const folds = 4;
  for (let i = 0; i < folds; i++) {
    const fx = -w * 0.6 + (i / (folds - 1)) * w * 1.2;
    const ht = h * 0.55;
    ctx.beginPath();
    ctx.moveTo(fx, -ht);
    ctx.bezierCurveTo(fx + 6 * scale, -ht * 0.3, fx - 6 * scale, ht * 0.3, fx, ht);
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, "Mitochondria", x, y + h + 14, "rgba(240,120,100,0.9)", 8.5, "center", false);
}

function drawChloroplast(ctx, x, y, scale = 1, t = 0) {
  const w = 40 * scale, h = 22 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, TWO_PI);
  ctx.fillStyle = "rgba(26,188,156,0.22)";
  ctx.fill();
  ctx.strokeStyle = "#1abc9c";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Thylakoid discs
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 11 * scale, 0, 8 * scale, 12 * scale, 0, 0, TWO_PI);
    ctx.fillStyle = "rgba(26,188,156,0.4)";
    ctx.fill();
    ctx.strokeStyle = "#1abc9c88";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
  // Photon animation — pulsing light ray
  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.beginPath();
  ctx.arc(x - 18 * scale, y - 26 * scale, 4 * scale, 0, TWO_PI);
  ctx.fillStyle = `rgba(227,179,65,${0.3 + 0.6 * pulse})`;
  ctx.fill();
  text(ctx, "Cl", x, y + h + 14, "#1abc9c", 9.5);
}

function drawVacuole(ctx, x, y, scale = 1, large = false) {
  const r = (large ? 32 : 14) * scale;
  // Light blue clear vesicle
  const vFill = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  vFill.addColorStop(0, "rgba(160,220,255,0.35)");
  vFill.addColorStop(1, "rgba(80,160,220,0.12)");
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fillStyle = vFill; ctx.fill();
  ctx.strokeStyle = "rgba(100,190,240,0.7)";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  // Shimmer highlight
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, TWO_PI);
  ctx.fillStyle = "rgba(200,240,255,0.5)";
  ctx.fill();
  if (large) text(ctx, "Vacuole", x, y + r + 13, "rgba(100,190,240,0.85)", 8.5, "center", false);
}

function drawRibosome(ctx, x, y, scale = 1) {
  // Tiny gold dots — like reference image (small yellow specks)
  const r = 3.5 * scale;
  circle(ctx, x, y, r, "rgba(230,190,60,0.85)", "rgba(200,160,30,0.6)", 1);
  // Small subunit
  circle(ctx, x + r * 0.9, y - r * 0.6, r * 0.65, "rgba(210,175,50,0.7)", null);
}

function drawGolgi(ctx, x, y, scale = 1) {
  // Golgi apparatus — C-shaped curved stacked membrane layers, GREEN like reference
  const layers = 6;
  const baseW = 46 * scale;
  const baseH = 7 * scale;
  const gap = 9 * scale;
  const curl = 22 * scale; // horizontal C-curve extent

  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < layers; i++) {
    const frac = i / (layers - 1);
    const oy = (i - (layers - 1) / 2) * gap;
    // Width tapers toward ends of the C
    const ww = baseW * (1 - frac * 0.35);
    // C-curve: start and end X curve outward
    const cx0 = -ww / 2 + curl * (1 - frac) * 0.5;
    const cx1 = ww / 2 - curl * frac * 0.3;
    const alpha = 0.2 + frac * 0.35;
    const green = `rgba(60,180,80,${alpha})`;

    ctx.beginPath();
    ctx.moveTo(cx0, oy - baseH / 2);
    ctx.bezierCurveTo(
      cx0 - curl * 0.6, oy,
      cx1 - curl * 0.3, oy,
      cx1, oy + baseH / 2
    );
    ctx.bezierCurveTo(
      cx1 + 6, oy + baseH,
      cx0 + 6, oy + baseH,
      cx0, oy + baseH / 2
    );
    ctx.closePath();
    ctx.fillStyle = green;
    ctx.fill();
    ctx.strokeStyle = `rgba(40,160,60,${0.6 + frac * 0.3})`;
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
  }

  // Vesicle buds on cis and trans face
  [[-baseW * 0.5 + curl * 0.3, -(layers / 2) * gap], [baseW * 0.3, (layers / 2) * gap]].forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.arc(bx, by, 5.5 * scale, 0, TWO_PI);
    ctx.fillStyle = "rgba(60,200,80,0.4)";
    ctx.fill();
    ctx.strokeStyle = "rgba(40,160,60,0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  ctx.restore();
  text(ctx, "Golgi", x, y + (layers / 2) * gap + 16, "rgba(60,200,80,0.9)", 8.5, "center", false);
}

function drawRoughER(ctx, x, y, scale = 1) {
  // Rough ER — blue flat wavy sheet layers with ribosome dots on surface (like reference)
  const rows = 4;
  const rowH = 11 * scale;
  const halfW = 44 * scale;
  const totalH = rows * rowH;

  for (let i = 0; i < rows; i++) {
    const oy = y - totalH / 2 + i * rowH;
    // Wavy sheet — gentle S-curve
    ctx.beginPath();
    ctx.moveTo(x - halfW, oy);
    ctx.bezierCurveTo(
      x - halfW * 0.4, oy - 4 * scale,
      x + halfW * 0.4, oy + 4 * scale,
      x + halfW, oy
    );
    ctx.bezierCurveTo(
      x + halfW * 0.4, oy + rowH * 0.6,
      x - halfW * 0.4, oy + rowH * 0.4,
      x - halfW, oy + rowH
    );
    ctx.closePath();
    const alpha = 0.12 + i * 0.04;
    ctx.fillStyle = `rgba(70,130,220,${alpha})`;
    ctx.fill();
    ctx.strokeStyle = "rgba(80,150,240,0.65)";
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Ribosomes — small gold dots along the top edge of each sheet
    const steps = 8;
    for (let j = 0; j <= steps; j++) {
      const t2 = j / steps;
      const rx2 = x - halfW + t2 * halfW * 2;
      // Follow the bezier curve approximately
      const ry2 = oy + Math.sin(t2 * Math.PI) * (-4 * scale) + (1 - Math.sin(t2 * Math.PI)) * 4 * scale - 3 * scale;
      drawRibosome(ctx, rx2, ry2, scale * 0.75);
    }
  }
  text(ctx, "Rough ER", x, y + totalH / 2 + 14, "rgba(80,150,240,0.9)", 8.5, "center", false);
}

function drawLysosome(ctx, x, y, scale = 1) {
  // Small dark blue/purple round blob — like reference image
  const r = 11 * scale;
  const lFill = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  lFill.addColorStop(0, "rgba(120,80,220,0.7)");
  lFill.addColorStop(1, "rgba(60,30,160,0.55)");
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fillStyle = lFill; ctx.fill();
  ctx.strokeStyle = "rgba(130,90,230,0.8)";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  // Tiny enzyme dot inside
  circle(ctx, x, y, 2.5 * scale, "rgba(160,120,255,0.8)", null);
  text(ctx, "Lysosome", x, y + r + 12, "rgba(130,90,230,0.85)", 8, "center", false);
}

function drawCytoplasm(ctx, cx, cy, rx, ry) {
  // Warm cream/yellow interior fill matching reference image tone, on dark bg
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 0.95);
  g.addColorStop(0, "rgba(255,240,180,0.11)");
  g.addColorStop(0.7, "rgba(255,220,140,0.06)");
  g.addColorStop(1, "rgba(255,200,100,0.02)");
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.97, ry * 0.97, 0, 0, TWO_PI);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  text(ctx, "Cytoplasm", cx - rx * 0.55, cy + ry * 0.55, "rgba(200,175,80,0.45)", 8.5, "center", false);
}

function drawSmoothER(ctx, x, y, scale = 1) {
  // Smooth ER — blue tubular curved ribbons, no ribosome dots (like reference)
  ctx.save();
  ctx.translate(x, y);

  const tubeColor = "rgba(70,140,230,0.75)";
  const tubeFill = "rgba(50,100,200,0.18)";
  const lineW = 6 * scale; // thick tubular look
  const tubes = [
    // Each tube: [x1,y1, cpx1,cpy1, cpx2,cpy2, x2,y2]
    [-40*scale, -12*scale,  -10*scale, -28*scale,  10*scale, 4*scale,  38*scale, -8*scale],
    [-36*scale,  2*scale,   -8*scale, -14*scale,  12*scale, 18*scale, 40*scale, 6*scale],
    [-32*scale, 16*scale,   -6*scale,  2*scale,   14*scale, 30*scale, 38*scale, 20*scale],
  ];

  tubes.forEach(([x1,y1,cpx1,cpy1,cpx2,cpy2,x2,y2]) => {
    // Tube fill
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
    ctx.strokeStyle = tubeFill;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.stroke();
    // Tube outline
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
    ctx.strokeStyle = tubeColor;
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
  });

  ctx.restore();
  text(ctx, "Smooth ER", x, y + 36 * scale, "rgba(70,150,240,0.9)", 8.5, "center", false);
}

function drawPeroxisome(ctx, x, y, scale = 1) {
  const r = 10 * scale;
  // Pinkish-red small oval (like small mitochondria but rounder)
  const pFill = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  pFill.addColorStop(0, "rgba(255,180,60,0.55)");
  pFill.addColorStop(1, "rgba(200,120,20,0.35)");
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fillStyle = pFill; ctx.fill();
  ctx.strokeStyle = "rgba(230,150,40,0.75)";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  // Inner catalase granule dot
  circle(ctx, x, y, 2.5 * scale, "rgba(255,210,80,0.8)", null);
  text(ctx, "Peroxisome", x, y + r + 12, "rgba(230,160,40,0.85)", 7.5, "center", false);
}

function drawCentriole(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  
  // Cylinder 1 (angled vertical)
  ctx.save();
  ctx.rotate(0.25);
  ctx.fillStyle = "#fbbf24";
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.2 * scale;
  ctx.fillRect(-5 * scale, -12 * scale, 10 * scale, 24 * scale);
  ctx.strokeRect(-5 * scale, -12 * scale, 10 * scale, 24 * scale);
  // Internal tubule lines
  ctx.beginPath();
  ctx.moveTo(-2 * scale, -12 * scale); ctx.lineTo(-2 * scale, 12 * scale);
  ctx.moveTo(2 * scale, -12 * scale); ctx.lineTo(2 * scale, 12 * scale);
  ctx.stroke();
  ctx.restore();

  // Cylinder 2 (perpendicular horizontal)
  ctx.save();
  ctx.translate(6 * scale, 4 * scale);
  ctx.rotate(0.25 + Math.PI / 2);
  ctx.fillStyle = "#fbbf24";
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.2 * scale;
  ctx.fillRect(-5 * scale, -12 * scale, 10 * scale, 24 * scale);
  ctx.strokeRect(-5 * scale, -12 * scale, 10 * scale, 24 * scale);
  ctx.beginPath();
  ctx.moveTo(-2 * scale, -12 * scale); ctx.lineTo(-2 * scale, 12 * scale);
  ctx.moveTo(2 * scale, -12 * scale); ctx.lineTo(2 * scale, 12 * scale);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  text(ctx, "Centriole", x, y + 20 * scale, "rgba(251,191,36,0.9)", 8, "center", false);
}

function drawMicrotubule(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(212,178,111,0.55)";
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  // 3 radiating lines
  ctx.moveTo(0, 0); ctx.lineTo(35 * scale, -15 * scale);
  ctx.moveTo(0, 0); ctx.lineTo(40 * scale, 0);
  ctx.moveTo(0, 0); ctx.lineTo(32 * scale, 20 * scale);
  ctx.stroke();
  // Add tiny tubulin dots on ends
  circle(ctx, 35 * scale, -15 * scale, 2.2 * scale, "#d4b26f", null);
  circle(ctx, 40 * scale, 0, 2.2 * scale, "#d4b26f", null);
  circle(ctx, 32 * scale, 20 * scale, 2.2 * scale, "#d4b26f", null);
  ctx.restore();
  text(ctx, "Microtubules", x + 20 * scale, y + 30 * scale, "rgba(212,178,111,0.8)", 8, "center", false);
}

function drawCellWall(ctx, cx, cy, rx, ry) {
  // Already drawn as part of plant cell boundary — just add label
  text(ctx, "Cell Wall", cx + rx + 8, cy - ry + 16, "#e3b341", 10, "left", true);
}

function drawFlagella(ctx, x, y, scale = 1, t = 0) {
  // Animated wavy flagella
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= 40; i++) {
    const px = x + i * 5 * scale;
    const py = y + Math.sin(i * 0.8 + t * 3) * 12 * scale;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "#50fa7b";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text(ctx, "Fl", x + 100 * scale, y, "#50fa7b", 9.5);
}

function drawNucleoid(ctx, x, y, scale = 1) {
  // Irregular blob for bacterial DNA
  ctx.beginPath();
  ctx.ellipse(x, y, 24 * scale, 16 * scale, 0.3, 0, TWO_PI);
  ctx.fillStyle = "rgba(255,184,108,0.25)";
  ctx.fill();
  ctx.strokeStyle = "#ffb86c";
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, "Nd", x, y + 20 * scale, "#ffb86c", 9.5);
}

// ── Map organelle id → draw function ──────────────────────────────────────────
const ORGAN_DRAW = {
  nucleus:      (ctx, x, y, s, t) => drawNucleus(ctx, x, y, s),
  mitochondria: drawMitochondria,
  cell_membrane:(ctx, x, y, s)    => {},  // drawn as boundary, skip here
  cell_wall:    (ctx, x, y, s)    => {},  // drawn as boundary, skip here
  cytoplasm:    (ctx, x, y, s)    => {},  // drawn as background fill, skip here
  chloroplast:  drawChloroplast,
  vacuole:      (ctx, x, y, s, t, extra) => drawVacuole(ctx, x, y, s, extra?.large),
  ribosome:     (ctx, x, y, s)    => drawRibosome(ctx, x, y, s),
  golgi:        (ctx, x, y, s)    => drawGolgi(ctx, x, y, s),
  er_rough:     (ctx, x, y, s)    => drawRoughER(ctx, x, y, s),
  er_smooth:    (ctx, x, y, s)    => drawSmoothER(ctx, x, y, s),
  lysosome:     (ctx, x, y, s)    => drawLysosome(ctx, x, y, s),
  peroxisome:   (ctx, x, y, s)    => drawPeroxisome(ctx, x, y, s),
  centriole:    (ctx, x, y, s)    => drawCentriole(ctx, x, y, s),
  microtubule:  (ctx, x, y, s)    => drawMicrotubule(ctx, x, y, s),
  flagella:     drawFlagella,
  nucleoid:     (ctx, x, y, s)    => drawNucleoid(ctx, x, y, s),
};

export function drawOrganelle(ctx, organelleId, x, y, scale = 1, t = 0, extra = {}) {
  const fn = ORGAN_DRAW[organelleId];
  if (fn) fn(ctx, x, y, scale, t, extra);
}

// ── Full microscope view: draw a complete pre-configured cell ─────────────────
export function drawMicroscopeCell(ctx, W, H, cellType, selectedTarget, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;

  // Microscope lens vignette effect
  const vig = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.7);
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (cellType === CELL_TYPES.ANIMAL) {
    drawAnimalCellFull(ctx, cx, cy, W, H, t);
  } else if (cellType === CELL_TYPES.PLANT) {
    drawPlantCellFull(ctx, cx, cy, W, H, t);
  } else {
    drawBacterialCellFull(ctx, cx, cy, W, H, t);
  }

  // Draw selection ring directly at the hit-tested position — no coordinate remapping needed
  if (selectedTarget) {
    const isBoundary = selectedTarget.id === "cell_membrane" || selectedTarget.id === "cell_wall";

    if (isBoundary) {
      // Draw boundary selection glow
      ctx.save();
      // Professional slow breathing pulse
      const pulse = 1.0 + 0.008 * Math.sin(t * 2.5);
      
      const rx = cellType === CELL_TYPES.ANIMAL ? Math.min(W, H) * 0.33 : cellType === CELL_TYPES.PLANT ? Math.min(W, H) * 0.32 : Math.min(W, H) * 0.28;
      const ry = cellType === CELL_TYPES.ANIMAL ? Math.min(W, H) * 0.28 : cellType === CELL_TYPES.PLANT ? Math.min(W, H) * 0.30 : Math.min(W, H) * 0.18;
      
      const targetColor = selectedTarget.id === "cell_wall" ? "#e3b341" : (cellType === CELL_TYPES.ANIMAL ? "#39d353" : cellType === CELL_TYPES.PLANT ? "#1abc9c" : "#ffb86c");
      
      // Clean, solid outer line with soft professional shadow
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = selectedTarget.id === "cell_wall" ? 2.5 : 2.0;
      ctx.shadowBlur = 8;
      ctx.shadowColor = targetColor;
      
      if (cellType === CELL_TYPES.ANIMAL) {
        // Ellipse membrane
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * pulse, ry * pulse, 0, 0, TWO_PI);
        ctx.stroke();
      } else {
        // Plant/bacteria rounded rect
        const w = rx * 2, h = ry * 2;
        const rad = 18;
        const offset = selectedTarget.id === "cell_wall" ? 8 : 0;
        
        ctx.beginPath();
        const scaleW = w * pulse + offset * 2;
        const scaleH = h * pulse + offset * 2;
        ctx.roundRect(cx - scaleW / 2, cy - scaleH / 2, scaleW, scaleH, rad * pulse);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Organelle-specific color map (just colors, no coordinates)
      const ORGANELLE_COLORS = {
        nucleus:      "#58a6ff",
        mitochondria: "#f47067",
        golgi:        "#ff79c6",
        er_rough:     "#f8f8f2",
        er_smooth:    "#a78bfa",
        lysosome:     "#ff6b6b",
        vacuole:      "#00e5ff",
        chloroplast:  "#1abc9c",
        ribosome:     "#bd93f9",
        peroxisome:   "#fbbf24",
        cytoplasm:    "#6ee7f7",
        centriole:    "#fbbf24",
        microtubule:  "#d4b26f",
        nucleoid:     "#ffb86c",
        flagella:     "#50fa7b",
        plasmid:      "#50fa7b",
      };

      const targetColor = ORGANELLE_COLORS[selectedTarget.id] ?? "#39d353";
      // Professional slow breathing pulse
      const pulse = 1.0 + 0.015 * Math.sin(t * 2.5);
      const ringR = (selectedTarget.r + 8) * pulse;

      ctx.save();
      // 1. Subtle inner background highlight
      ctx.beginPath();
      ctx.arc(selectedTarget.x, selectedTarget.y, ringR, 0, TWO_PI);
      ctx.fillStyle = targetColor + "08";
      ctx.fill();

      // 2. Main target ring: solid, thin, sharp glow
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = targetColor;
      ctx.shadowBlur = 6;
      ctx.shadowColor = targetColor;
      ctx.beginPath();
      ctx.arc(selectedTarget.x, selectedTarget.y, ringR, 0, TWO_PI);
      ctx.stroke();
      
      // 3. Four clean sci-fi/microscope crosshair reticle ticks
      const tickLength = 4;
      const startR = ringR + 3;
      const endR = startR + tickLength;
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      
      // Remove shadow blur for crisp reticle ticks
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      angles.forEach(angle => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.moveTo(selectedTarget.x + cos * startR, selectedTarget.y + sin * startR);
        ctx.lineTo(selectedTarget.x + cos * endR, selectedTarget.y + sin * endR);
      });
      ctx.stroke();
      
      ctx.restore();
    }
  }
}

function drawAnimalCellFull(ctx, cx, cy, W, H, t) {
  // Positions spread out cleanly to match the reference diagram but with more spacing and smaller scale:
  // Nucleus: centered, slightly scaled down
  // Golgi: upper right
  // Smooth ER: right, below Golgi
  // Rough ER: bottom
  // Mitochondria: 3 instances (bottom-left, top-right, top-mid)
  // Lysosomes: 2 instances (left-mid, top-right-mid)
  // Peroxisomes: 1 instance (lower-left-mid)
  // Vacuole: 1 small instance (left-mid-lower)
  // Centriole & Microtubules: top-left centrosome region

  const rx = Math.min(W, H) * 0.36, ry = Math.min(W, H) * 0.30;
  const sc = rx / 160;

  // 1. Cytoplasm warm fill — drawn FIRST so it sits behind boundary
  drawCytoplasm(ctx, cx, cy, rx, ry);

  // 2. Cell boundary
  drawCellBoundary(ctx, cx, cy, rx, ry, CELL_TYPES.ANIMAL, "#39d353");

  // 3. Mitochondria — pill-shaped, scattered (spaced out)
  //    Bottom-left
  drawMitochondria(ctx, cx - rx * 0.5, cy + ry * 0.35, sc * 0.9, t, 0.3);
  //    Top-right (above Golgi)
  drawMitochondria(ctx, cx + rx * 0.55, cy - ry * 0.65, sc * 0.85, t + 0.8, 0.8);
  //    Top-mid
  drawMitochondria(ctx, cx - rx * 0.05, cy - ry * 0.7, sc * 0.85, t + 1.5, -0.2);

  // 4. Nucleus — centered, slightly scaled down for breathing room
  drawNucleus(ctx, cx - rx * 0.05, cy + ry * 0.05, sc * 1.1);

  // 5. Golgi Apparatus — upper right
  drawGolgi(ctx, cx + rx * 0.5, cy - ry * 0.35, sc * 0.8);

  // 6. Smooth ER — right side, below Golgi
  drawSmoothER(ctx, cx + rx * 0.55, cy + ry * 0.25, sc * 0.8);

  // 7. Rough ER — lower center/bottom, below nucleus
  drawRoughER(ctx, cx + rx * 0.1, cy + ry * 0.55, sc * 0.8);

  // 8. Lysosomes — small purple blobs (spaced out)
  drawLysosome(ctx, cx - rx * 0.55, cy - ry * 0.15, sc * 0.85);
  drawLysosome(ctx, cx + rx * 0.1, cy - ry * 0.55, sc * 0.85);

  // 9. Peroxisome — small amber-orange
  drawPeroxisome(ctx, cx - rx * 0.25, cy + ry * 0.4, sc * 0.85);

  // 10. Small vacuole
  drawVacuole(ctx, cx - rx * 0.6, cy + ry * 0.05, sc * 0.8, false);

  // 11. Ribosomes — scattered tiny gold dots throughout cytoplasm (reduced count for cleanliness)
  [
    [0.3, 0.65], [-0.15, 0.7], [0.7, 0.45], [-0.7, 0.2],
    [0.3, -0.7], [-0.4, -0.5], [0.55, -0.25], [-0.75, -0.3],
  ].forEach(([dx, dy]) => {
    drawRibosome(ctx, cx + dx * rx, cy + dy * ry, sc * 1.1);
  });

  // 12. Centriole & Microtubules (centrosome region) — top left (like reference)
  const centX = cx - rx * 0.45;
  const centY = cy - ry * 0.45;
  
  ctx.save();
  ctx.strokeStyle = "rgba(212,178,111,0.22)"; // light gold/yellow, very subtle
  ctx.lineWidth = 1 * sc;
  const mtAngles = [-0.2, 0.1, 0.4, 0.7, 1.0, 1.3, 1.6];
  mtAngles.forEach(angle => {
    ctx.beginPath();
    ctx.moveTo(centX, centY);
    ctx.lineTo(centX + Math.cos(angle) * 75 * sc, centY + Math.sin(angle) * 75 * sc);
    ctx.stroke();
    // Tiny tubulin subunits
    circle(ctx, centX + Math.cos(angle) * 35 * sc, centY + Math.sin(angle) * 35 * sc, 1.2 * sc, "rgba(212,178,111,0.45)", null);
    circle(ctx, centX + Math.cos(angle) * 60 * sc, centY + Math.sin(angle) * 60 * sc, 1.5 * sc, "rgba(212,178,111,0.5)", null);
  });
  ctx.restore();

  drawCentriole(ctx, centX, centY, sc * 0.85);
}

function drawPlantCellFull(ctx, cx, cy, W, H, t) {
  const rx = Math.min(W, H) * 0.32, ry = Math.min(W, H) * 0.3;
  drawCellBoundary(ctx, cx, cy, rx, ry, CELL_TYPES.PLANT, "#1abc9c");
  drawCellWall(ctx, cx, cy, rx, ry);

  const sc = rx / 160;
  // Large central vacuole
  drawVacuole(ctx, cx, cy + ry * 0.1, sc * 1.2, true);
  // Nucleus pushed to corner
  drawNucleus(ctx, cx - rx * 0.52, cy - ry * 0.45, sc * 0.95);
  // Chloroplasts scattered
  [[-0.3, 0.55], [0.4, -0.5], [0.6, 0.3], [-0.55, 0.2]].forEach(([dx, dy]) => {
    drawChloroplast(ctx, cx + dx * rx, cy + dy * ry, sc * 0.85, t);
  });
  drawMitochondria(ctx, cx + rx * 0.5, cy - ry * 0.1, sc * 0.85, t);
  drawGolgi(ctx, cx + rx * 0.3, cy - ry * 0.3, sc * 0.8);
  
  // Endoplasmic Reticulum (Rough ER) next to nucleus
  drawRoughER(ctx, cx - rx * 0.4, cy - ry * 0.15, sc * 0.75);
  
  // Scattered ribosomes in cytoplasm
  [[-0.25, -0.4], [0.1, -0.45], [0.5, -0.4], [-0.45, -0.1]].forEach(([dx, dy]) => {
    drawRibosome(ctx, cx + dx * rx, cy + dy * ry, sc * 0.85);
  });
}

function drawBacterialCellFull(ctx, cx, cy, W, H, t) {
  const rx = Math.min(W, H) * 0.28, ry = Math.min(W, H) * 0.18;
  drawCellBoundary(ctx, cx, cy, rx, ry, CELL_TYPES.BACTERIAL, "#ffb86c");

  const sc = rx / 130;
  // Nucleoid (no true nucleus)
  drawNucleoid(ctx, cx - rx * 0.05, cy, sc);
  // Ribosomes scattered
  [[-0.4, -0.3], [0.3, -0.4], [0.5, 0.3], [-0.3, 0.5], [0.0, 0.5]].forEach(([dx, dy]) => {
    drawRibosome(ctx, cx + dx * rx, cy + dy * ry, sc);
  });
  // Flagella on right side
  drawFlagella(ctx, cx + rx, cy, sc * 0.5, t);
  // Plasmid circles
  circle(ctx, cx + rx * 0.5, cy - ry * 0.5, 8 * sc, "rgba(80,250,123,0.2)", "#50fa7b", 1.5);
  text(ctx, "Plasmid", cx + rx * 0.5, cy - ry * 0.5 + 20 * sc, "#50fa7b", 9);
  // Labels
  text(ctx, "Prokaryote — No membrane-bound nucleus", cx, cy + ry + 28, "#8b949e", 10);
}

// ── Mitosis animation ─────────────────────────────────────────────────────────
export function drawMitosis(ctx, W, H, phase, progress, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.23; // Zoomed out from 0.3 for clean text spacing

  const phaseIdx = ["interphase", "prophase", "metaphase", "anaphase", "telophase", "cytokinesis"].indexOf(phase);

  if (phaseIdx === 0) _mitosisInterphase(ctx, cx, cy, R, H, t);
  else if (phaseIdx === 1) _mitosisPhase(ctx, cx, cy, R, "prophase", progress, H, t);
  else if (phaseIdx === 2) _mitosisPhase(ctx, cx, cy, R, "metaphase", progress, H, t);
  else if (phaseIdx === 3) _mitosisPhase(ctx, cx, cy, R, "anaphase", progress, H, t);
  else if (phaseIdx === 4) _mitosisPhase(ctx, cx, cy, R, "telophase", progress, H, t);
  else if (phaseIdx === 5) _mitosisCytokinesis(ctx, cx, cy, R, progress, W, H, t);
}

function _drawMitosisChromosome(ctx, x, y, color, isDouble, scale = 1, isTopPole = true) {
  const h = 18 * scale;
  const w = 5 * scale;
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = "round";

  if (isDouble) {
    // Replicated X shape chromosome
    ctx.beginPath();
    ctx.moveTo(-w, -h); ctx.lineTo(w, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, -h); ctx.lineTo(-w, h);
    ctx.stroke();
    // Centromere
    circle(ctx, 0, 0, 2.5 * scale, "#ffffff", color, 1);
  } else {
    // Single chromatid chromosome pulled in Anaphase (V-shape)
    if (isTopPole) {
      // Inverted V shape (pointing up '^')
      ctx.beginPath();
      ctx.moveTo(-w, h * 0.8);
      ctx.quadraticCurveTo(0, -h * 0.3, w, h * 0.8);
      ctx.stroke();
      circle(ctx, 0, -h * 0.2, 1.8 * scale, "#ffffff", color, 0.8);
    } else {
      // Regular V shape (pointing down 'v')
      ctx.beginPath();
      ctx.moveTo(-w, -h * 0.8);
      ctx.quadraticCurveTo(0, h * 0.3, w, -h * 0.8);
      ctx.stroke();
      circle(ctx, 0, h * 0.2, 1.8 * scale, "#ffffff", color, 0.8);
    }
  }

  ctx.restore();
}

function _drawMitosisSpindleFibers(ctx, cx, cy, R, chrPositions, progress, isAnaphase = false, sep = 0) {
  const topPoleY = cy - R * 0.88;
  const botPoleY = cy + R * 0.88;

  // Draw centrosome poles
  circle(ctx, cx, topPoleY, 6, "#f47067", "#ffffff", 1.5);
  circle(ctx, cx, botPoleY, 6, "#f47067", "#ffffff", 1.5);

  ctx.strokeStyle = "rgba(88, 166, 255, 0.22)";
  ctx.lineWidth = 1.2;

  chrPositions.forEach(xPos => {
    const absX = cx + xPos;
    if (!isAnaphase) {
      // fibers connect from poles directly to the equatorial line centromeres
      ctx.beginPath();
      ctx.moveTo(cx, topPoleY);
      ctx.lineTo(absX, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, botPoleY);
      ctx.lineTo(absX, cy);
      ctx.stroke();
    } else {
      // in Anaphase, separate fibers pull the separated chromatids to each pole
      ctx.beginPath();
      ctx.moveTo(cx, topPoleY);
      ctx.lineTo(absX, cy - sep);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, botPoleY);
      ctx.lineTo(absX, cy + sep);
      ctx.stroke();
    }
  });
}

function _mitosisInterphase(ctx, cx, cy, R, H, t) {
  // Single large cell
  circle(ctx, cx, cy, R, "rgba(57,211,83,0.06)", "#39d353", 2);

  // Complete Nuclear Envelope
  circle(ctx, cx, cy, R * 0.4, "rgba(88,166,255,0.08)", "#58a6ff", 2);

  // Uncondensed chromatin threads (wobbly wavy lines inside nucleus)
  ctx.strokeStyle = "rgba(88,166,255,0.45)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const startAngle = (i / 6) * TWO_PI;
    const rx = R * 0.28;
    ctx.moveTo(cx + Math.cos(startAngle) * rx * 0.3, cy + Math.sin(startAngle) * rx * 0.3);
    for (let j = 1; j <= 10; j++) {
      const stepAngle = startAngle + (j / 10) * Math.PI;
      const stepR = rx * (0.3 + 0.7 * Math.sin(j * 0.4));
      const wx = Math.sin(t * 2 + j + i) * 3;
      ctx.lineTo(cx + Math.cos(stepAngle) * stepR + wx, cy + Math.sin(stepAngle) * stepR);
    }
    ctx.stroke();
  }

  drawMitochondria(ctx, cx - R * 0.65, cy + R * 0.25, 0.95, t);
  drawMitochondria(ctx, cx + R * 0.58, cy - R * 0.3, 0.85, t + 1.5);
  
  text(ctx, "Interphase: DNA Replication", cx, H - 35, "#58a6ff", 12.5, "center", true);
  text(ctx, "DNA duplicates; chromatin is uncondensed", cx, H - 16, "#8b949e", 9.5);
}

function _mitosisPhase(ctx, cx, cy, R, phase, progress, H, t) {
  const colors = ["#58a6ff", "#f47067", "#39d353", "#e3b341"];
  const chrXOffsets = [-40, -12, 12, 40];

  if (phase === "prophase") {
    circle(ctx, cx, cy, R, "rgba(57,211,83,0.06)", "#39d353", 2);

    // Nuclear envelope fading out
    const envAlpha = Math.max(0, 1.0 - progress);
    if (envAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = envAlpha;
      circle(ctx, cx, cy, R * 0.45, null, "#58a6ff", 1.8);
      ctx.restore();
    }

    // Chromatin threads fading out
    const chromatinAlpha = Math.max(0, 1.0 - progress);
    if (chromatinAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = chromatinAlpha;
      ctx.strokeStyle = "rgba(88,166,255,0.45)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const startAngle = (i / 6) * TWO_PI;
        const rx = R * 0.32;
        ctx.moveTo(cx + Math.cos(startAngle) * rx * 0.3, cy + Math.sin(startAngle) * rx * 0.3);
        for (let j = 1; j <= 8; j++) {
          const stepAngle = startAngle + (j / 8) * Math.PI;
          const stepR = rx * (0.3 + 0.7 * Math.sin(j * 0.4));
          const wx = Math.sin(t * 2 + j + i) * 3;
          ctx.lineTo(cx + Math.cos(stepAngle) * stepR + wx, cy + Math.sin(stepAngle) * stepR);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Chromosomes condensing (fading in and scaling up)
    const chrAlpha = Math.max(0, Math.min(1.0, progress * 1.2));
    if (chrAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = chrAlpha;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TWO_PI + t * 0.05;
        const d = R * 0.22 * progress;
        const scaleVal = 0.5 + 0.5 * progress;
        _drawMitosisChromosome(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, colors[i], true, scaleVal);
      }
      ctx.restore();
    }

    // Spindle poles forming and migrating to poles
    const poleOffset = R * 0.88 * progress;
    const topPoleY = cy - poleOffset;
    const botPoleY = cy + poleOffset;
    circle(ctx, cx, topPoleY, 5, "#f47067", "#ffffff", 1);
    circle(ctx, cx, botPoleY, 5, "#f47067", "#ffffff", 1);

    // Faint spindle fibers starting to form (extending from poles)
    if (progress > 0.2) {
      const fiberLen = R * 0.4 * (progress - 0.2) / 0.8;
      ctx.strokeStyle = "rgba(88, 166, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let offset = -20; offset <= 20; offset += 10) {
        ctx.beginPath();
        ctx.moveTo(cx, topPoleY);
        ctx.lineTo(cx + offset, topPoleY + fiberLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, botPoleY);
        ctx.lineTo(cx + offset, botPoleY - fiberLen);
        ctx.stroke();
      }
    }

    text(ctx, "Prophase: DNA Condensation", cx, H - 35, "#bd93f9", 12.5, "center", true);
    text(ctx, "Chromatin condenses into chromosomes; nuclear membrane breaks down", cx, H - 16, "#8b949e", 9.5);

  } else if (phase === "metaphase") {
    circle(ctx, cx, cy, R, "rgba(57,211,83,0.06)", "#39d353", 2);

    const topPoleY = cy - R * 0.88;
    const botPoleY = cy + R * 0.88;
    
    // Draw spindle poles
    circle(ctx, cx, topPoleY, 6, "#f47067", "#ffffff", 1.5);
    circle(ctx, cx, botPoleY, 6, "#f47067", "#ffffff", 1.5);

    // Chromosomes starting from scattered prophase-like positions and aligning to equatorial plate
    const scatteredPts = [
      { x: cx - 45, y: cy - 25 },
      { x: cx - 15, y: cy + 30 },
      { x: cx + 18, y: cy - 20 },
      { x: cx + 45, y: cy + 25 }
    ];

    const alignmentT = Math.min(1.0, progress / 0.65); // align fully by progress = 0.65

    // Draw fibers and chromosomes at their interpolated positions
    for (let i = 0; i < 4; i++) {
      const targetX = cx + chrXOffsets[i];
      const targetY = cy;

      const curX = scatteredPts[i].x * (1 - alignmentT) + targetX * alignmentT;
      const curY = scatteredPts[i].y * (1 - alignmentT) + targetY * alignmentT;

      // Draw spindle fibers attaching to the centromere
      ctx.strokeStyle = "rgba(88, 166, 255, 0.25)";
      ctx.lineWidth = 1.25;
      
      // Top pole to chromosome centromere
      ctx.beginPath();
      ctx.moveTo(cx, topPoleY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Bottom pole to chromosome centromere
      ctx.beginPath();
      ctx.moveTo(cx, botPoleY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Draw chromosome
      _drawMitosisChromosome(ctx, curX, curY, colors[i], true, 1.05);
    }

    // Equatorial plate plate line
    if (alignmentT > 0.5) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = `rgba(227, 179, 65, ${0.45 * (alignmentT - 0.5) * 2})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R * 0.8, cy); ctx.lineTo(cx + R * 0.8, cy); ctx.stroke();
      ctx.setLineDash([]);
    }

    text(ctx, "Metaphase: Alignment", cx, H - 35, "#ff79c6", 12.5, "center", true);
    text(ctx, "Spindle fibers attach to centromeres & pull them to align along equator", cx, H - 16, "#8b949e", 9.5);

  } else if (phase === "anaphase") {
    // Cell elongates vertically (matching vertical division)
    const stretch = 1.0 + progress * 0.26;
    const compress = 1.0 - progress * 0.08;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * compress, R * stretch, 0, 0, TWO_PI);
    ctx.fillStyle = "rgba(57,211,83,0.06)";
    ctx.fill();
    ctx.strokeStyle = "#39d353";
    ctx.lineWidth = 2;
    ctx.stroke();

    const sep = R * 0.48 * progress;

    // Draw spindle poles and fibers pulling chromatids (poles are inside vertical envelope)
    _drawMitosisSpindleFibers(ctx, cx, cy, R * stretch, chrXOffsets, progress, true, sep);

    // Separated sister chromatids (V-shapes) moving to opposite poles
    for (let i = 0; i < 4; i++) {
      // Top chromatid (inverted V)
      _drawMitosisChromosome(ctx, cx + chrXOffsets[i], cy - sep, colors[i], false, 0.95, true);
      // Bottom chromatid (regular V)
      _drawMitosisChromosome(ctx, cx + chrXOffsets[i], cy + sep, colors[i], false, 0.95, false);
    }

    text(ctx, "Anaphase: Separation", cx, H - 35, "#f47067", 12.5, "center", true);
    text(ctx, "Sister chromatids pull apart and move toward opposite poles", cx, H - 16, "#8b949e", 9.5);

  } else if (phase === "telophase") {
    const stretch = 1.26;
    const compress = 0.92;
    const sep = R * 0.48;

    // Draw vertical pinched peanut shape (top and bottom lobes, pinched at left and right sides)
    const rx = R * compress; // horizontal width (pinched)
    const ry = R * 0.76; // vertical lobe height
    const pinchDepth = progress * 24; // pinch depth from sides

    ctx.beginPath();
    // Top lobe curve
    ctx.arc(cx, cy - R * 0.4, rx, Math.PI * 0.95, Math.PI * 0.05, false);
    // Right side cleavage furrow pinch
    ctx.lineTo(cx + rx - pinchDepth, cy);
    // Bottom lobe curve
    ctx.arc(cx, cy + R * 0.4, rx, -Math.PI * 0.05, -Math.PI * 0.95, false);
    // Left side cleavage furrow pinch
    ctx.lineTo(cx - rx + pinchDepth, cy);
    ctx.closePath();
    ctx.fillStyle = "rgba(57,211,83,0.05)";
    ctx.fill();
    ctx.strokeStyle = "#39d353";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Two reforming nuclear membranes (starting dashed and faint, becoming solid)
    const envAlpha = progress;
    ctx.save();
    ctx.globalAlpha = envAlpha;
    ctx.setLineDash([3, 3]);
    circle(ctx, cx, cy - sep, R * 0.3, "rgba(88,166,255,0.08)", "#58a6ff", 1.8);
    circle(ctx, cx, cy + sep, R * 0.3, "rgba(88,166,255,0.08)", "#58a6ff", 1.8);
    ctx.restore();

    // Chromosomes uncoiling and loosening back into resting chromatin state
    const chrAlpha = Math.max(0, 1.0 - progress);
    const chromatinAlpha = progress;

    // 1. Draw V-shaped chromatids fading out
    if (chrAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = chrAlpha;
      for (let i = 0; i < 4; i++) {
        _drawMitosisChromosome(ctx, cx + chrXOffsets[i] * 0.5, cy - sep, colors[i], false, 0.78, true);
        _drawMitosisChromosome(ctx, cx + chrXOffsets[i] * 0.5, cy + sep, colors[i], false, 0.78, false);
      }
      ctx.restore();
    }

    // 2. Draw uncondensed chromatin threads fading in inside each new membrane
    if (chromatinAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = chromatinAlpha;
      ctx.lineWidth = 1.2;
      
      // Top nucleus
      ctx.strokeStyle = "rgba(88, 166, 255, 0.42)";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const startAngle = (i / 4) * TWO_PI;
        const rx_c = R * 0.2;
        ctx.moveTo(cx + Math.cos(startAngle) * rx_c * 0.3, cy - sep + Math.sin(startAngle) * rx_c * 0.3);
        for (let j = 1; j <= 6; j++) {
          const stepAngle = startAngle + (j / 6) * Math.PI;
          const stepR = rx_c * (0.3 + 0.7 * Math.sin(j * 0.4));
          const wx = Math.sin(t * 2 + j + i) * 2;
          ctx.lineTo(cx + Math.cos(stepAngle) * stepR + wx, cy - sep + Math.sin(stepAngle) * stepR);
        }
        ctx.stroke();
      }

      // Bottom nucleus
      ctx.strokeStyle = "rgba(88, 166, 255, 0.42)";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const startAngle = (i / 4) * TWO_PI;
        const rx_c = R * 0.2;
        ctx.moveTo(cx + Math.cos(startAngle) * rx_c * 0.3, cy + sep + Math.sin(startAngle) * rx_c * 0.3);
        for (let j = 1; j <= 6; j++) {
          const stepAngle = startAngle + (j / 6) * Math.PI;
          const stepR = rx_c * (0.3 + 0.7 * Math.sin(j * 0.4));
          const wx = Math.sin(t * 2 + j + i) * 2;
          ctx.lineTo(cx + Math.cos(stepAngle) * stepR + wx, cy + sep + Math.sin(stepAngle) * stepR);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    text(ctx, "Telophase: Reconstruction", cx, H - 35, "#e3b341", 12.5, "center", true);
    text(ctx, "Nuclear membranes reform; chromosomes uncoil back into chromatin", cx, H - 16, "#8b949e", 9.5);
  }
}

function _mitosisCytokinesis(ctx, cx, cy, R, progress, W, H, t) {
  const cellSep = R * 0.25 + R * 0.72 * progress;
  const childR = R * 0.88;
  const colors = ["#58a6ff", "#f47067", "#39d353", "#e3b341"];
  const chrXOffsets = [-22, -7, 7, 22];

  // Two identical daughter cells moving apart
  [-1, 1].forEach(dir => {
    const ny = cy + dir * cellSep;
    
    // Cell outline
    circle(ctx, cx, ny, childR, "rgba(57,211,83,0.06)", "#39d353", 2);
    
    // Complete nucleus
    circle(ctx, cx, ny, childR * 0.38, "rgba(88,166,255,0.12)", "#58a6ff", 1.8);

    // Uncondensed chromatin inside each nucleus (fully uncoiled)
    ctx.strokeStyle = "rgba(88, 166, 255, 0.42)";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const startAngle = (i / 4) * TWO_PI;
      const rx = childR * 0.26;
      ctx.moveTo(cx + Math.cos(startAngle) * rx * 0.3, ny + Math.sin(startAngle) * rx * 0.3);
      for (let j = 1; j <= 6; j++) {
        const stepAngle = startAngle + (j / 6) * Math.PI;
        const stepR = rx * (0.3 + 0.7 * Math.sin(j * 0.4));
        const wx = Math.sin(t * 2 + j + i) * 2;
        ctx.lineTo(cx + Math.cos(stepAngle) * stepR + wx, ny + Math.sin(stepAngle) * stepR);
      }
      ctx.stroke();
    }

    drawMitochondria(ctx, cx - childR * 0.5, ny + childR * 0.1, 0.72, t);
    drawMitochondria(ctx, cx + childR * 0.5, ny - childR * 0.1, 0.72, t + 2);
  });

  text(ctx, "Cytokinesis: Cell Division Complete", cx, H - 35, "#39d353", 12.5, "center", true);
  text(ctx, "2 genetically identical diploid daughter cells formed", cx, H - 16, "#8b949e", 9.5);
}



// ── Meiosis animation ─────────────────────────────────────────────────────────
function drawMeiosisChromosome(ctx, x, y, baseColor, tipColor, isDouble, scale, angle = 0) {
  const h = 18 * scale;
  const w = 5 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = "round";

  // Draw a chromatid leg: (x1, y1) to (x2, y2)
  function drawLeg(x1, y1, x2, y2) {
    if (!tipColor) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = baseColor;
      ctx.stroke();
    } else {
      // Draw 70% base
      const midX = x1 + (x2 - x1) * 0.65;
      const midY = y1 + (y2 - y1) * 0.65;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(midX, midY);
      ctx.strokeStyle = baseColor;
      ctx.stroke();

      // Draw 30% recombinant tip
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = tipColor;
      ctx.stroke();
    }
  }

  if (isDouble) {
    // Chromatid 1 (diagonal top-left to bottom-right)
    drawLeg(-w, -h, w, h);
    // Chromatid 2 (diagonal top-right to bottom-left)
    drawLeg(w, -h, -w, h);
    // Centromere dot in center
    circle(ctx, 0, 0, 3 * scale, "#ffffff", baseColor, 1);
  } else {
    // Single chromatid (slightly tilted vertical line)
    drawLeg(0, -h, 0, h);
    // Centromere dot
    circle(ctx, 0, 0, 2 * scale, "#ffffff", baseColor, 1);
  }

  ctx.restore();
}

// ── Meiosis animation ─────────────────────────────────────────────────────────
export function drawMeiosis(ctx, W, H, phase, progress, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.26;

  const phaseIdx = ["prophase1","metaphase1","anaphase1","telophase1","meiosis2","gametes"].indexOf(phase);

  if (phaseIdx <= 3) {
    // Meiosis I — single cell dividing
    _meiosisI(ctx, cx, cy, R, phase, progress, t, phaseIdx);
  } else if (phase === "meiosis2") {
    // Meiosis II — two cells each dividing
    _meiosisII(ctx, W, H, R, progress, t);
  } else {
    // 4 gametes
    _meiosisGametes(ctx, W, H, R, t);
  }
}

function _meiosisI(ctx, cx, cy, R, phase, progress, t, idx) {
  circle(ctx, cx, cy, R, "rgba(189,147,249,0.07)", "#bd93f9", 2);
  const blue = "#58a6ff";
  const red = "#f47067";

  if (idx === 0) {
    // Prophase I — homologous chromosome pairing (synapsis)
    const separation = Math.max(0, 1 - progress * 2) * 15; // move together as synapsis occurs
    
    // Draw spindle poles starting to form
    circle(ctx, cx - R * 0.9, cy, 5, "#58a6ff", null);
    circle(ctx, cx + R * 0.9, cy, 5, "#58a6ff", null);

    if (progress <= 0.5) {
      // Recombination hasn't occurred yet (solid color chromosomes)
      drawMeiosisChromosome(ctx, cx - 12 - separation, cy, blue, null, true, 1.1, 0.1);
      drawMeiosisChromosome(ctx, cx + 12 + separation, cy, red, null, true, 1.1, -0.1);
      text(ctx, "Homologs pair up (Synapsis)", cx, cy + R + 22, "#bd93f9", 10.5);
    } else {
      // Crossing over occurs: draw chiasma contact point and recombinant chromosome tips
      const crossProgress = (progress - 0.5) / 0.5;
      
      // Draw blue chromosome with red tips, and red chromosome with blue tips
      drawMeiosisChromosome(ctx, cx - 12, cy, blue, red, true, 1.1, 0.1);
      drawMeiosisChromosome(ctx, cx + 12, cy, red, blue, true, 1.1, -0.1);

      // Chiasma connection lines
      ctx.strokeStyle = "#e3b341";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 12);
      ctx.lineTo(cx + 6, cy + 12);
      ctx.stroke();

      // Crossing over flash/sparkle
      const pulse = 0.5 + 0.5 * Math.sin(t * 12);
      ctx.fillStyle = `rgba(227, 179, 65, ${0.4 * pulse})`;
      circle(ctx, cx, cy + 12, 10 * pulse, null, null);

      text(ctx, "Crossing Over: Chromatids exchange segments", cx, cy + R + 22, "#e3b341", 10.5, "center", true);
    }
  } else if (idx === 1) {
    // Metaphase I — homologous pairs align at the equator
    // Left homolog (Blue with red tips), Right homolog (Red with blue tips)
    drawMeiosisChromosome(ctx, cx - 18, cy, blue, red, true, 1.1, 0.0);
    drawMeiosisChromosome(ctx, cx + 18, cy, red, blue, true, 1.1, 0.0);

    // Spindle poles and fibers
    _drawMeiosisSpindle(ctx, cx, cy, R, 1.0);
    
    text(ctx, "Homologous pairs align at equator", cx, cy + R + 22, "#bd93f9", 10.5);
  } else if (idx === 2) {
    // Anaphase I — homologous chromosomes separate (whole chromosomes move to poles)
    const sep = R * 0.45 * progress;
    
    // Top homolog moving up (Blue with red tips)
    drawMeiosisChromosome(ctx, cx, cy - sep, blue, red, true, 1.0, 0.1);
    // Bottom homolog moving down (Red with blue tips)
    drawMeiosisChromosome(ctx, cx, cy + sep, red, blue, true, 1.0, -0.1);

    // Spindle fibers pulling them
    _drawMeiosisSpindle(ctx, cx, cy, R, 1.0);
    
    text(ctx, "Homologs separate (chromosome number halved)", cx, cy + R + 22, "#bd93f9", 10.5, "center", true);
  } else {
    // Telophase I — 2 haploid cells constricting
    const sep = R * 0.55;
    
    // Draw two cell bodies
    [-1, 1].forEach(dir => {
      circle(ctx, cx, cy + dir * sep, R * 0.72, "rgba(189,147,249,0.05)", "#bd93f9", 1.5);
    });

    // Top nucleus contains: Blue chromosome with red tips
    drawMeiosisChromosome(ctx, cx, cy - sep, blue, red, true, 0.9, 0.05);
    // Bottom nucleus contains: Red chromosome with blue tips
    drawMeiosisChromosome(ctx, cx, cy + sep, red, blue, true, 0.9, -0.05);
    
    text(ctx, "2 Haploid cells (each contains 1 duplicated chromosome)", cx, cy + R * 1.5 + 14, "#bd93f9", 11);
  }
}

function _meiosisII(ctx, W, H, R, progress, t) {
  const blue = "#58a6ff";
  const red = "#f47067";
  const positions = [W * 0.28, W * 0.72];
  const cy = H / 2;

  // Meiosis II: Sister chromatids separate
  // progress goes from 0 -> 1: Metaphase II -> Anaphase II -> Telophase II
  positions.forEach((px, pi) => {
    // Draw spindle fibers for each cell
    circle(ctx, px, cy - R * 0.6, 3, "#bd93f9", null);
    circle(ctx, px, cy + R * 0.6, 3, "#bd93f9", null);

    // Spindle lines
    ctx.strokeStyle = "rgba(189, 147, 249, 0.15)";
    ctx.lineWidth = 1;
    for (let offset = -12; offset <= 12; offset += 12) {
      ctx.beginPath();
      ctx.moveTo(px + offset, cy - R * 0.6);
      ctx.lineTo(px + offset * 0.3, cy);
      ctx.lineTo(px + offset, cy + R * 0.6);
      ctx.stroke();
    }

    if (progress < 0.3) {
      // Metaphase II: chromosomes aligned at the plate
      circle(ctx, px, cy, R * 0.58, "rgba(189,147,249,0.04)", "#bd93f9", 1.5);
      
      if (pi === 0) {
        // Left cell: Blue chromosome with red tips aligned vertically
        drawMeiosisChromosome(ctx, px, cy, blue, red, true, 0.9, Math.PI/2);
      } else {
        // Right cell: Red chromosome with blue tips aligned vertically
        drawMeiosisChromosome(ctx, px, cy, red, blue, true, 0.9, Math.PI/2);
      }
    } else {
      // Anaphase II: sister chromatids separate! (draw single chromatids '|')
      const sep = R * 0.38 * (progress - 0.3) / 0.7;
      
      // Draw constricted cell body outline
      ctx.beginPath();
      ctx.ellipse(px, cy - sep * 0.1, R * 0.52, R * 0.6 + sep * 0.15, 0, 0, TWO_PI);
      ctx.fillStyle = "rgba(189,147,249,0.03)";
      ctx.fill();
      ctx.strokeStyle = "#bd93f988";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (pi === 0) {
        // Left cell: splits blue chromosome
        // Top pole: solid blue single chromatid
        drawMeiosisChromosome(ctx, px, cy - sep, blue, null, false, 0.85, 0.15);
        // Bottom pole: blue recombinant chromatid with red tip
        drawMeiosisChromosome(ctx, px, cy + sep, blue, red, false, 0.85, -0.15);
      } else {
        // Right cell: splits red chromosome
        // Top pole: red recombinant chromatid with blue tip
        drawMeiosisChromosome(ctx, px, cy - sep, red, blue, false, 0.85, 0.15);
        // Bottom pole: solid red single chromatid
        drawMeiosisChromosome(ctx, px, cy + sep, red, null, false, 0.85, -0.15);
      }
    }
  });

  text(ctx, "Meiosis II: Sister chromatids separate", W / 2, H * 0.12, "#bd93f9", 12.5, "center", true);
  text(ctx, "Produces single-stranded chromosomes in haploid cells", W / 2, H * 0.12 + 20, "#8b949e", 10.5);
}

function _meiosisGametes(ctx, W, H, R, t) {
  const blue = "#58a6ff";
  const red = "#f47067";
  const colors = ["#58a6ff", "#50fa7b", "#ffb86c", "#f47067"];
  const positions = [
    [W * 0.22, H * 0.32], [W * 0.22, H * 0.68],
    [W * 0.78, H * 0.32], [W * 0.78, H * 0.68],
  ];

  positions.forEach(([px, py], i) => {
    // Glow
    const g = ctx.createRadialGradient(px, py, R * 0.1, px, py, R * 0.65);
    g.addColorStop(0, colors[i] + "18");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g; 
    ctx.fillRect(px - R, py - R, R * 2, R * 2);

    circle(ctx, px, py, R * 0.48, colors[i] + "0d", colors[i], 1.8);
    // Haploid nucleus
    circle(ctx, px, py, R * 0.2, "rgba(88,166,255,0.08)", colors[i] + "88", 1.2);

    // Draw the unique chromosome chromatid in each gamete (recombination pattern)
    if (i === 0) {
      // Gamete 1: Non-recombinant paternal blue chromatid
      drawMeiosisChromosome(ctx, px, py, blue, null, false, 0.85, 0.1);
      text(ctx, "Gamete 1: Paternal Blue", px, py + R * 0.62, blue, 9.5, "center", true);
    } else if (i === 1) {
      // Gamete 2: Recombinant blue chromatid with red tip
      drawMeiosisChromosome(ctx, px, py, blue, red, false, 0.85, -0.15);
      text(ctx, "Gamete 2: Recombinant", px, py + R * 0.62, "#50fa7b", 9.5, "center", true);
    } else if (i === 2) {
      // Gamete 3: Recombinant red chromatid with blue tip
      drawMeiosisChromosome(ctx, px, py, red, blue, false, 0.85, 0.15);
      text(ctx, "Gamete 3: Recombinant", px, py + R * 0.62, "#ffb86c", 9.5, "center", true);
    } else {
      // Gamete 4: Non-recombinant maternal red chromatid
      drawMeiosisChromosome(ctx, px, py, red, null, false, 0.85, -0.1);
      text(ctx, "Gamete 4: Maternal Red", px, py + R * 0.62, red, 9.5, "center", true);
    }
  });

  text(ctx, "4 Unique Haploid Gametes (n=1)", W / 2, H * 0.1, "#39d353", 14, "center", true);
  text(ctx, "Recombination & independent assortment ensure genetic variation", W / 2, H * 0.1 + 20, "#8b949e", 10.5);
}

function _drawMeiosisSpindle(ctx, cx, cy, R, alpha) {
  // Spindle poles
  const polesY = [cy - R * 0.85, cy + R * 0.85];
  circle(ctx, cx, polesY[0], 5, "rgba(88,166,255,0.8)", null);
  circle(ctx, cx, polesY[1], 5, "rgba(88,166,255,0.8)", null);

  // Spindle fiber lines
  ctx.strokeStyle = `rgba(189, 147, 249, ${0.12 * alpha})`;
  ctx.lineWidth = 1.0;
  for (let offset = -20; offset <= 20; offset += 10) {
    ctx.beginPath();
    ctx.moveTo(cx, polesY[0]);
    ctx.lineTo(cx + offset, cy);
    ctx.lineTo(cx, polesY[1]);
    ctx.stroke();
  }
}


// ── Asexual reproduction animations ──────────────────────────────────────────
export function drawAsexual(ctx, W, H, type, progress, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;

  if (type === "fission") _drawFission(ctx, cx, cy, W, H, progress, t);
  else if (type === "budding") _drawBudding(ctx, cx, cy, W, H, progress, t);
  else _drawRegeneration(ctx, cx, cy, W, H, progress, t);
}

function _drawFission(ctx, cx, cy, W, H, progress, t) {
  const R = Math.min(W, H) * 0.16;
  const TWO_PI = Math.PI * 2;

  // Colors
  const amoebaFill   = "rgba(255, 184, 108, 0.16)";
  const amoebaStroke = "#ffb86c";
  const nucleusFill  = "rgba(189, 147, 249, 0.4)";
  const nucleusStroke = "#bd93f9";

  // Progress phases
  // t_intact = 0.0 -> 0.20: stable parent cell
  // t_karyo = 0.20 -> 0.50: nucleus divides (karyokinesis) + body stretches
  // t_cyto = 0.50 -> 0.80: body pinches (cytokinesis)
  // t_split = 0.80 -> 1.0: two separate cells drift apart

  const p_karyo = Math.max(0, Math.min(1, (progress - 0.20) / 0.30));
  const p_cyto = Math.max(0, Math.min(1, (progress - 0.50) / 0.30));
  const p_split = Math.max(0, Math.min(1, (progress - 0.80) / 0.20));

  // Helper to draw a wobbly Amoeba outline
  function drawAmoebaOutline(acx, acy, Lx, Ly, pinch, t_val) {
    const pts = [];
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * TWO_PI;
      const x_cos = Math.cos(angle);
      const y_sin = Math.sin(angle);
      
      // Dumbbell formula: y height tapers at x = 0 based on pinch
      const x_val = Lx * x_cos;
      const x_ratio = x_val / Lx;
      // height at this x
      const h_val = Ly * Math.sqrt(Math.max(0, 1 - x_ratio * x_ratio)) * (1.0 - pinch * (1.0 - x_ratio * x_ratio));
      
      // Organic pseudopodial wobble
      const wobble = Math.sin(angle * 7 + t_val * 3) * 4.5 * (1.0 - pinch * 0.7);
      
      pts.push({
        x: acx + x_val + x_cos * wobble,
        y: acy + (y_sin >= 0 ? h_val : -h_val) + y_sin * wobble
      });
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = amoebaFill;
    ctx.fill();
    ctx.strokeStyle = amoebaStroke;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  // ── PHASE 1 & 2 & 3: SINGLE CELL DIVIDING ────────────────────────────────
  if (progress < 0.80) {
    // Body stretch dimensions
    const stretch = 1.0 + p_karyo * 0.25 + p_cyto * 0.15; // grows from 1.0 -> 1.4
    const Lx = R * stretch;
    const Ly = R * (1.0 - p_karyo * 0.1 - p_cyto * 0.05); // slightly compresses vertically
    const currentPinch = p_karyo * 0.25 + p_cyto * 0.70; // pinch goes up to 0.95

    // Draw the dividing cell body
    drawAmoebaOutline(cx, cy, Lx, Ly, currentPinch, t);

    // Draw nucleus/nuclei
    const n_dist = Lx * 0.38 * (p_karyo * 0.7 + p_cyto * 0.3); // distance of nuclei from center
    const nl_x = cx - n_dist;
    const nr_x = cx + n_dist;
    const n_rad = 12 * (1.0 - p_karyo * 0.1);

    if (progress < 0.45) {
      // Nucleus is elongating into a dumbbell
      const n_pinch = p_karyo * 0.8;
      
      // Connect bridge
      ctx.strokeStyle = nucleusStroke;
      ctx.lineWidth = Math.max(2, 10 * (1.0 - n_pinch));
      ctx.beginPath();
      ctx.moveTo(nl_x, cy);
      ctx.lineTo(nr_x, cy);
      ctx.stroke();

      // Left & right nuclear bulbs
      circle(ctx, nl_x, cy, n_rad, nucleusFill, nucleusStroke, 1.5);
      circle(ctx, nr_x, cy, n_rad, nucleusFill, nucleusStroke, 1.5);
      
      text(ctx, "Nucleus dividing", cx, cy - n_rad - 10, "#bd93f9", 9.5);
    } else {
      // Nucleus is fully split, two separate nuclei moving apart
      circle(ctx, nl_x, cy, n_rad, nucleusFill, nucleusStroke, 1.5);
      circle(ctx, nr_x, cy, n_rad, nucleusFill, nucleusStroke, 1.5);
    }

    // Annotations
    if (progress < 0.20) {
      text(ctx, "Parent Amoeba (Interphase)", cx, cy - Ly - 15, "#8b949e", 10.5, "center", true);
    } else if (progress < 0.50) {
      text(ctx, "Karyokinesis: Nucleus elongating", cx, cy - Ly - 15, "#bd93f9", 10.5, "center", true);
    } else {
      text(ctx, "Cytokinesis: Cleavage furrow pinching", cx, cy - Ly - 15, "#ff79c6", 10.5, "center", true);
      
      // Draw pinch arrow indicators
      const arrowDist = Ly * (1.0 - currentPinch) + 12;
      ctx.strokeStyle = "#ff79c6";
      ctx.lineWidth = 1.5;
      
      // Top arrow pointing down
      ctx.beginPath(); ctx.moveTo(cx, cy - arrowDist - 12); ctx.lineTo(cx, cy - arrowDist); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - arrowDist - 4); ctx.lineTo(cx, cy - arrowDist); ctx.lineTo(cx + 4, cy - arrowDist - 4); ctx.stroke();
      
      // Bottom arrow pointing up
      ctx.beginPath(); ctx.moveTo(cx, cy + arrowDist + 12); ctx.lineTo(cx, cy + arrowDist); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 4, cy + arrowDist + 4); ctx.lineTo(cx, cy + arrowDist); ctx.lineTo(cx + 4, cy + arrowDist + 4); ctx.stroke();
    }

  } else {
    // ── PHASE 4: TWO DAUGHTER CELLS DRIFTING APART (0.80 to 1.0) ─────────────
    const sepDistance = R * 0.75 + p_split * R * 0.6; // distance apart
    const cellL = R * 0.85; // slightly smaller daughter cell size
    const cellW = R * 0.85;
    
    const cl_x = cx - sepDistance;
    const cr_x = cx + sepDistance;

    // Draw left and right daughter cells (each wobbly)
    drawAmoebaOutline(cl_x, cy, cellL, cellW, 0.0, t);
    drawAmoebaOutline(cr_x, cy, cellL, cellW, 0.0, t + 2.0); // slightly out of phase wiggle

    // Draw a nucleus in each
    circle(ctx, cl_x, cy, 9, nucleusFill, nucleusStroke, 1.5);
    circle(ctx, cr_x, cy, 9, nucleusFill, nucleusStroke, 1.5);

    text(ctx, "Daughter Amoeba 1", cl_x, cy - cellW - 12, "#ffb86c", 9.5, "center", true);
    text(ctx, "Daughter Amoeba 2", cr_x, cy - cellW - 12, "#ffb86c", 9.5, "center", true);

    text(ctx, "Binary Fission complete! 2 identical clones formed. ✓", cx, H - 35, "#39d353", 11, "center", true);
  }

  // Title
  text(ctx, "Amoeba Binary Fission (Asexual)", cx, 20, "#8b949e", 11.5, "center", true);
}

function _drawBudding(ctx, cx, cy, W, H, progress, t) {
  const scale = Math.min(W, H) * 0.0028;
  const parentX = cx - 70 * scale;
  const parentY = cy + 80 * scale;
  const parentH = 100 * scale;
  const parentW = 18 * scale;
  const TWO_PI = Math.PI * 2;

  // ── Draw background aquatic bubbles ───────────────────────────────────────
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);
  
  // Floating water bubbles
  for (let i = 0; i < 8; i++) {
    const bt = (t * 0.4 + i * 0.3) % 1.0;
    const bx = cx - 180 + (i * 50) + Math.sin(t + i) * 10;
    const by = H + 20 - bt * (H + 40);
    const br = 2 + (i % 3) * 1.5;
    ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TWO_PI);
    ctx.stroke();
    // highlight dot
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.2, 0, TWO_PI);
    ctx.fill();
  }

  // Budding progress sub-phases
  // t_bump = 0.0 -> 0.20: bump starts forming
  // t_grow = 0.20 -> 0.60: bud grows and develops tentacles
  // t_const = 0.60 -> 0.75: base constricts
  // t_detach = 0.75 -> 0.90: bud detaches and settles down
  
  const p_bump = Math.max(0, Math.min(1, progress / 0.20));
  const p_grow = Math.max(0, Math.min(1, (progress - 0.20) / 0.40));
  const p_const = Math.max(0, Math.min(1, (progress - 0.60) / 0.15));
  const p_detach = Math.max(0, Math.min(1, (progress - 0.75) / 0.15));

  // ── Helper: draw a Hydra ──────────────────────────────────────────────────
  function drawHydraBody(hx, hy, length, width, parentWiggle, tentaclesLenRatio, t_val, isDetachedChild = false) {
    const neckY = hy - length;
    const wx = Math.sin(t_val * 3) * 6 * parentWiggle;

    // Body path
    ctx.beginPath();
    ctx.moveTo(hx - width, hy); // base left
    ctx.bezierCurveTo(
      hx - width * 1.2 + wx * 0.2, hy - length * 0.4,
      hx - width * 0.8 + wx * 0.8, hy - length * 0.7,
      hx - width * 0.7 + wx, neckY
    );
    ctx.lineTo(hx + width * 0.7 + wx, neckY); // mouth opening
    ctx.bezierCurveTo(
      hx + width * 0.8 + wx * 0.8, hy - length * 0.7,
      hx + width * 1.2 + wx * 0.2, hy - length * 0.4,
      hx + width, hy // base right
    );
    ctx.closePath();

    ctx.fillStyle = isDetachedChild ? "rgba(100, 250, 150, 0.15)" : "rgba(80, 250, 123, 0.18)";
    ctx.fill();
    ctx.strokeStyle = isDetachedChild ? "#50fa7b" : "#39d353";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central Cavity (Gastrovascular Cavity) dashed line
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = isDetachedChild ? "rgba(80, 250, 123, 0.45)" : "rgba(57, 211, 83, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 4);
    ctx.quadraticCurveTo(hx + wx * 0.5, hy - length * 0.5, hx + wx, neckY + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw tentacles (6 wavy tentacles radiating upwards)
    const numTentacles = 6;
    const tl = length * 0.75 * tentaclesLenRatio;
    for (let i = 0; i < numTentacles; i++) {
      const angle = -Math.PI/6 - (i / (numTentacles - 1)) * (Math.PI * 2/3);
      // Wave with sine
      const wave = Math.sin(t_val * 4.5 + i * 1.2) * 0.15;
      const tx = hx + wx + Math.cos(angle + wave) * tl;
      const ty = neckY + Math.sin(angle + wave) * tl;

      // Control points for wavy curve
      const cpX = hx + wx + Math.cos(angle) * tl * 0.5 + Math.cos(t_val * 6 + i) * 6 * scale;
      const cpY = neckY + Math.sin(angle) * tl * 0.5 - 5 * scale;

      ctx.beginPath();
      ctx.moveTo(hx + wx, neckY);
      ctx.quadraticCurveTo(cpX, cpY, tx, ty);
      ctx.strokeStyle = isDetachedChild ? "#50fa7b" : "#39d353";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  // ── 1. Draw Parent Hydra ──────────────────────────────────────────────────
  drawHydraBody(parentX, parentY, parentH, parentW, 1.0, 1.0, t, false);

  // ── 2. Budding calculations ───────────────────────────────────────────────
  const budAttachY = parentY - parentH * 0.38; // Bud emerges from side of parent
  const budAttachX = parentX + parentW * 0.9 + Math.sin(t * 3) * 6 * 0.62; // moves with parent wiggle

  if (progress < 0.75) {
    // Bud is still attached to the parent
    // Draw the growing bud
    const budMaxL = parentH * 0.55;
    const budL = budMaxL * (0.2 + 0.8 * p_grow);
    const budW = parentW * (0.35 + 0.45 * p_grow);
    const angle = -Math.PI / 7; // points up and to the right (about -25 degrees)

    // Base connection width narrows during constriction phase
    const constrictWidthFactor = 1.0 - p_const * 0.75;
    const finalBudAttachX = budAttachX - (p_const * 3 * scale); // slightly pulls out

    // The mouth/tip of the bud
    const budMouthX = finalBudAttachX + Math.cos(angle) * budL;
    const budMouthY = budAttachY + Math.sin(angle) * budL;

    // Draw connecting bud body
    ctx.beginPath();
    ctx.moveTo(finalBudAttachX, budAttachY - budW * constrictWidthFactor); // top connection
    ctx.quadraticCurveTo(
      finalBudAttachX + Math.cos(angle) * budL * 0.5,
      budAttachY + Math.sin(angle) * budL * 0.5 - budW,
      budMouthX - Math.sin(angle) * budW * 0.7,
      budMouthY + Math.cos(angle) * budW * 0.7
    );
    ctx.lineTo(budMouthX + Math.sin(angle) * budW * 0.7, budMouthY - Math.cos(angle) * budW * 0.7);
    ctx.quadraticCurveTo(
      finalBudAttachX + Math.cos(angle) * budL * 0.5,
      budAttachY + Math.sin(angle) * budL * 0.5 + budW,
      finalBudAttachX, budAttachY + budW * constrictWidthFactor // bottom connection
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(100, 250, 150, 0.16)";
    ctx.fill();
    ctx.strokeStyle = "#50fa7b";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Internal cavity connection (connected to parent's cavity)
    if (p_const < 0.85) {
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = "rgba(80, 250, 123, 0.4)";
      ctx.beginPath();
      ctx.moveTo(parentX, budAttachY);
      ctx.quadraticCurveTo(finalBudAttachX + Math.cos(angle) * budL * 0.5, budAttachY + Math.sin(angle) * budL * 0.5, budMouthX, budMouthY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Bud Tentacles (only develop during grow phase)
    if (progress > 0.22) {
      const budTentRatio = Math.max(0, Math.min(1, (progress - 0.22) / 0.35));
      const b_tl = budL * 0.65 * budTentRatio;
      const numBudTent = 5;
      
      for (let i = 0; i < numBudTent; i++) {
        // Tentacle angle relative to bud angle
        const t_ang = angle - Math.PI/4 - (i / (numBudTent - 1)) * (Math.PI / 2);
        const wave = Math.sin(t * 5.5 + i * 1.5) * 0.18;
        const tx = budMouthX + Math.cos(t_ang + wave) * b_tl;
        const ty = budMouthY + Math.sin(t_ang + wave) * b_tl;

        ctx.beginPath();
        ctx.moveTo(budMouthX, budMouthY);
        ctx.quadraticCurveTo(
          budMouthX + Math.cos(t_ang) * b_tl * 0.5,
          budMouthY + Math.sin(t_ang) * b_tl * 0.5 - 2,
          tx, ty
        );
        ctx.strokeStyle = "#50fa7b";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Annotation
    if (progress < 0.20) {
      text(ctx, "Cellular bump initiates...", budAttachX + 50 * scale, budAttachY - 10, "#e3b341", 9, "left");
      circle(ctx, budAttachX, budAttachY, 12 * scale, null, "#e3b341", 1);
    } else if (progress < 0.60) {
      text(ctx, "Bud develops body cavity & tentacles", budMouthX + 15 * scale, budMouthY - 15 * scale, "#39d353", 9, "left");
    } else {
      text(ctx, "Base constricts for separation", finalBudAttachX + 10 * scale, budAttachY - 30 * scale, "#f47067", 9, "left");
      circle(ctx, finalBudAttachX, budAttachY, 6 * scale, null, "#f47067", 1);
    }

  } else {
    // ── 3. Bud Detached & Settling Down (0.75 to 1.0) ────────────────────────
    const childLandingX = cx + 80 * scale;
    const childLandingY = parentY;
    const childH = parentH * 0.65;
    const childW = parentW * 0.68;

    // Interpolate detached bud coordinates
    const curChildX = budAttachX * (1 - p_detach) + childLandingX * p_detach;
    // Parabolic floating path (arches up slightly then drops)
    const floatHeight = 45 * scale * Math.sin(p_detach * Math.PI);
    const curChildY = budAttachY * (1 - p_detach) + childLandingY * p_detach - floatHeight;

    // Draw the baby Hydra
    // As it detaches and floats, it wiggles and aligns vertically (1.0 tentacles ratio)
    drawHydraBody(curChildX, curChildY, childH, childW, 0.7, 1.0, t, true);

    if (progress < 0.90) {
      text(ctx, "Detached child floats away...", curChildX + 18 * scale, curChildY - 15 * scale, "#ff79c6", 9, "left");
    } else {
      text(ctx, "New independent clone settles! ✓", childLandingX, childLandingY + 22, "#39d353", 10.5, "center", true);
    }
  }

  // labels
  text(ctx, "Hydra Budding (Asexual)", cx, 20, "#8b949e", 11.5, "center", true);
}

function getWormWidth(y, maxW) {
  if (y < 0) y = 0;
  if (y > 1) y = 1;
  if (y < 0.15) {
    if (y < 0.08) {
      const p = y / 0.08;
      return maxW * 1.15 * Math.sin(p * Math.PI / 2);
    } else {
      const p = (y - 0.08) / 0.07;
      return maxW * (1.15 - 0.55 * p); // narrows to 0.6
    }
  } else if (y < 0.7) {
    const p = (y - 0.15) / 0.55;
    return maxW * (0.6 + 0.15 * Math.sin(p * Math.PI)); // peaks at 0.75, ends at 0.6
  } else {
    const p = (y - 0.7) / 0.3;
    return maxW * 0.6 * (1 - p); // tapers to 0
  }
}

function drawWormSlice(ctx, cx, cy_piece, fullL, maxW, yStart, yEnd, fillColor, strokeColor, wiggleAmp, t) {
  if (yStart >= yEnd) return;
  const TWO_PI = Math.PI * 2;
  const leftPoints = [];
  const rightPoints = [];
  const step = 0.02;

  for (let y = yStart; y <= yEnd + 0.0001; y += step) {
    const curY = Math.min(y, yEnd);
    const screenY = cy_piece + (curY - 0.5) * fullL;
    const screenX = cx + Math.sin(curY * 8 - t * 4) * wiggleAmp;
    const hw = getWormWidth(curY, maxW);
    leftPoints.push({ x: screenX - hw, y: screenY });
    rightPoints.push({ x: screenX + hw, y: screenY });
  }

  ctx.beginPath();
  ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
  for (let i = 1; i < leftPoints.length; i++) {
    ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
  }
  ctx.lineTo(rightPoints[rightPoints.length - 1].x, rightPoints[rightPoints.length - 1].y);
  for (let i = rightPoints.length - 2; i >= 0; i--) {
    ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Draw planarian eyespots if the head portion (around y = 0.06) is rendered
  if (yStart <= 0.06 && yEnd >= 0.06) {
    const eyeY = cy_piece + (0.06 - 0.5) * fullL;
    const eyeX_center = cx + Math.sin(0.06 * 8 - t * 4) * wiggleAmp;
    const eyeDist = maxW * 0.25;

    // White ocelli cups
    circle(ctx, eyeX_center - eyeDist, eyeY, 3.5, "#ffffff", strokeColor, 1);
    circle(ctx, eyeX_center + eyeDist, eyeY, 3.5, "#ffffff", strokeColor, 1);

    // Black pupils pointing inwards (crescent cross-eyed look)
    circle(ctx, eyeX_center - eyeDist + 1.0, eyeY, 1.5, "#0d1117", null);
    circle(ctx, eyeX_center + eyeDist - 1.0, eyeY, 1.5, "#0d1117", null);
  }
}

function _drawRegeneration(ctx, cx, cy, W, H, progress, t) {
  const maxW = Math.min(W, H) * 0.09;
  const WORM_L = Math.min(W, H) * 0.32;
  const TWO_PI = Math.PI * 2;

  // Colors
  const brownFill   = "rgba(165, 125, 95, 0.95)";
  const brownStroke = "#5a3d28";
  const pinkFill    = "rgba(235, 185, 180, 0.75)";
  const pinkStroke  = "rgba(205, 135, 130, 0.95)";
  
  // Transition thresholds
  const t_cut1 = 0.12;
  const t_cut2 = 0.24;
  const t_sep  = 0.52;
  const t_grow = 0.90;

  // ── PHASE 1: INTACT & CUTTING (0.0 to 0.24) ──────────────────────────────
  if (progress < t_cut2) {
    // Draw intact worm in centre
    const wiggle = 8;
    drawWormSlice(ctx, cx, cy, WORM_L, maxW, 0.0, 1.0, brownFill, brownStroke, wiggle, t);

    // Render scissor cuts
    const cut1_Y = cy + (0.3 - 0.5) * WORM_L;
    const cut2_Y = cy + (0.7 - 0.5) * WORM_L;

    // Dotted scissor guide lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(244, 112, 103, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - maxW * 2, cut1_Y); ctx.lineTo(cx + maxW * 2, cut1_Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - maxW * 2, cut2_Y); ctx.lineTo(cx + maxW * 2, cut2_Y); ctx.stroke();
    ctx.setLineDash([]);

    if (progress < t_cut1) {
      // Scissor 1 cutting at y=0.3
      const ap = progress / t_cut1; // 0 -> 1
      const scissorX = cx + maxW * 2.2 - ap * maxW * 2.8;
      _drawScissor(ctx, scissorX, cut1_Y, 1 - ap);
      text(ctx, "Making top cut...", cx, cy + WORM_L * 0.6, "#e3b341", 10.5);
    } else {
      // Scissor 2 cutting at y=0.7
      const ap = (progress - t_cut1) / (t_cut2 - t_cut1); // 0 -> 1
      const scissorX = cx + maxW * 2.2 - ap * maxW * 2.8;
      _drawScissor(ctx, scissorX, cut2_Y, 1 - ap);
      text(ctx, "Making bottom cut...", cx, cy + WORM_L * 0.6, "#e3b341", 10.5);
    }
    text(ctx, "Planaria cut into 3 fragments", cx, cy - WORM_L * 0.6 - 15, "#8b949e", 11, "center", true);

  // ── PHASE 2: DRIFTING & HORIZONTAL ALIGNMENT (0.24 to 0.52) ──────────────
  } else if (progress < t_sep) {
    const p = (progress - t_cut2) / (t_sep - t_cut2); // 0 -> 1
    
    // Separation coordinates: drift horizontally to three columns, and adjust vertical center so they align vertically on cy
    const cx_top = cx - 180 * p;
    const cx_mid = cx;
    const cx_bot = cx + 180 * p;
    
    // Smoothly shift vertical centers so that the actual segment centers align horizontally on cy
    const cy_top = cy + 0.35 * WORM_L * p;
    const cy_mid = cy;
    const cy_bot = cy - 0.35 * WORM_L * p;
    
    const wiggle = 6 * (1 - p * 0.5);

    // Draw the 3 isolated segments (only original tissue)
    // Top (Head): [0.0, 0.3]
    drawWormSlice(ctx, cx_top, cy_top, WORM_L, maxW, 0.0, 0.3, brownFill, brownStroke, wiggle, t);
    // Mid (Body): [0.3, 0.7]
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.3, 0.7, brownFill, brownStroke, wiggle, t);
    // Bot (Tail): [0.7, 1.0]
    drawWormSlice(ctx, cx_bot, cy_bot, WORM_L, maxW, 0.7, 1.0, brownFill, brownStroke, wiggle, t);

    // Draw red cut scars on flat ends
    ctx.strokeStyle = "#f47067";
    ctx.lineWidth = 2.5;
    const cw_top = getWormWidth(0.3, maxW);
    const cw_bot = getWormWidth(0.7, maxW);

    const cut1_top = cy_top + (0.3 - 0.5) * WORM_L;
    const cut1_mid = cy_mid + (0.3 - 0.5) * WORM_L;
    const cut2_mid = cy_mid + (0.7 - 0.5) * WORM_L;
    const cut2_bot = cy_bot + (0.7 - 0.5) * WORM_L;

    // Draw lines
    ctx.beginPath(); ctx.moveTo(cx_top - cw_top, cut1_top); ctx.lineTo(cx_top + cw_top, cut1_top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_mid - cw_top, cut1_mid); ctx.lineTo(cx_mid + cw_top, cut1_mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_mid - cw_bot, cut2_mid); ctx.lineTo(cx_mid + cw_bot, cut2_mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_bot - cw_bot, cut2_bot); ctx.lineTo(cx_bot + cw_bot, cut2_bot); ctx.stroke();

    text(ctx, "Flat wound surfaces exposed", cx, cy - 25, "#ff79c6", 9);
    text(ctx, "Aligning fragments horizontally...", cx, H - 35, "#8b949e", 10.5);

  // ── PHASE 3: ACTIVE REGROWTH (0.52 to 0.90) ──────────────────────────────
  } else if (progress < t_grow) {
    const g = (progress - t_sep) / (t_grow - t_sep); // 0 -> 1
    
    // Fully separated columns
    const cx_top = cx - 180;
    const cx_mid = cx;
    const cx_bot = cx + 180;
    
    // Slices bounds
    // Top Piece current range is [0.0, 0.3 + 0.7 * g]. Center is (0.3 + 0.7 * g) / 2
    const yMid_top = (0.3 + 0.7 * g) / 2;
    const cy_top = cy + (0.5 - yMid_top) * WORM_L;

    // Middle Piece current range is [0.3 - 0.3 * g, 0.7 + 0.3 * g]. Center is always 0.5
    const cy_mid = cy;

    // Bottom Piece current range is [0.7 - 0.7 * g, 1.0]. Center is (0.7 - 0.7 * g + 1.0) / 2
    const yMid_bot = (1.7 - 0.7 * g) / 2;
    const cy_bot = cy + (0.5 - yMid_bot) * WORM_L;

    const wiggle = 6;

    // 1. Top Piece: original head [0, 0.3], regrowing tail [0.3, 0.3 + 0.7 * g]
    drawWormSlice(ctx, cx_top, cy_top, WORM_L, maxW, 0.0, 0.3, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_top, cy_top, WORM_L, maxW, 0.3, 0.3 + 0.7 * g, pinkFill, pinkStroke, wiggle, t);

    // 2. Middle Piece: regrowing head [0.3 - 0.3 * g, 0.3], original body [0.3, 0.7], regrowing tail [0.7, 0.7 + 0.3 * g]
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.3, 0.7, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.3 - 0.3 * g, 0.3, pinkFill, pinkStroke, wiggle, t);
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.7, 0.7 + 0.3 * g, pinkFill, pinkStroke, wiggle, t);

    // 3. Bottom Piece: regrowing head [0.7 - 0.7 * g, 0.7], original tail [0.7, 1.0]
    drawWormSlice(ctx, cx_bot, cy_bot, WORM_L, maxW, 0.7, 1.0, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_bot, cy_bot, WORM_L, maxW, 0.7 - 0.7 * g, 0.7, pinkFill, pinkStroke, wiggle, t);

    // Draw glowing green blastema zones at regeneration boundaries
    const cut1_top = cy_top + (0.3 - 0.5) * WORM_L;
    const cut1_mid = cy_mid + (0.3 - 0.5) * WORM_L;
    const cut2_mid = cy_mid + (0.7 - 0.5) * WORM_L;
    const cut2_bot = cy_bot + (0.7 - 0.5) * WORM_L;
    const cw_top = getWormWidth(0.3, maxW);
    const cw_bot = getWormWidth(0.7, maxW);

    ctx.strokeStyle = "#39d353";
    ctx.lineWidth = 3;
    
    // Pulse effect
    const pulse = 0.5 + 0.5 * Math.sin(t * 8);
    ctx.globalAlpha = 0.5 + 0.5 * pulse;
    ctx.beginPath(); ctx.moveTo(cx_top - cw_top, cut1_top); ctx.lineTo(cx_top + cw_top, cut1_top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_mid - cw_top, cut1_mid); ctx.lineTo(cx_mid + cw_top, cut1_mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_mid - cw_bot, cut2_mid); ctx.lineTo(cx_mid + cw_bot, cut2_mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx_bot - cw_bot, cut2_bot); ctx.lineTo(cx_bot + cw_bot, cut2_bot); ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Draw dividing cell particles floating from cut lines
    for (let i = 0; i < 5; i++) {
      const partT = (t * 0.8 + i * 0.2) % 1.0;
      const py_offset = partT * 18;
      const pAlpha = 1 - partT;
      ctx.fillStyle = `rgba(57, 211, 83, ${pAlpha})`;
      
      // Top slice floating down
      circle(ctx, cx_top + (i - 2) * 8 + Math.sin(t + i) * 2, cut1_top + py_offset, 2.5, null, null);
      // Mid slice floating up & down
      circle(ctx, cx_mid + (i - 2) * 8, cut1_mid - py_offset, 2.5, null, null);
      circle(ctx, cx_mid + (i - 2) * 8, cut2_mid + py_offset, 2.5, null, null);
      // Bot slice floating up
      circle(ctx, cx_bot + (i - 2) * 8 + Math.sin(t - i) * 2, cut2_bot - py_offset, 2.5, null, null);
    }

    // Annotate blastema and new tissue
    text(ctx, "Blastema (Neoblasts)", cx_top - maxW * 1.6, cut1_top, "#39d353", 9, "right");
    text(ctx, "✦ New Tissue", cx_top + maxW * 1.6, cut1_top + 16, "rgba(235, 185, 180, 0.95)", 9, "left");

    text(ctx, "Totipotent neoblasts proliferate & differentiate", cx, H - 35, "#8b949e", 10.5);

  // ── PHASE 4: FULL CLONES COMPLETE (0.90 to 1.0) ───────────────────────────
  } else {
    const cx_top = cx - 180;
    const cx_mid = cx;
    const cx_bot = cx + 180;
    const cy_top = cy;
    const cy_mid = cy;
    const cy_bot = cy;
    const wiggle = 8;

    // Render 3 fully completed worms with a slightly lighter color on the regenerated parts to show what grew
    // Top Clone
    drawWormSlice(ctx, cx_top, cy_top, WORM_L, maxW, 0.0, 0.3, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_top, cy_top, WORM_L, maxW, 0.3, 1.0, "rgba(195, 145, 115, 0.9)", brownStroke, wiggle, t);

    // Mid Clone
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.3, 0.7, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.0, 0.3, "rgba(195, 145, 115, 0.9)", brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_mid, cy_mid, WORM_L, maxW, 0.7, 1.0, "rgba(195, 145, 115, 0.9)", brownStroke, wiggle, t);

    // Bot Clone
    drawWormSlice(ctx, cx_bot, cy_bot, WORM_L, maxW, 0.7, 1.0, brownFill, brownStroke, wiggle, t);
    drawWormSlice(ctx, cx_bot, cy_bot, WORM_L, maxW, 0.0, 0.7, "rgba(195, 145, 115, 0.9)", brownStroke, wiggle, t);

    // Labels
    text(ctx, "Clone 1 (from Head)", cx_top, cy_top - WORM_L * 0.6, "#58a6ff", 10, "center", true);
    text(ctx, "Clone 2 (from Body)", cx_mid, cy_mid - WORM_L * 0.6, "#e3b341", 10, "center", true);
    text(ctx, "Clone 3 (from Tail)", cx_bot, cy_bot - WORM_L * 0.6, "#39d353", 10, "center", true);

    text(ctx, "Regeneration complete! 3 identical Planaria clones created. ✓", cx, H - 35, "#39d353", 11, "center", true);
  }

  // Title
  text(ctx, "Planaria Regeneration (Class 10 Biology)", cx, 20, "#8b949e", 11.5, "center", true);
}

function _drawScissor(ctx, x, y, openness) {
  ctx.save();
  ctx.translate(x, y);
  const angle = 0.35 * openness; // blades spread open
  ctx.strokeStyle = "#e3b341";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  // Upper blade
  ctx.save();
  ctx.rotate(-angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-22, -8);
  ctx.stroke();
  // Upper handle loop
  ctx.beginPath();
  ctx.arc(-22, -8, 6, 0, TWO_PI);
  ctx.strokeStyle = "#e3b341"; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();

  // Lower blade
  ctx.save();
  ctx.rotate(+angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-22, 8);
  ctx.stroke();
  // Lower handle loop
  ctx.beginPath();
  ctx.arc(-22, 8, 6, 0, TWO_PI);
  ctx.strokeStyle = "#e3b341"; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();

  // Pivot dot
  circle(ctx, 0, 0, 3, "#e3b341", null);
  ctx.restore();
}



// ── Builder Mode: draw cell with placed organelles ────────────────────────────
export function drawBuilderCell(ctx, W, H, cellType, placedOrganelles, hoveredOrganelle, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(48,54,61,0.4)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const cx = W / 2, cy = H / 2;
  const rx = W * 0.32, ry = H * 0.38;

  // Ghost cell boundary
  drawCellBoundary(ctx, cx, cy, rx, ry, cellType, "#39d353", 0.4);

  // Placed organelles
  placedOrganelles.forEach(p => {
    const isMitoch = p.id === "mitochondria";
    const isChlo = p.id === "chloroplast";
    const glowFn = isMitoch || isChlo ? p.id : null;
    ctx.globalAlpha = hoveredOrganelle === p.uid ? 0.7 : 1;
    drawOrganelle(ctx, p.id, p.x, p.y, p.scale || 1, t, { large: p.large });
    ctx.globalAlpha = 1;
  });
}
