import { CLR, BLOCK_SIZE, RAMP_ORIGIN_PAD_X, RAMP_ORIGIN_PAD_Y, RAMP_LENGTH } from "../constants/frictionConstants";

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Compute the three key screen-space points of the ramp triangle.
 *
 * The ramp is drawn as a right-angle triangle:
 *   origin  – bottom-left corner (ground level, left side)
 *   tip     – top of the slope (where the hypotenuse meets the vertical leg)
 *   base    – bottom-right corner directly below tip (ground level)
 *
 * @returns {{ origin, tip, base, rampLen, cosA, sinA }}
 */
export function getRampGeometry(W, H, angleDeg, rampLenFraction = RAMP_LENGTH) {
  const rad     = (angleDeg * Math.PI) / 180;
  const cosA    = Math.cos(rad);
  const sinA    = Math.sin(rad);
  const rampLen = Math.min(W, H) * rampLenFraction;

  const origin = { x: W * RAMP_ORIGIN_PAD_X, y: H * RAMP_ORIGIN_PAD_Y };
  const tip    = { x: origin.x + rampLen * cosA,  y: origin.y - rampLen * sinA };
  const base   = { x: tip.x,                       y: origin.y };

  return { origin, tip, base, rampLen, cosA, sinA, rad };
}

/**
 * Given a distance `d` along the ramp from the TOP (tip), return the
 * screen-space centre of the block sitting on the surface at that position.
 *
 *  d = 0  → block centre is at the tip
 *  d = rampLen - BLOCK_SIZE/2 → block is at the bottom of the ramp
 *
 * The block is a square; its centre sits BLOCK_SIZE/2 above (perpendicular to)
 * the ramp surface so it appears to rest on it.
 */
export function blockCentre(tip, cosA, sinA, rampLen, d) {
  // Position along the ramp surface from the tip
  const along = Math.min(d, rampLen - BLOCK_SIZE * 0.5);
  // Surface point (on the hypotenuse)
  const sx = tip.x - along * cosA;        // moving toward origin
  const sy = tip.y + along * sinA;
  // Lift perpendicular to surface by half block size
  const px = sx - (BLOCK_SIZE / 2) * sinA;  // perpendicular = rotate (cosA,sinA) by 90°
  const py = sy - (BLOCK_SIZE / 2) * cosA;
  return { x: px, y: py };
}

// ─── Clear & background ───────────────────────────────────────────────────────
export function clearCanvas(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = CLR.bg;
  ctx.fillRect(0, 0, W, H);
}

