import { CLR, PARTICLE_COLS, PARTICLE_ROWS, MAX_DISP_PX } from "../constants/soundConstants";

// ─── Background & grid ────────────────────────────────────────────────────────
export function clearCanvas(ctx, W, H, isDark) {
  ctx.fillStyle = isDark ? "#060a10" : CLR.bg;
  ctx.fillRect(0, 0, W, H);
}

export function drawDotGrid(ctx, W, H) {
  const sp = 28;
  ctx.fillStyle = CLR.grid;
  for (let x = sp; x < W; x += sp)
    for (let y = sp; y < H; y += sp) {
      ctx.beginPath();
      ctx.arc(x, y, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
}

// ─── Speaker / piston on left wall ───────────────────────────────────────────
export function drawSpeaker(ctx, H, tankTop, tankH, pistonX, amplitude, t) {
  const cx    = pistonX;
  const midY  = tankTop + tankH / 2;
  const spH   = tankH * 0.72;
  const wobble = amplitude * Math.sin(t * 8) * 3; // visual wobble

  // Back plate
  ctx.save();
  ctx.fillStyle   = CLR.speaker;
  ctx.strokeStyle = CLR.speakerEdge;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 18, midY - spH / 2, 18, spH, [0, 0, 4, 4]);
  ctx.fill(); ctx.stroke();

  // Cone
  const coneW = 10 + wobble;
  ctx.fillStyle = "#2d333b";
  ctx.beginPath();
  ctx.moveTo(cx, midY - spH * 0.38);
  ctx.lineTo(cx + coneW, midY - spH * 0.18);
  ctx.lineTo(cx + coneW, midY + spH * 0.18);
  ctx.lineTo(cx, midY + spH * 0.38);
  ctx.closePath();
  ctx.fill();

  // Dome
  ctx.fillStyle = "#58a6ff44";
  ctx.beginPath();
  ctx.arc(cx + coneW, midY, spH * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Right wall / boundary ────────────────────────────────────────────────────
export function drawWall(ctx, wallX, tankTop, tankH, isRigid) {
  ctx.save();
  if (isRigid) {
    ctx.fillStyle   = "#21262d";
    ctx.strokeStyle = "#8b949e";
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.rect(wallX, tankTop, 12, tankH);
    ctx.fill(); ctx.stroke();
    // Hatch marks
    ctx.strokeStyle = "rgba(139,148,158,0.3)";
    ctx.lineWidth   = 1;
    for (let y = tankTop; y < tankTop + tankH; y += 10) {
      ctx.beginPath();
      ctx.moveTo(wallX + 12, y);
      ctx.lineTo(wallX + 22, y + 10);
      ctx.stroke();
    }
  } else {
    // Foam — dark wavy fill
    ctx.fillStyle = "rgba(33,38,45,0.8)";
    ctx.beginPath();
    ctx.rect(wallX, tankTop, 14, tankH);
    ctx.fill();
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth   = 1;
    for (let y = tankTop + 4; y < tankTop + tankH - 4; y += 6) {
      ctx.beginPath();
      ctx.moveTo(wallX + 2, y);
      ctx.quadraticCurveTo(wallX + 7, y + 3, wallX + 12, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ─── Tank border ─────────────────────────────────────────────────────────────
export function drawTankBorder(ctx, tankLeft, tankTop, tankW, tankH) {
  ctx.save();
  ctx.strokeStyle = CLR.border;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(tankLeft, tankTop, tankW, tankH);
  ctx.restore();
}

// ─── Particle grid ────────────────────────────────────────────────────────────
/**
 * Draws PARTICLE_COLS × PARTICLE_ROWS molecules inside the tank.
 * Each column x maps to a wave displacement y(x,t) which nudges the dots.
 * @param {Float32Array} dispArr  – per-column displacement (−1 to 1 normalised)
 */
// ─── Particle grid ────────────────────────────────────────────────────────────
/**
 * Draws PARTICLE_COLS × PARTICLE_ROWS molecules inside the tank.
 * Synchronized 1:1 vertically with the sine wave graph below.
 * @param {Float32Array} dispArr – per-column displacement (−1 to 1 normalised)
 */
export function drawParticles(ctx, tankLeft, tankTop, tankW, tankH, dispArr) {
  const step   = tankW / (PARTICLE_COLS - 1);
  const rowH   = tankH / (PARTICLE_ROWS + 1);
  const radius = 2.4;

  ctx.save();
  for (let col = 0; col < PARTICLE_COLS; col++) {
    const disp     = dispArr[col];             // -1 to 1
    const dispPx   = disp * MAX_DISP_PX;
    // Calculate local compression gradient from neighboring column difference
    const prevDisp = col > 0 ? dispArr[col - 1] : disp;
    const nextDisp = col < PARTICLE_COLS - 1 ? dispArr[col + 1] : disp;
    const compression = -(nextDisp - prevDisp) * 0.5; // positive = compression, negative = rarefaction

    // Exact 1:1 X-coordinate matching the wave graph col position
    const baseX = tankLeft + col * step + dispPx;

    // Color particles: Cyan for compression peaks, Amber/White for rarefactions
    const alpha = Math.min(0.95, Math.max(0.2, 0.4 + compression * 0.5));
    ctx.fillStyle = compression > 0.1
      ? `rgba(0, 229, 255, ${alpha})`
      : compression < -0.1
      ? `rgba(227, 179, 65, ${alpha * 0.7})`
      : `rgba(240, 246, 252, ${0.3 + Math.abs(disp) * 0.2})`;

    for (let row = 0; row < PARTICLE_ROWS; row++) {
      const baseY = tankTop + (row + 1) * rowH;
      const stagger = ((row % 2) * 0.5 - 0.25) * step;
      ctx.beginPath();
      ctx.arc(baseX + stagger, baseY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Wave graph (bottom panel with real-world spatial ruler) ──────────────────
/**
 * Draws the displacement vs distance sine trace with dynamic X-axis spatial ticks.
 * @param {Float32Array} dispArr
 * @param {Float32Array|null} targetArr   – target silhouette for Mode 1
 * @param {Float32Array|null} noiseArr    – noise wave for Mode 2
 */
export function drawWaveGraph(ctx, gLeft, gTop, gW, gH, dispArr, targetArr, noiseArr) {
  const midY = gTop + gH / 2;

  // Background
  ctx.fillStyle = CLR.bg;
  ctx.fillRect(gLeft, gTop, gW, gH);

  // Centre baseline axis
  ctx.save();
  ctx.strokeStyle = "rgba(88,166,255,0.3)";
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(gLeft, midY);
  ctx.lineTo(gLeft + gW, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Y-axis labels & Direction
  ctx.fillStyle = CLR.muted;
  ctx.font      = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Displacement (y)", gLeft + 6, gTop + 12);
  ctx.fillText("0", gLeft + 6, midY - 3);
  ctx.textAlign = "right";
  ctx.fillText("Distance (x) →", gLeft + gW - 6, gTop + 12);
  ctx.restore();

  const ampPx = (gH / 2) * 0.78;
  const step  = gW / (dispArr.length - 1);

  // Target silhouette (Mode 1 — dashed amber)
  if (targetArr) {
    ctx.save();
    ctx.strokeStyle = CLR.target;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    for (let i = 0; i < targetArr.length; i++) {
      const px = gLeft + i * step;
      const py = midY - targetArr[i] * ampPx;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Noise wave (Mode 2 — red)
  if (noiseArr) {
    ctx.save();
    ctx.strokeStyle = CLR.noise;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (let i = 0; i < noiseArr.length; i++) {
      const px = gLeft + i * step;
      const py = midY - noiseArr[i] * ampPx;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Live user wave — neon cyan with glow
  ctx.save();
  ctx.strokeStyle = CLR.wave;
  ctx.lineWidth   = 2.4;
  ctx.shadowColor = CLR.wave;
  ctx.shadowBlur  = 10;
  ctx.lineJoin    = "round";
  ctx.beginPath();
  for (let i = 0; i < dispArr.length; i++) {
    const px = gLeft + i * step;
    const py = midY - dispArr[i] * ampPx;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // Graph border
  ctx.save();
  ctx.strokeStyle = CLR.border;
  ctx.lineWidth   = 1;
  ctx.strokeRect(gLeft, gTop, gW, gH);
  ctx.restore();
}

// ─── Dynamic X-Axis Spatial Ruler Ticks & Spatial Span Readout ───────────────
export function drawGraphLabels(ctx, gLeft, gTop, gW, gH, wavelength, v, freq = 3.6) {
  ctx.save();
  
  // Real-World Spatial Axis Scaling (X-Axis):
  // Canvas Spatial Width D = Visible Cycles × λ
  const visibleCycles = Math.max(1, freq * 1.5);
  const totalSpatialSpanMeters = visibleCycles * wavelength;

  const midY = gTop + gH / 2;
  const numTicks = 6;
  const stepPx = gW / (numTicks - 1);
  const stepDist = totalSpatialSpanMeters / (numTicks - 1);

  // Render horizontal spatial tick marks along baseline
  ctx.strokeStyle = "rgba(139,148,158,0.4)";
  ctx.lineWidth = 1;
  ctx.fillStyle = CLR.muted;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let i = 0; i < numTicks; i++) {
    const x = gLeft + i * stepPx;
    const distVal = i * stepDist;

    ctx.beginPath();
    ctx.moveTo(x, midY - 4);
    ctx.lineTo(x, midY + 4);
    ctx.stroke();

    let distLabel = "";
    if (distVal >= 1000) {
      distLabel = `${(distVal / 1000).toFixed(1)}km`;
    } else if (distVal >= 1) {
      distLabel = `${distVal.toFixed(1)}m`;
    } else {
      distLabel = `${(distVal * 100).toFixed(0)}cm`;
    }

    if (i > 0 && i < numTicks - 1) {
      ctx.fillText(distLabel, x, midY + 6);
    }
  }

  // Right-aligned Spatial Readout Summary Badge
  ctx.fillStyle = CLR.wave;
  ctx.font      = "bold 10px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    `Span D = ${totalSpatialSpanMeters.toFixed(1)}m   |   λ = ${wavelength.toFixed(2)}m   |   v = ${v.toFixed(0)}m/s`,
    gLeft + gW - 6,
    gTop + gH - 6
  );

  ctx.restore();
}
