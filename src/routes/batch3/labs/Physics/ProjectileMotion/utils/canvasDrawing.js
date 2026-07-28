import { CLR, DEFAULT_SCALE } from "../constants/physicsConstants";

// ─── Arrow primitive (screen-space only, no scale needed) ────────────────────
export function drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth = 2) {
  const headLen = 10;
  const angle   = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lineWidth;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── World → screen helpers ───────────────────────────────────────────────────
export function toScreenX(worldX, originX, scale) { return originX + worldX * scale; }
export function toScreenY(worldY, originY, scale) { return originY - worldY * scale; }

// ─── Cartesian grid ───────────────────────────────────────────────────────────
export function drawGrid(ctx, W, H, originX, originY, scale = DEFAULT_SCALE) {
  // Choose a grid spacing that stays readable: aim for ~5–10 grid lines visible
  const rawStep = (W - originX) / (scale * 5); // ideal world-metres between lines
  const niceStep = niceNumber(rawStep);
  const spacingPx = niceStep * scale;

  ctx.save();
  ctx.strokeStyle = CLR.grid;
  ctx.lineWidth   = 0.5;

  // Vertical lines + X labels
  for (let px = originX; px < W; px += spacingPx) {
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    const metres = Math.round((px - originX) / scale);
    ctx.fillStyle = CLR.muted;
    ctx.font = "9px monospace";
    ctx.fillText(`${metres}m`, px + 2, originY - 4);
  }

  // Horizontal lines + Y labels
  for (let py = originY; py > 0; py -= spacingPx) {
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    const metres = Math.round((originY - py) / scale);
    if (metres > 0) {
      ctx.fillStyle = CLR.muted;
      ctx.font = "9px monospace";
      ctx.fillText(`${metres}m`, originX + 3, py + 10);
    }
  }

  // Dashed axes
  ctx.strokeStyle = CLR.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(originX, 0);  ctx.lineTo(originX, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, originY);  ctx.lineTo(W, originY); ctx.stroke();
  ctx.setLineDash([]);

  // Ground line
  ctx.strokeStyle = CLR.ground;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();

  // Axis labels
  ctx.fillStyle = CLR.muted;
  ctx.font = "10px monospace";
  ctx.fillText("X (metres)", W - 70, originY - 6);
  ctx.save();
  ctx.translate(originX + 14, 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Y (metres)", 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Pick a "nice" round number >= rawValue for grid spacing.
 * Gives steps like 1, 2, 5, 10, 20, 50, 100 …
 */
function niceNumber(rawValue) {
  if (rawValue <= 0) return 1;
  const exp   = Math.floor(Math.log10(rawValue));
  const frac  = rawValue / Math.pow(10, exp);
  let nice;
  if      (frac <= 1)  nice = 1;
  else if (frac <= 2)  nice = 2;
  else if (frac <= 5)  nice = 5;
  else                 nice = 10;
  return nice * Math.pow(10, exp);
}

// ─── Retained historical trails ───────────────────────────────────────────────
export function drawTrails(ctx, trails, originX, originY, scale = DEFAULT_SCALE) {
  trails.forEach((trail, idx) => {
    if (trail.length < 2) return;
    const alpha = 0.25 + 0.15 * (idx / Math.max(trails.length - 1, 1));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = CLR.neon;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = "round";
    ctx.beginPath();
    trail.forEach((pt, i) => {
      const sx = toScreenX(pt.x, originX, scale);
      const sy = toScreenY(pt.y, originY, scale);
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    ctx.restore();
  });
}

// ─── Active flight path ───────────────────────────────────────────────────────
export function drawCurrentPath(ctx, path, originX, originY, scale = DEFAULT_SCALE) {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = CLR.neon;
  ctx.lineWidth   = 2.2;
  ctx.lineJoin    = "round";
  ctx.shadowColor = CLR.neon;
  ctx.shadowBlur  = 6;
  ctx.beginPath();
  path.forEach((pt, i) => {
    const sx = toScreenX(pt.x, originX, scale);
    const sy = toScreenY(pt.y, originY, scale);
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  });
  ctx.stroke();
  ctx.restore();
}

// ─── Apex flag ────────────────────────────────────────────────────────────────
export function drawApexFlag(ctx, apex, originX, originY, scale = DEFAULT_SCALE) {
  if (!apex) return;
  const sx    = toScreenX(apex.x, originX, scale);
  const sy    = toScreenY(apex.y, originY, scale);
  const poleH = 18;
  ctx.save();
  ctx.strokeStyle = CLR.apex;
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - poleH); ctx.stroke();
  ctx.fillStyle = CLR.apex;
  ctx.beginPath();
  ctx.moveTo(sx, sy - poleH);
  ctx.lineTo(sx + 12, sy - poleH + 5);
  ctx.lineTo(sx, sy - poleH + 10);
  ctx.closePath();
  ctx.fill();
  ctx.font = "bold 9px monospace";
  ctx.fillText(`▲ ${apex.y.toFixed(1)}m`, sx + 14, sy - poleH + 6);
  ctx.restore();
}

// ─── Velocity vector overlays ─────────────────────────────────────────────────
export function drawVectors(ctx, sx, sy, vx, vy, showVectors) {
  if (!showVectors) return;
  const VEC_SCALE = 8;
  if (Math.sqrt(vx * vx + vy * vy) < 0.1) return;

  const tx = sx + vx * VEC_SCALE;
  const ty = sy - vy * VEC_SCALE;

  drawArrow(ctx, sx, sy, tx, ty, CLR.velTotal, 2.5);
  drawArrow(ctx, sx, sy, sx + vx * VEC_SCALE, sy, CLR.velX, 1.8);
  drawArrow(ctx, sx, sy, sx, sy - vy * VEC_SCALE, CLR.velY, 1.8);

  ctx.save();
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = CLR.velTotal; ctx.fillText("v",  tx + 4, ty - 3);
  ctx.fillStyle = CLR.velX;     ctx.fillText("vx", sx + vx * VEC_SCALE + 4, sy + 12);
  ctx.fillStyle = CLR.velY;     ctx.fillText("vy", sx + 4, sy - vy * VEC_SCALE - 4);
  ctx.restore();
}

// ─── Projectile sphere ────────────────────────────────────────────────────────
export function drawProjectile(ctx, sx, sy) {
  ctx.save();
  ctx.shadowColor = "rgba(37, 99, 235, 0.5)";
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.arc(sx, sy, 9, 0, Math.PI * 2);
  ctx.strokeStyle = "#1d4ed8";
  ctx.lineWidth   = 2;
  ctx.stroke();
  const grad = ctx.createRadialGradient(sx - 3, sy - 3, 1, sx, sy, 9);
  grad.addColorStop(0, "#60a5fa");
  grad.addColorStop(1, "#1e40af");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// ─── Launch origin marker ─────────────────────────────────────────────────────
export function drawLaunchMarker(ctx, sx, sy) {
  ctx.save();
  ctx.strokeStyle = CLR.muted;
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Impact crosshair ─────────────────────────────────────────────────────────
export function drawImpactMarker(ctx, sx, sy) {
  ctx.save();
  ctx.fillStyle   = CLR.velX;
  ctx.strokeStyle = CLR.velX;
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6); ctx.stroke();
  ctx.font = "9px monospace";
  ctx.fillText("impact", sx + 8, sy - 3);
  ctx.restore();
}

// ─── Wind particle system ─────────────────────────────────────────────────────
const PARTICLE_COUNT = 38;

export function createWindParticles(W, H) {
  return Array.from({ length: PARTICLE_COUNT }, () => spawnParticle(W, H, true));
}

function spawnParticle(W, H, randomStart = false) {
  return {
    x:           randomStart ? Math.random() * W : (Math.random() < 0.5 ? -10 : W + 10),
    y:           Math.random() * H * 0.85,
    len:         16 + Math.random() * 28,
    speed:       0,
    alpha:       0.18 + Math.random() * 0.32,
    wobbleAmp:   (Math.random() - 0.5) * 0.4,
    wobblePhase: Math.random() * Math.PI * 2,
  };
}

export function tickWindParticles(particles, W, H, windSpeed, dt) {
  if (windSpeed === 0) return;
  const dir      = windSpeed > 0 ? 1 : -1;
  const pxPerSec = Math.abs(windSpeed) * 20;

  particles.forEach(p => {
    p.speed = pxPerSec;
    p.wobblePhase += dt * 1.8;
    p.x += dir * pxPerSec * dt;
    p.y += Math.sin(p.wobblePhase) * p.wobbleAmp;

    const offscreen = dir > 0 ? p.x - p.len > W : p.x + p.len < 0;
    if (offscreen) {
      const fresh = spawnParticle(W, H, false);
      fresh.x     = dir > 0 ? -fresh.len : W + fresh.len;
      Object.assign(p, fresh);
    }
  });
}

export function drawWindParticles(ctx, particles, windSpeed) {
  if (windSpeed === 0) return;
  const absWind   = Math.abs(windSpeed);
  const dir       = windSpeed > 0 ? 1 : -1;
  const intensity = Math.min(absWind / 15, 1);

  ctx.save();
  ctx.lineCap = "round";
  particles.forEach(p => {
    const streak = p.len * (0.4 + 0.6 * intensity);
    ctx.globalAlpha = p.alpha * intensity;
    ctx.strokeStyle = `hsl(${windSpeed > 0 ? 195 : 28},70%,70%)`;
    ctx.lineWidth   = 0.8 + intensity * 0.7;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dir * streak, p.y);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Dynamic scale overlay (zoom indicator) ───────────────────────────────────
/**
 * Draw a small "1:Xm" scale badge in the top-right corner so the user knows
 * the current zoom level when the view is zoomed out.
 */
export function drawScaleBadge(ctx, W, scale, defaultScale) {
  if (Math.abs(scale - defaultScale) < 0.5) return; // don't show at default zoom
  ctx.save();
  const label = `zoom: ${(scale / defaultScale * 100).toFixed(0)}%`;
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(139,148,158,0.7)";
  ctx.textAlign = "right";
  ctx.fillText(label, W - 8, 16);
  ctx.textAlign = "left";
  ctx.restore();
}