// ─── Subtle dot-grid ──────────────────────────────────────────────────────────
export function drawDotGrid(ctx, W, H) {
  const spacing = 30;
  ctx.save();
  ctx.fillStyle = CLR.grid;
  for (let x = spacing; x < W; x += spacing) {
    for (let y = spacing; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Ground line (scene-space version — coordinates passed in directly) ───────
export function drawGroundLine(ctx, fromX, toX, y) {
  ctx.save();
  ctx.strokeStyle = CLR.rampEdge;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, y);
  ctx.lineTo(toX,   y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(48,54,61,0.45)";
  ctx.lineWidth   = 1;
  const hatchStep = 18;
  for (let x = fromX; x < toX; x += hatchStep) {
    ctx.beginPath();
    ctx.moveTo(x,      y);
    ctx.lineTo(x - 10, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Ground line (legacy canvas-relative version, kept for compatibility) ────
export function drawGround(ctx, W, H) {
  const y = H * RAMP_ORIGIN_PAD_Y;
  drawGroundLine(ctx, 0, W, y);
}

// ─── Ramp triangle ────────────────────────────────────────────────────────────
export function drawRamp(ctx, origin, tip, base) {
  ctx.save();

  // 1. Filled triangle with smooth dark gradient
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(tip.x,    tip.y);
  ctx.lineTo(base.x,   base.y);
  ctx.closePath();
  
  const rampGrad = ctx.createLinearGradient(origin.x, tip.y, base.x, origin.y);
  rampGrad.addColorStop(0, "rgba(30, 41, 59, 0.85)");
  rampGrad.addColorStop(1, "rgba(15, 23, 42, 0.95)");
  ctx.fillStyle = rampGrad;
  ctx.fill();

  // Subtle interior grid lines on ramp body
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  const numGridLines = 6;
  for (let i = 1; i < numGridLines; i++) {
    const frac = i / numGridLines;
    const px = origin.x + (tip.x - origin.x) * frac;
    const py = origin.y + (tip.y - origin.y) * frac;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, origin.y);
    ctx.stroke();
  }

  // 2. Glowing Hypotenuse (Slope Surface)
  ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
  ctx.shadowBlur = 8;
  const slopeGrad = ctx.createLinearGradient(origin.x, origin.y, tip.x, tip.y);
  slopeGrad.addColorStop(0, "#38bdf8");
  slopeGrad.addColorStop(1, "#818cf8");

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(tip.x,    tip.y);
  ctx.strokeStyle = slopeGrad;
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Tactile surface friction ticks along hypotenuse
  const dx = tip.x - origin.x;
  const dy = tip.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const cosA = dx / dist;
  const sinA = dy / dist;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  for (let d = 15; d < dist - 10; d += 25) {
    const sx = origin.x + d * cosA;
    const sy = origin.y + d * sinA;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 4 * sinA, sy + 4 * cosA);
    ctx.stroke();
  }

  // 3. Vertical & Base edges
  ctx.beginPath();
  ctx.moveTo(tip.x,  tip.y);
  ctx.lineTo(base.x, base.y);
  ctx.lineTo(origin.x, origin.y);
  ctx.strokeStyle = "rgba(71, 85, 105, 0.8)";
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.restore();
}

// ─── Angle arc label ─────────────────────────────────────────────────────────
export function drawAngleArc(ctx, origin, rad, angleDeg, scale = 1) {
  if (angleDeg < 2) return;
  const arcR = 38;
  ctx.save();
  
  // Filled arc wedge
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, arcR, -rad, 0, false);
  ctx.closePath();
  ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
  ctx.fill();

  // Arc stroke
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth   = 1.5 / scale;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, arcR, -rad, 0, false);
  ctx.stroke();

  // Angle Badge Pill
  const midAngle = -rad / 2;
  const lx = origin.x + (arcR + 18) * Math.cos(midAngle);
  const ly = origin.y + (arcR + 18) * Math.sin(midAngle);

  const fontSize = Math.round(11 / scale);
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  const text = `${angleDeg}°`;
  const textW = ctx.measureText(text).width;
  const px = textW + 8 / scale;
  const py = fontSize + 6 / scale;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  ctx.roundRect(lx - px / 2, ly - py / 2, px, py, 4 / scale);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, lx, ly);
  ctx.restore();
}

// ─── Block ────────────────────────────────────────────────────────────────────
export function drawBlock(ctx, cx, cy, rad, isMoving) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-rad);   // rotate parallel to slope

  const half = BLOCK_SIZE / 2;

  // Shadow / glow under block
  ctx.shadowColor = isMoving ? "rgba(52, 211, 153, 0.6)" : "rgba(56, 189, 248, 0.4)";
  ctx.shadowBlur  = isMoving ? 16 : 8;

  // Rich 3D gradient body
  const grad = ctx.createLinearGradient(-half, -half, half, half);
  if (isMoving) {
    grad.addColorStop(0, "#34d399");
    grad.addColorStop(1, "#059669");
  } else {
    grad.addColorStop(0, "#60a5fa");
    grad.addColorStop(1, "#1d4ed8");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-half, -half, BLOCK_SIZE, BLOCK_SIZE, 6);
  ctx.fill();

  // Top highlight bevel line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 0;
  ctx.beginPath();
  ctx.moveTo(-half + 4, -half + 2);
  ctx.lineTo(half - 4, -half + 2);
  ctx.stroke();

  // Border outline
  ctx.strokeStyle = isMoving ? "#a7f3d0" : "#93c5fd";
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(-half, -half, BLOCK_SIZE, BLOCK_SIZE, 6);
  ctx.stroke();

  // Center crosshair & dot
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Arrow helper with pill badges ───────────────────────────────────────────
function drawArrow(ctx, fx, fy, tx, ty, color, lineWidth = 2.2, label = "", scale = 1) {
  const headLen = 10 / scale;
  const angle   = Math.atan2(ty - fy, tx - fx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lineWidth / scale;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 8 / scale;
  ctx.lineCap     = "round";

  // Shaft
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Label Pill Badge
  if (label) {
    ctx.shadowBlur = 0;
    const fontSize = Math.max(12, Math.round(11 / scale));
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const textW = ctx.measureText(label).width;
    const offset = 18 / scale;
    const lx = tx + offset * Math.cos(angle);
    const ly = ty + offset * Math.sin(angle);
    const px = textW + 8 / scale;
    const py = fontSize + 6 / scale;

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 1 / scale);
    ctx.beginPath();
    ctx.roundRect(lx - px / 2, ly - py / 2, px, py, 4 / scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  }

  ctx.restore();
}

// ─── Force vectors ────────────────────────────────────────────────────────────
const VEC_SCALE = 0.6; // scene-units per Newton

/**
 * Draw the three force vectors from the block centre:
 *   1. Gravity   — straight down
 *   2. Normal    — perpendicular to slope (pointing away from surface)
 *   3. Friction  — along slope opposing motion (up the slope when moving)
 *
 * scale: the autoScale currently applied — forwarded to drawArrow so that
 *        arrow heads and labels stay readable at any canvas size.
 */
export function drawForceVectors(ctx, cx, cy, rad, cosA, sinA, forces, showVectors, scale = 1) {
  if (!showVectors) return;

  const { fGravity, fNormal, fFriction } = forces;

  // 1. Gravity — straight down
  const gLen = fGravity * VEC_SCALE;
  drawArrow(ctx, cx, cy, cx, cy + gLen, CLR.gravity, 2.2, `${fGravity.toFixed(1)}N`, scale);

  // 2. Normal — perpendicular to slope surface (rotated 90° from slope direction)
  //    Normal (pointing away from surface = up-left): (-sinA, -cosA)
  const nLen = fNormal * VEC_SCALE;
  const nTx  = cx + nLen * (-sinA);
  const nTy  = cy + nLen * (-cosA);
  drawArrow(ctx, cx, cy, nTx, nTy, CLR.normal, 2.2, `${fNormal.toFixed(1)}N`, scale);

  // 3. Friction — along slope, pointing uphill (opposing downhill slide)
  //    Slope goes from origin(bottom-left) to tip(top-right).
  //    Up-slope direction in screen coords = (cosA, -sinA)
  if (fFriction > 0.01) {
    const fLen = fFriction * VEC_SCALE;
    const fTx = cx + fLen * cosA;
    const fTy = cy + fLen * (-sinA);
    drawArrow(ctx, cx, cy, fTx, fTy, CLR.friction, 2.2, `${fFriction.toFixed(1)}N`, scale);
  }
}

// ─── "Critical slip angle" dashed guide line ──────────────────────────────────
// Drawn AFTER drawRamp so it always renders on top of the filled triangle.
// scale: the autoScale currently applied — used to keep text readable.
export function drawSlipAngleLine(ctx, origin, W, slipAngleDeg, currentAngleDeg, scale = 1) {
  if (slipAngleDeg <= 0 || slipAngleDeg > 89) return;
  const r      = (slipAngleDeg * Math.PI) / 180;
  // Use 0.95 of the extended width so the label has breathing room from the edge
  const len    = (W - origin.x) * 0.95;
  const tx     = origin.x + len * Math.cos(r);
  const ty     = origin.y - len * Math.sin(r);
  const isPast = currentAngleDeg >= slipAngleDeg;

  const lineColor  = isPast ? "rgba(244,112,103,0.75)" : "rgba(227,179,65,0.6)";
  const labelColor = isPast ? CLR.gravity : CLR.friction;

  ctx.save();

  // Dashed line — drawn with a slightly stronger opacity so it shows over the ramp
  ctx.strokeStyle = lineColor;
  ctx.lineWidth   = 1.5 / scale;
  ctx.setLineDash([7 / scale, 5 / scale]);
  ctx.shadowColor = lineColor;
  ctx.shadowBlur  = 4 / scale;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // Label — anchored at the far tip of the line, offset perpendicularly so it
  // sits just above the line end rather than on the line itself
  const fontSize   = Math.round(11 / scale);
  const perpX      = Math.sin(r) * (10 / scale);   // perpendicular offset above the line
  const perpY      = Math.cos(r) * (10 / scale);
  ctx.fillStyle    = labelColor;
  ctx.font         = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textAlign    = "right";
  ctx.fillText(`θc = ${slipAngleDeg.toFixed(1)}°`, tx - perpX, ty - perpY);
  ctx.restore();
}

// ─── "At rest" static friction indicator bar ─────────────────────────────────
export function drawFrictionUtilBar(ctx, W, H, ratio) {
  // Horizontal bar at the top showing how close to static limit we are
  const barW  = 160;
  const barH  = 6;
  const bx    = W - barW - 12;
  const by    = 12;
  const fill  = Math.min(ratio, 1);
  const color = fill >= 1 ? CLR.gravity : fill > 0.75 ? CLR.friction : CLR.normal;

  ctx.save();
  // Track
  ctx.fillStyle   = CLR.border;
  ctx.beginPath();
  ctx.roundRect(bx, by, barW, barH, 3);
  ctx.fill();
  // Fill
  if (fill > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * fill, barH, 3);
    ctx.fill();
  }
  // Label
  ctx.fillStyle = CLR.muted;
  ctx.font      = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("static friction limit", bx - 6, by + barH - 1);
  ctx.restore();
}

