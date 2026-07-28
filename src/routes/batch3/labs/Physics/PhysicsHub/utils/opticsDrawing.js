import { CLR_O } from "../constants/opticsConstants";

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function pointAtX(x0, y0, x1, y1, targetX) {
  const dx = x1 - x0;
  if (Math.abs(dx) < 1e-9) return { x: targetX, y: y0 };
  const t = (targetX - x0) / dx;
  return { x: targetX, y: y0 + t * (y1 - y0) };
}

function signedFocal(type, focalPx) {
  const isConcave = type.includes("concave");
  return isConcave ? -Math.abs(focalPx) : Math.abs(focalPx);
}

function arrow(ctx, fx, fy, tx, ty, color, lw = 1.5, head = 8) {
  const a = Math.atan2(ty - fy, tx - fx);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - head * Math.cos(a - Math.PI / 6), ty - head * Math.sin(a - Math.PI / 6));
  ctx.lineTo(tx - head * Math.cos(a + Math.PI / 6), ty - head * Math.sin(a + Math.PI / 6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ─── Clear ────────────────────────────────────────────────────────────────────
export function clearOptics(ctx, W, H) {
  ctx.fillStyle = CLR_O.bg; ctx.fillRect(0, 0, W, H);
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
export function drawOpticsGrid(ctx, W, H) {
  ctx.fillStyle = CLR_O.grid;
  for (let x = 24; x < W; x += 30)
    for (let y = 24; y < H; y += 30) {
      ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill();
    }
}

// ─── Principal axis ───────────────────────────────────────────────────────────
export function drawAxis(ctx, W, H) {
  const midY = H / 2;
  ctx.save();
  ctx.strokeStyle = CLR_O.axis;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = CLR_O.muted;
  ctx.font = "9px monospace";
  ctx.fillText("Principal Axis", 8, midY - 5);
  ctx.restore();
}

// ─── Mirror / Lens element ───────────────────────────────────────────────────
export function drawOpticElement(ctx, W, H, type, focalPx, lensX) {
  const midY = H / 2;
  const isMirror = type.includes("mirror");
  const isConcave = type.includes("concave");

  ctx.save();

  if (isMirror) {
    const arcR = Math.abs(focalPx) * 2;
    ctx.strokeStyle = CLR_O.mirror;
    ctx.lineWidth = 3;
    ctx.shadowColor = CLR_O.mirror;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    if (isConcave) {
      ctx.arc(lensX + arcR, midY, arcR, Math.PI - Math.PI / 4, Math.PI + Math.PI / 4);
    } else {
      ctx.arc(lensX - arcR, midY, arcR, -Math.PI / 4, Math.PI / 4);
    }
    ctx.stroke();
    const hatchLen = H * 0.3;
    for (let i = -5; i <= 5; i++) {
      const hy = midY + i * hatchLen / 10;
      ctx.strokeStyle = "rgba(139,148,158,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lensX + 4, hy);
      ctx.lineTo(lensX + 12, hy + 6);
      ctx.stroke();
    }
  } else {
    const lH = H * 0.55;
    ctx.strokeStyle = CLR_O.lens;
    ctx.fillStyle = CLR_O.lensGlow;
    ctx.lineWidth = 2;
    ctx.shadowColor = CLR_O.lens;
    ctx.shadowBlur = 10;
    if (isConcave) {
      const w = 30;
      const innerW = 3;
      ctx.beginPath();
      ctx.moveTo(lensX - w, midY - lH / 2);
      ctx.lineTo(lensX + w, midY - lH / 2);
      ctx.bezierCurveTo(lensX + innerW, midY - lH / 4, lensX + innerW, midY + lH / 4, lensX + w, midY + lH / 2);
      ctx.lineTo(lensX - w, midY + lH / 2);
      ctx.bezierCurveTo(lensX - innerW, midY + lH / 4, lensX - innerW, midY - lH / 4, lensX - w, midY - lH / 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      arrow(ctx, lensX, midY - lH / 2 - 6, lensX, midY - lH / 2 + 2, CLR_O.lens, 1.5, 6);
      arrow(ctx, lensX, midY + lH / 2 + 6, lensX, midY + lH / 2 - 2, CLR_O.lens, 1.5, 6);
    } else {
      const bulge = 18;
      ctx.beginPath();
      ctx.moveTo(lensX, midY - lH / 2);
      ctx.bezierCurveTo(lensX + bulge, midY - lH / 4, lensX + bulge, midY + lH / 4, lensX, midY + lH / 2);
      ctx.bezierCurveTo(lensX - bulge, midY + lH / 4, lensX - bulge, midY - lH / 4, lensX, midY - lH / 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      arrow(ctx, lensX, midY - lH / 2 + 6, lensX, midY - lH / 2 - 2, CLR_O.lens, 1.5, 6);
      arrow(ctx, lensX, midY + lH / 2 - 6, lensX, midY + lH / 2 + 2, CLR_O.lens, 1.5, 6);
    }
  }

  const fAbs = Math.abs(focalPx);
  const fSigned = signedFocal(type, focalPx);
  const markerOffsets = isMirror
    ? [fSigned, fSigned * 2]
    : [fAbs, fAbs * 2, -fAbs, -fAbs * 2];

  markerOffsets.forEach(offset => {
    const x = lensX + offset;
    if (x < 0 || x > W) return;
    ctx.save();
    ctx.strokeStyle = "rgba(139,148,158,0.4)";
    ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, midY - 10); ctx.lineTo(x, midY + 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = CLR_O.muted; ctx.font = "9px monospace"; ctx.textAlign = "center";
    ctx.fillText(Math.abs(offset) === fAbs ? "F" : "2F", x, midY + 20);
    ctx.restore();
  });

  ctx.restore();
}

// ─── Object arrow ─────────────────────────────────────────────────────────────
export function drawObject(ctx, objX, H, objHeight) {
  const midY = H / 2;
  const tipY = midY - objHeight;
  ctx.save();
  ctx.strokeStyle = CLR_O.object;
  ctx.fillStyle = CLR_O.object;
  ctx.shadowColor = CLR_O.object;
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(objX, midY); ctx.lineTo(objX, tipY); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(objX, tipY);
  ctx.lineTo(objX - 6, tipY + 10);
  ctx.lineTo(objX + 6, tipY + 10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = CLR_O.object; ctx.font = "10px monospace"; ctx.textAlign = "left";
  ctx.fillText("Object", objX + 8, tipY + 4);
  ctx.restore();
}

// ─── Image arrow ──────────────────────────────────────────────────────────────
export function drawImage(ctx, imgX, H, imgHeight, isReal, isVirtual, W = 800) {
  if (!isFinite(imgX) || !isFinite(imgHeight)) return;
  const midY = H / 2;
  const tipY = midY - imgHeight;

  // Off-screen detection
  const isOffLeft = imgX < 15;
  const isOffRight = imgX > W - 15;
  const isOffTop = tipY < 15;
  const isOffBottom = tipY > H - 15;
  const isOffScreen = isOffLeft || isOffRight || isOffTop || isOffBottom;

  if (isOffScreen) {
    ctx.save();
    const col = isVirtual ? "#39d353" : "#f47067";
    const dirIcon = isOffLeft ? "← " : isOffRight ? " →" : isOffTop ? "↑ " : "↓ ";
    const label = `${dirIcon}Off-Screen Image (${isVirtual ? "Virtual" : "Real"})${isOffRight ? dirIcon : ""}`;

    ctx.font = "bold 10px monospace";
    const textW = ctx.measureText(label).width;
    const px = textW + 14;
    const py = 22;

    const drawX = isOffLeft ? 10 : isOffRight ? W - px - 10 : Math.max(10, Math.min(W - px - 10, imgX - px / 2));
    const drawY = isOffTop ? 10 : isOffBottom ? H - py - 10 : Math.max(10, Math.min(H - py - 10, tipY - py / 2));

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, px, py, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, drawX + 7, drawY + py / 2);
    ctx.restore();

    // Guide stub line to canvas edge
    const clampedImgX = Math.max(8, Math.min(W - 8, imgX));
    const clampedTipY = Math.max(8, Math.min(H - 8, tipY));
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(clampedImgX, midY);
    ctx.lineTo(clampedImgX, clampedTipY);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const col = isVirtual ? "rgba(57,211,83,0.85)" : CLR_O.image;

  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.shadowColor = col; ctx.shadowBlur = 6;
  ctx.lineWidth = isVirtual ? 1.5 : 2.5;
  ctx.setLineDash(isVirtual ? [5, 4] : []);
  ctx.beginPath(); ctx.moveTo(imgX, midY); ctx.lineTo(imgX, tipY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  const dir = imgHeight >= 0 ? 1 : -1;
  ctx.moveTo(imgX, tipY);
  ctx.lineTo(imgX - 5, tipY + dir * 9);
  ctx.lineTo(imgX + 5, tipY + dir * 9);
  ctx.closePath(); ctx.fill();
  ctx.font = "10px monospace"; ctx.textAlign = imgX > W / 2 ? "left" : "right";
  const textOffset = imgX > W / 2 ? 8 : -8;
  ctx.fillText(isVirtual ? "Image (virtual)" : "Image (real)", imgX + textOffset, tipY + 4);
  ctx.restore();
}

// ─── Three principal rays (geometric intersection) ───────────────────────────
export function drawRays(ctx, W, H, type, lensX, focalPx, objX, objHeightPx, imgX, imgHeightPx, isReal) {
  const midY = H / 2;
  const objTipY = midY - objHeightPx;
  const hasImage = isFinite(imgX) && isFinite(imgHeightPx);
  const imgTipY = hasImage ? midY - imgHeightPx : midY;

  const isMirror = type.includes("mirror");
  const f = signedFocal(type, focalPx);

  ctx.save();
  ctx.lineWidth = 1.6;
  ctx.shadowBlur = 5;
  ctx.globalAlpha = 0.85;

  function seg(x1, y1, x2, y2, dashed = false) {
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    if (dashed) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.setLineDash([5, 4]);
    }
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (dashed) { ctx.setLineDash([]); ctx.restore(); }
  }

  function extendToX(x0, y0, x1, y1, targetX) {
    const p = pointAtX(x0, y0, x1, y1, targetX);
    return [p.x, p.y];
  }

  if (!isMirror) {
    const farF = lensX + f;
    const nearF = lensX - f;

    // R1 — parallel → through far focal point F₂
    ctx.strokeStyle = CLR_O.ray;
    seg(objX, objTipY, lensX, objTipY);
    if (hasImage && isReal) {
      const [ex, ey] = extendToX(lensX, objTipY, farF, midY, Math.min(W, imgX + 80));
      seg(lensX, objTipY, imgX, imgTipY);
      seg(imgX, imgTipY, ex, ey, true);
    } else if (hasImage) {
      const [ex, ey] = extendToX(lensX, objTipY, farF, midY, W);
      seg(lensX, objTipY, ex, ey);
      seg(lensX, objTipY, imgX, imgTipY, true);
    } else {
      const [ex, ey] = extendToX(lensX, objTipY, farF, midY, W);
      seg(lensX, objTipY, ex, ey);
    }

    // R2 — through optical centre (undeviated)
    ctx.strokeStyle = "#7dd3fc";
    if (hasImage && isReal) {
      const [ex, ey] = extendToX(objX, objTipY, imgX, imgTipY, Math.min(W, imgX + 80));
      seg(objX, objTipY, imgX, imgTipY);
      seg(imgX, imgTipY, ex, ey, true);
    } else if (hasImage) {
      const [ex, ey] = extendToX(objX, objTipY, lensX, midY, W);
      seg(objX, objTipY, ex, ey);
      seg(objX, objTipY, imgX, imgTipY, true);
    } else {
      const [ex, ey] = extendToX(objX, objTipY, lensX, midY, W);
      seg(objX, objTipY, ex, ey);
    }

    // R3 — through near focal point F₁ → exits parallel
    ctx.strokeStyle = "#a78bfa";
    const atLens = pointAtX(objX, objTipY, nearF, midY, lensX);
    if (hasImage && isReal) {
      seg(objX, objTipY, atLens.x, atLens.y);
      seg(atLens.x, atLens.y, imgX, imgTipY);
      seg(imgX, imgTipY, Math.min(W, imgX + 80), imgTipY, true);
    } else if (hasImage) {
      seg(objX, objTipY, atLens.x, atLens.y);
      seg(atLens.x, atLens.y, W, atLens.y);
      seg(atLens.x, atLens.y, imgX, imgTipY, true);
    } else {
      seg(objX, objTipY, atLens.x, atLens.y);
      seg(atLens.x, atLens.y, W, atLens.y);
    }

  } else {
    const focalPt = lensX + f;
    const centrePt = lensX + 2 * f;

    // R1 — parallel → reflects through focal point
    ctx.strokeStyle = CLR_O.ray;
    seg(objX, objTipY, lensX, objTipY);
    if (hasImage && isReal) {
      const [ex, ey] = extendToX(lensX, objTipY, imgX, imgTipY, Math.max(0, imgX - 80));
      seg(lensX, objTipY, imgX, imgTipY);
      seg(imgX, imgTipY, ex, ey, true);
    } else if (hasImage) {
      const edgeX = imgX > lensX ? 0 : W;
      const [ex, ey] = extendToX(imgX, imgTipY, lensX, objTipY, edgeX);
      seg(lensX, objTipY, ex, ey);
      seg(lensX, objTipY, imgX, imgTipY, true);
    } else {
      const [ex, ey] = extendToX(lensX, objTipY, focalPt, midY, focalPt < lensX ? 0 : W);
      seg(lensX, objTipY, ex, ey);
    }

    // R2 — through focal point → reflects parallel
    ctx.strokeStyle = "#7dd3fc";
    const hitR2 = pointAtX(objX, objTipY, focalPt, midY, lensX);
    if (hasImage && isReal) {
      seg(objX, objTipY, hitR2.x, hitR2.y);
      seg(hitR2.x, hitR2.y, imgX, imgTipY);
      seg(imgX, imgTipY, Math.max(0, imgX - 80), imgTipY, true);
    } else if (hasImage) {
      seg(objX, objTipY, hitR2.x, hitR2.y);
      const edgeX = imgX > lensX ? 0 : W;
      seg(hitR2.x, hitR2.y, edgeX, hitR2.y);
      seg(hitR2.x, hitR2.y, imgX, imgTipY, true);
    } else {
      seg(objX, objTipY, hitR2.x, hitR2.y);
      seg(hitR2.x, hitR2.y, 0, hitR2.y);
    }

    // R3 — toward centre of curvature → reflects back on itself
    ctx.strokeStyle = "#a78bfa";
    const hitR3 = pointAtX(objX, objTipY, centrePt, midY, lensX);
    if (hasImage && isReal) {
      seg(objX, objTipY, hitR3.x, hitR3.y);
      seg(hitR3.x, hitR3.y, imgX, imgTipY);
      const [ex, ey] = extendToX(hitR3.x, hitR3.y, imgX, imgTipY, Math.max(0, imgX - 80));
      seg(imgX, imgTipY, ex, ey, true);
    } else if (hasImage) {
      seg(objX, objTipY, hitR3.x, hitR3.y);
      const edgeX = imgX > lensX ? 0 : W;
      const [ex, ey] = extendToX(imgX, imgTipY, hitR3.x, hitR3.y, edgeX);
      seg(hitR3.x, hitR3.y, ex, ey);
      seg(hitR3.x, hitR3.y, imgX, imgTipY, true);
    } else {
      seg(objX, objTipY, hitR3.x, hitR3.y);
      const [ex, ey] = extendToX(hitR3.x, hitR3.y, centrePt, midY, centrePt < lensX ? 0 : W);
      seg(hitR3.x, hitR3.y, ex, ey);
    }
  }

  ctx.restore();
}

// ─── Telemetry overlay ────────────────────────────────────────────────────────
export function drawOpticsTelemetry(ctx, W, H, data) {
  const { u, v, f, m, h_o, h_i, power, scaleText, nature, pathType } = data;
  const items = [
    { label: "Object dist (u)", value: isFinite(u) ? `${u.toFixed(1)} px` : "∞" },
    { label: "Image dist (v)", value: isFinite(v) ? `${v > 0 ? "+" : ""}${v.toFixed(1)} px` : "∞" },
    { label: "Object height (Hₒ)", value: isFinite(h_o) ? `${h_o.toFixed(1)} px` : "—" },
    { label: "Image height (Hᵢ)", value: isFinite(h_i) ? `${h_i > 0 ? "+" : ""}${h_i.toFixed(1)} px` : "∞" },
    { label: "Focal length (f)", value: isFinite(f) ? `${f > 0 ? "+" : ""}${f.toFixed(1)} px` : "—" },
    { label: "Lens Power (P)", value: isFinite(power) ? `${power > 0 ? "+" : ""}${power.toFixed(2)} D` : "—" },
    { label: "Magnification (m)", value: isFinite(m) ? `${m > 0 ? "+" : ""}${m.toFixed(2)}` : "∞" },
    { label: "Image Scale", value: scaleText || "—" },
    { label: "Image Nature", value: nature || "—" },
    { label: "Ray Path", value: pathType || "—" },
  ];
  const cardW = 210, cardH = 19, pad = 10;
  const bx = W - cardW - 14, by = 14;
  const totalH = pad * 2 + 16 + items.length * cardH;

  ctx.save();
  ctx.fillStyle = "rgba(22,27,34,0.92)";
  ctx.strokeStyle = "#30363d"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx - pad, by - pad, cardW + pad * 2, totalH, 8);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#8b949e"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
  ctx.fillText("OPTICS TELEMETRY", bx, by + 4);

  items.forEach((item, i) => {
    const y = by + 20 + i * cardH;
    ctx.fillStyle = "#8b949e"; ctx.font = "10px monospace";
    ctx.fillText(item.label, bx, y);
    ctx.fillStyle = "#e6edf3"; ctx.font = "bold 11px monospace"; ctx.textAlign = "right";
    ctx.fillText(item.value, bx + cardW, y);
    ctx.textAlign = "left";
  });
  ctx.restore();
}

// ─── Human Eye ────────────────────────────────────────────────────────────────
export function drawEye(ctx, W, H) {
  const cx = W * 0.55, cy = H / 2;
  const rX = W * 0.22, rY = H * 0.32;

  ctx.save();

  // Sclera
  ctx.fillStyle = "rgba(240,246,252,0.06)";
  ctx.strokeStyle = CLR_O.eyeBody;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Vitreous humour shading (interior)
  ctx.fillStyle = "rgba(88,166,255,0.04)";
  ctx.beginPath();
  ctx.ellipse(cx + rX * 0.15, cy, rX * 0.55, rY * 0.75, 0, -Math.PI / 2.5, Math.PI / 2.5);
  ctx.lineTo(cx - rX * 0.1, cy + rY * 0.6);
  ctx.ellipse(cx - rX * 0.05, cy, rX * 0.5, rY * 0.7, 0, Math.PI / 2.5, -Math.PI / 2.5, true);
  ctx.closePath();
  ctx.fill();

  // Cornea bump on left side
  ctx.strokeStyle = CLR_O.eyeBody;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - rX, cy, rY * 0.35, -Math.PI / 2.5, Math.PI / 2.5);
  ctx.stroke();

  ctx.fillStyle = CLR_O.muted;
  ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText("Cornea", cx - rX - 4, cy - rY * 0.42);

  // Crystalline lens
  const lx = cx - rX * 0.25;
  ctx.strokeStyle = CLR_O.lens;
  ctx.fillStyle = "rgba(88,166,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(lx, cy, rX * 0.08, rY * 0.32, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = CLR_O.muted;
  ctx.fillText("Lens", lx, cy + rY * 0.42);

  // Retina (right inner wall)
  ctx.strokeStyle = CLR_O.retina;
  ctx.lineWidth = 3;
  ctx.shadowColor = CLR_O.retina;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, rX * 0.85, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = CLR_O.retina;
  ctx.fillText("Retina", cx + rX * 0.85 + 12, cy + 3);

  // Pupil
  ctx.fillStyle = CLR_O.pupil;
  ctx.strokeStyle = "#8b949e"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx - rX * 0.85, cy, rX * 0.06, rY * 0.2, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.restore();
}

// ─── Eye convergence physics (shared by draw + telemetry) ────────────────────
export function calcEyeConvergence(W, H, defect, correctionDiopter, corrActive, corrType) {
  const cx = W * 0.55;
  const rX = W * 0.22;
  const retinaX = cx + rX * 0.72;

  const myopiaBase = retinaX - rX * 0.35;
  const hyperBase = retinaX + rX * 0.42;
  const shiftPerD = rX * 0.055;

  let convergeX;
  if (defect === "myopia") {
    const base = myopiaBase;
    if (corrActive) {
      convergeX = corrType === "concave"
        ? base + correctionDiopter * shiftPerD
        : base - correctionDiopter * shiftPerD * 0.6;
    } else {
      convergeX = base;
    }
  } else {
    const base = hyperBase;
    if (corrActive) {
      convergeX = corrType === "convex"
        ? base - correctionDiopter * shiftPerD
        : base + correctionDiopter * shiftPerD * 0.6;
    } else {
      convergeX = base;
    }
  }

  const onRetina = Math.abs(convergeX - retinaX) < rX * 0.045;
  return { convergeX, retinaX, onRetina, cx, rX, cy: H / 2, rY: H * 0.32 };
}

// ─── Light rays for eye modes (two-stage: correction lens → eye lens → focus) ──
export function drawEyeRays(ctx, W, H, defect, correctionDiopter, corrActive, corrType) {
  const { convergeX, retinaX, onRetina, cx, rX, cy, rY } =
    calcEyeConvergence(W, H, defect, correctionDiopter, corrActive, corrType);

  const corrLensX = W * 0.08;
  const corneaX = cx - rX;
  const eyeLensX = cx - rX * 0.25;
  const entryX = 0;

  // Angular deflection at correction lens (radians per diopter, scaled visually)
  const deflectPerD = 0.012;
  const corrDeflect = corrActive
    ? (corrType === "concave" ? 1 : -1) * correctionDiopter * deflectPerD
    : 0;

  const offsets = [-rY * 0.28, -rY * 0.12, 0, rY * 0.12, rY * 0.28];

  ctx.save();
  offsets.forEach(offset => {
    const startY = cy + offset;

    // Stage 1: parallel incoming ray to correction lens
    const atCorrY = startY;

    // Stage 2: after correction lens — diverge (concave) or converge (convex)
    const afterCorrSlope = corrDeflect;
    const atCorneaY = atCorrY + afterCorrSlope * (corneaX - corrLensX);

    // Stage 3: eye lens bends toward focal point
    const eyeBend = (cy - atCorneaY) * 0.35;
    const atEyeLensY = atCorneaY + eyeBend * ((eyeLensX - corneaX) / (convergeX - corneaX || 1));

    ctx.strokeStyle = onRetina ? CLR_O.neon : CLR_O.ray;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = onRetina ? 0.9 : 0.65;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = onRetina ? 6 : 3;

    ctx.beginPath();
    ctx.moveTo(entryX, startY);
    if (corrActive) {
      ctx.lineTo(corrLensX, atCorrY);
      ctx.lineTo(corneaX, atCorneaY);
    } else {
      ctx.lineTo(corneaX, startY);
    }
    ctx.lineTo(eyeLensX, atEyeLensY);
    ctx.lineTo(convergeX, cy);
    ctx.stroke();

    if (!onRetina) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.setLineDash([4, 4]);
      const prevX = eyeLensX;
      const prevY = atEyeLensY;
      const dx = convergeX - prevX;
      const dy = cy - prevY;
      const extScale = 70 / (Math.sqrt(dx * dx + dy * dy) || 1);
      ctx.beginPath();
      ctx.moveTo(convergeX, cy);
      ctx.lineTo(convergeX + dx * extScale, cy + dy * extScale);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // Focal point dot
  ctx.save();
  ctx.fillStyle = onRetina ? CLR_O.neon : CLR_O.warn;
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(convergeX, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  return { onRetina };
}

// ─── Correction lens overlay on eye ──────────────────────────────────────────
export function drawCorrectionLens(ctx, W, H, type, diopter) {
  if (!type) return;
  const entryX = W * 0.08;
  const cy = H / 2;
  const lH = H * 0.45;
  const isConcave = type === "concave";
  ctx.save();
  ctx.strokeStyle = CLR_O.corrLens;
  ctx.fillStyle = "rgba(86,211,100,0.06)";
  ctx.lineWidth = 2;
  ctx.shadowColor = CLR_O.corrLens;
  ctx.shadowBlur = 8;
  if (isConcave) {
    const w = 8;
    const innerW = 2;
    ctx.beginPath();
    ctx.moveTo(entryX - w, cy - lH / 2);
    ctx.lineTo(entryX + w, cy - lH / 2);
    ctx.bezierCurveTo(entryX + innerW, cy - lH / 4, entryX + innerW, cy + lH / 4, entryX + w, cy + lH / 2);
    ctx.lineTo(entryX - w, cy + lH / 2);
    ctx.bezierCurveTo(entryX - innerW, cy + lH / 4, entryX - innerW, cy - lH / 4, entryX - w, cy - lH / 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else {
    const bulge = 14;
    ctx.beginPath();
    ctx.moveTo(entryX, cy - lH / 2);
    ctx.bezierCurveTo(entryX + bulge, cy - lH / 4, entryX + bulge, cy + lH / 4, entryX, cy + lH / 2);
    ctx.bezierCurveTo(entryX - bulge, cy + lH / 4, entryX - bulge, cy - lH / 4, entryX, cy - lH / 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = CLR_O.corrLens;
  ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText(`${isConcave ? "−" : "+"}${diopter.toFixed(1)} D`, entryX, cy + lH / 2 + 16);
  ctx.restore();
}

// ─── Reflection & Refraction drawing ──────────────────────────────────────────
export function drawReflectRefract(ctx, W, H, { n1, n2, thetaI, showProtractor }) {
  const cx = W / 2;
  const cy = H / 2;

  // Helper to determine medium colors
  function getMediumColor(n) {
    if (n <= 1.02) return "transparent";
    if (n < 1.4) return "rgba(88,166,255,0.08)"; // Light blue/cyan for water-like
    return "rgba(227,179,65,0.07)"; // Warm amber for glass-like/higher indices
  }

  // 1. Draw media backgrounds
  const col1 = getMediumColor(n1);
  if (col1 !== "transparent") {
    ctx.fillStyle = col1;
    ctx.fillRect(0, 0, W, cy);
  }

  const col2 = getMediumColor(n2);
  if (col2 !== "transparent") {
    ctx.fillStyle = col2;
    ctx.fillRect(0, cy, W, H - cy);
  }

  // 2. Draw boundary line
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(W, cy);
  ctx.stroke();

  // 3. Draw normal line (vertical dashed line)
  ctx.strokeStyle = "rgba(139,148,158,0.4)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels for Normal
  ctx.fillStyle = "#8b949e";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Normal", cx, 14);
  ctx.fillText("Normal", cx, H - 8);

  // Labels for media
  ctx.textAlign = "left";
  ctx.fillStyle = "#8b949e";
  ctx.fillText(`Medium 1 (n₁ = ${n1.toFixed(2)})`, 16, 22);
  ctx.fillText(`Medium 2 (n₂ = ${n2.toFixed(2)})`, 16, H - 16);

  // 4. Protractor overlay
  if (showProtractor) {
    const protR = 140;
    ctx.strokeStyle = "rgba(139,148,158,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, protR, 0, Math.PI * 2);
    ctx.stroke();

    for (let deg = 0; deg < 360; deg += 10) {
      const rad = deg * Math.PI / 180;
      const xStart = cx + protR * Math.cos(rad);
      const yStart = cy + protR * Math.sin(rad);
      const tickL = deg % 90 === 0 ? 10 : deg % 30 === 0 ? 7 : 4;
      const xEnd = cx + (protR - tickL) * Math.cos(rad);
      const yEnd = cy + (protR - tickL) * Math.sin(rad);

      ctx.strokeStyle = "rgba(139,148,158,0.22)";
      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();

      if (deg % 30 === 0) {
        let relAngle = 0;
        if (deg <= 180) {
          relAngle = Math.abs(deg - 90);
        } else {
          relAngle = Math.abs(deg - 270);
        }
        if (relAngle <= 90) {
          const textR = protR - 18;
          const lx = cx + textR * Math.cos(rad);
          const ly = cy + textR * Math.sin(rad);
          ctx.fillStyle = "rgba(139,148,158,0.32)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${relAngle}°`, lx, ly);
        }
      }
    }
    ctx.textBaseline = "alphabetic";
  }

  // 5. Laser source position and drawing
  const laserDist = 180;
  const thetaI_rad = thetaI * Math.PI / 180;
  const sourceAngleRad = 1.5 * Math.PI - thetaI_rad;
  const sourceX = cx + laserDist * Math.cos(sourceAngleRad);
  const sourceY = cy + laserDist * Math.sin(sourceAngleRad);

  // Draw laser housing
  ctx.save();
  ctx.translate(sourceX, sourceY);
  ctx.rotate(sourceAngleRad + Math.PI);
  ctx.fillStyle = "#21262d";
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-24, -8, 24, 16, [4, 0, 0, 4]);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f47067"; // Nozzle
  ctx.fillRect(0, -5, 4, 10);
  ctx.restore();

  // 6. Draw Incident Ray
  ctx.save();
  ctx.strokeStyle = CLR_O.ray;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = CLR_O.ray;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(sourceX, sourceY);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.restore();

  // 7. Snell's Law and Fresnel Coefficients
  const sinT = (n1 * Math.sin(thetaI_rad)) / n2;
  const tir = sinT > 1;
  let R = 1.0;
  let T = 0.0;
  let thetaT_rad = 0;

  if (!tir) {
    thetaT_rad = Math.asin(sinT);
    const cosI = Math.cos(thetaI_rad);
    const cosT = Math.cos(thetaT_rad);
    const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
    const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
    R = (rs * rs + rp * rp) / 2;
    T = 1 - R;
  }

  // 8. Draw Reflected Ray
  const reflectAngleRad = 1.5 * Math.PI + thetaI_rad;
  const reflectEndX = cx + laserDist * Math.cos(reflectAngleRad);
  const reflectEndY = cy + laserDist * Math.sin(reflectAngleRad);

  ctx.save();
  ctx.strokeStyle = CLR_O.ray;
  ctx.lineWidth = 2.0;
  ctx.globalAlpha = 0.15 + 0.85 * R;
  ctx.shadowColor = CLR_O.ray;
  ctx.shadowBlur = 4 * R;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(reflectEndX, reflectEndY);
  ctx.stroke();
  ctx.restore();

  // 9. Draw Refracted Ray
  if (!tir) {
    const refractAngleRad = 0.5 * Math.PI + thetaT_rad;
    const refractEndX = cx + laserDist * Math.cos(refractAngleRad);
    const refractEndY = cy + laserDist * Math.sin(refractAngleRad);

    ctx.save();
    ctx.strokeStyle = CLR_O.ray;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = T;
    ctx.shadowColor = CLR_O.ray;
    ctx.shadowBlur = 6 * T;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(refractEndX, refractEndY);
    ctx.stroke();
    ctx.restore();
  } else {
    // Total Internal Reflection Warning Badge
    ctx.save();
    ctx.fillStyle = "rgba(244,112,103,0.85)";
    ctx.strokeStyle = "#f47067";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 100, H - 38, 200, 24, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TOTAL INTERNAL REFLECTION", W / 2, H - 23);
    ctx.restore();
  }
}