// ─── Force readout panel (canvas overlay, fixed bottom-left) ─────────────────
/**
 * Draws a compact force-values panel directly on the canvas.
 * Always rendered AFTER ctx.restore() so it sits at true canvas coords,
 * independent of any scene scale/translate.
 *
 * Visible before, during, and after the simulation — values update live
 * as sliders change.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}  W           canvas width
 * @param {number}  H           canvas height
 * @param {object}  forces      { fGravity, fNormal, fFriction, frictionRatio }
 * @param {number}  angleDeg    current incline angle
 * @param {string}  state       STATES value
 */
export function drawForceReadout(ctx, W, H, forces, angleDeg, state) {
  const { fGravity, fNormal, fFriction, frictionRatio } = forces;

  // Derived
  const rad        = (angleDeg * Math.PI) / 180;
  const fParallel  = fGravity * Math.sin(rad);   // component pulling down slope
  const fPerp      = fGravity * Math.cos(rad);   // component into slope (= fNormal)
  const fNet       = Math.max(0, fParallel - fFriction);
  const isIdle     = state === "idle";

  // ── Panel geometry ──────────────────────────────────────────────────────────
  const PAD   = 10;
  const ROW_H = 19;
  const rows  = [
    { label: "Weight  (mg)",       value: fGravity,   color: CLR.gravity,  unit: "N" },
    { label: "Normal  (N⊥)",       value: fNormal,    color: CLR.normal,   unit: "N" },
    { label: "Gravity ∥ slope",    value: fParallel,  color: CLR.gravity,  unit: "N" },
    { label: "Friction  (f)",      value: fFriction,  color: CLR.friction, unit: "N" },
    { label: "Net Force",          value: fNet,       color: fNet > 0.5 ? CLR.gravity : CLR.muted, unit: "N" },
  ];

  const panelW = 210;
  const panelH = PAD * 2 + rows.length * ROW_H + 28; // 28 for header
  const px     = W - panelW - 12;
  const py     = H - panelH - 12;

  ctx.save();

  // Panel background
  ctx.fillStyle   = "rgba(22,27,34,0.88)";
  ctx.strokeStyle = CLR.border;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 8);
  ctx.fill();
  ctx.stroke();

  // Header
  const headerLabel = isIdle ? "Applied Forces (preview)" : "Applied Forces (live)";
  const dotColor    = isIdle ? CLR.muted : CLR.neon;
  ctx.fillStyle = CLR.muted;
  ctx.font      = "bold 9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("◆ " + headerLabel.toUpperCase(), px + PAD, py + PAD + 9);

  // Dot indicator (green = running, grey = idle)
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(px + PAD + 4, py + PAD + 5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Separator line under header
  ctx.strokeStyle = CLR.border;
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.moveTo(px + PAD, py + PAD + 16);
  ctx.lineTo(px + panelW - PAD, py + PAD + 16);
  ctx.stroke();

  // Rows
  rows.forEach((row, i) => {
    const ry = py + PAD + 26 + i * ROW_H;

    // Label
    ctx.fillStyle = CLR.muted;
    ctx.font      = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(row.label, px + PAD, ry + 9);

    // Value + unit
    ctx.fillStyle = row.color;
    ctx.font      = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `${row.value.toFixed(2)} ${row.unit}`,
      px + panelW - PAD,
      ry + 9,
    );

    // Thin colored left accent bar
    ctx.fillStyle = row.color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.roundRect(px + 3, ry + 2, 3, ROW_H - 6, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Friction utilisation mini-bar at the bottom of the panel
  const barY    = py + panelH - 12;
  const barW    = panelW - PAD * 2;
  const fill    = Math.min(frictionRatio, 1);
  const barColor = fill >= 1 ? CLR.gravity : fill > 0.75 ? CLR.friction : CLR.normal;

  ctx.fillStyle = CLR.border;
  ctx.beginPath();
  ctx.roundRect(px + PAD, barY, barW, 4, 2);
  ctx.fill();

  if (fill > 0) {
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(px + PAD, barY, barW * fill, 4, 2);
    ctx.fill();
  }

  ctx.fillStyle = CLR.muted;
  ctx.font      = "8px monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `static grip: ${Math.round(frictionRatio * 100)}%`,
    px + panelW - PAD,
    barY - 3,
  );

  ctx.restore();
}
