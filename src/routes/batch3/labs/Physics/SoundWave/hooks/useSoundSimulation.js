import { useRef, useState, useEffect, useCallback } from "react";
import {
  DT, PARTICLE_COLS, MEDIUM_PRESETS, BOUNDARY, MISSION,
  DEFAULT_FREQ, DEFAULT_AMP, DEFAULT_PHASE_DEG, DEFAULT_TEMP_C,
  computeSpeedOfSound,
} from "../constants/soundConstants";
import {
  clearCanvas, drawDotGrid, drawTankBorder, drawSpeaker,
  drawWall, drawParticles, drawWaveGraph, drawGraphLabels,
} from "../utils/soundDrawing";

// ─── Layout helpers (computed once per resize) ────────────────────────────────
function getLayout(W, H) {
  const tankTop   = Math.max(54, H * 0.14);
  const tankH     = Math.max(150, H * 0.75 - tankTop);
  const tankLeft  = W * 0.06;
  const tankW     = W * 0.88;
  const wallX     = tankLeft + tankW - 14;
  const pistonX   = tankLeft;
  const gTop      = tankTop + tankH + 16;
  const gLeft     = tankLeft;
  const gW        = tankW;
  const gH        = Math.max(70, H - gTop - 12);
  const midY      = tankTop + tankH / 2;
  return { tankTop, tankH, tankLeft, tankW, wallX, pistonX, gTop, gLeft, gW, gH, midY };
}

// ─── Core wave math ───────────────────────────────────────────────────────────
/**
 * y(x_norm, t) = A * sin(2π * f * (t - x_norm / v_norm) + φ)
 * where x_norm is col/PARTICLE_COLS (0→1) and v_norm is a scaled speed so
 * the wave pattern is visible inside the tank regardless of actual m/s value.
 *
 * For Rigid boundary: add reflected wave with 180° phase shift travelling left.
 */
function computeDisplacement(col, t, A, f, phaseRad, vNorm, isRigid) {
  const x = col / PARTICLE_COLS;
  // Forward wave
  const fwd = A * Math.sin(2 * Math.PI * f * (t - x / vNorm) + phaseRad);
  if (!isRigid) return fwd;
  // Reflected wave: travels from wall (x=1) back leftward, inverted phase
  const reflected = -A * Math.sin(2 * Math.PI * f * (t + x / vNorm) + phaseRad);
  return fwd + reflected;
}

// ─── Resonance match score ────────────────────────────────────────────────────
function matchScore(userArr, targetArr) {
  let sum = 0;
  for (let i = 0; i < userArr.length; i++) {
    const diff = userArr[i] - targetArr[i];
    sum += diff * diff;
  }
  const rms = Math.sqrt(sum / userArr.length);
  return Math.max(0, 1 - rms / 0.25); // 0-1, 1 = perfect match within 0.25 tolerance
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSoundSimulation({ tankCanvasRef, graphCanvasRef, canvasSize }) {
  // ── RAF refs ─────────────────────────────────────────────────────────────
  const rafRef      = useRef(null);

  // ── Simulation clock ──────────────────────────────────────────────────────
  const tRef        = useRef(0);

  // ── Control refs (written by React state, read inside RAF) ────────────────
  const freqRef     = useRef(DEFAULT_FREQ);
  const ampRef      = useRef(DEFAULT_AMP);
  const phaseRef    = useRef(0);                     // radians
  const mediumRef   = useRef("gas");
  const tempRef     = useRef(DEFAULT_TEMP_C);        // °C
  const boundaryRef = useRef(BOUNDARY.ABSORB);
  const missionRef  = useRef(MISSION.FREE);
  const runningRef  = useRef(false);

  // ── Per-frame arrays (Float32Array avoids GC pressure) ────────────────────
  const dispArrRef    = useRef(new Float32Array(PARTICLE_COLS)); // user wave displacement
  const noiseArrRef   = useRef(new Float32Array(PARTICLE_COLS)); // Mode 2 noise wave
  const targetArrRef  = useRef(null);                           // Mode 1 target silhouette

  // ── Resonance match tracking ──────────────────────────────────────────────
  const matchRef = useRef({ score: 0, lockTime: 0, won: false });

  // ── Cancel mode tracking ──────────────────────────────────────────────────
  const cancelRef = useRef({ rms: 1, won: false });

  // ── Telemetry (React state, updated ~10fps) ───────────────────────────────
  const [telemetry, setTelemetry] = useState({
    running:    false,
    wavelength: 0,
    v:          343,
    tempC:      DEFAULT_TEMP_C,
    mission:    MISSION.FREE,
    matchPct:   0,
    matchWon:   false,
    cancelRms:  1,
    cancelWon:  false,
  });

  const sizeRef = useRef(canvasSize);
  useEffect(() => { sizeRef.current = canvasSize; }, [canvasSize]);

  // ─── Build target silhouette for Mode 1 ──────────────────────────────────
  const buildTarget = useCallback(() => {
    // Target: fixed f=4Hz, A=0.75, phase=0, absorbing boundary
    const arr = new Float32Array(PARTICLE_COLS);
    for (let i = 0; i < PARTICLE_COLS; i++) {
      arr[i] = 0.75 * Math.sin(2 * Math.PI * 4 * (-i / PARTICLE_COLS / 0.6));
    }
    targetArrRef.current = arr;
  }, []);

  // ─── Build noise wave for Mode 2 ─────────────────────────────────────────
  const buildNoise = useCallback((t) => {
    const arr = noiseArrRef.current;
    for (let i = 0; i < PARTICLE_COLS; i++) {
      // Noise travels right-to-left: x inverted
      const x = (PARTICLE_COLS - 1 - i) / PARTICLE_COLS;
      arr[i] = 0.7 * Math.sin(2 * Math.PI * 2.5 * (t - x / 0.5));
    }
  }, []);

  // ─── Main draw frame ──────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const tc = tankCanvasRef.current;
    const gc = graphCanvasRef.current;
    if (!tc || !gc) return;

    const W  = tc.width;
    const H  = tc.height;
    const gW = gc.width;
    const gH = gc.height;
    const lay = getLayout(W, H);
    const t   = tRef.current;

    const A        = ampRef.current;
    const f        = freqRef.current;
    const phRad    = phaseRef.current;
    const isRigid  = boundaryRef.current === BOUNDARY.RIGID;
    const medium   = MEDIUM_PRESETS[mediumRef.current];
    // Actual speed of sound adjusted for temperature
    const actualV  = computeSpeedOfSound(mediumRef.current, tempRef.current);
    // v_norm: scale speed to keep wave pattern visible regardless of actual m/s
    // We map gas→0.6, liquid→1.2, solid→2.8 in normalised units, then bias by temp ratio
    const vNormBase = { gas: 0.6, liquid: 1.2, solid: 2.8 };
    const vBase     = vNormBase[mediumRef.current] || 0.6;
    const vNorm     = vBase * (actualV / medium.vRef);
    const mission  = missionRef.current;
    const isDark   = false;

    // ── Compute displacement array ──────────────────────────────────────────
    const disp = dispArrRef.current;
    for (let i = 0; i < PARTICLE_COLS; i++) {
      disp[i] = computeDisplacement(i, t, A, f, phRad, vNorm, isRigid);
    }

    // ── Mode 2: compute noise and combined displacement ─────────────────────
    let noiseArr = null;
    if (mission === MISSION.CANCEL) {
      buildNoise(t);
      noiseArr = noiseArrRef.current;
      // Combined = user + noise (destructive cancels → 0)
      const combined = new Float32Array(PARTICLE_COLS);
      for (let i = 0; i < PARTICLE_COLS; i++) combined[i] = disp[i] + noiseArr[i];
      cancelRef.current.rms = Math.sqrt(combined.reduce((s, v) => s + v * v, 0) / PARTICLE_COLS);
      if (cancelRef.current.rms < 0.04 && !cancelRef.current.won) {
        cancelRef.current.won = true;
      }
      // Render combined displacement as visible particle motion
      for (let i = 0; i < PARTICLE_COLS; i++) disp[i] = combined[i];
    }

    // ── Mode 1: resonance scoring ────────────────────────────────────────────
    let matchScore_ = 0;
    if (mission === MISSION.RESONANCE && targetArrRef.current) {
      matchScore_ = matchScore(disp, targetArrRef.current);
      if (matchScore_ > 0.92) {
        matchRef.current.lockTime += DT;
        if (matchRef.current.lockTime >= 3 && !matchRef.current.won)
          matchRef.current.won = true;
      } else {
        matchRef.current.lockTime = 0;
      }
      matchRef.current.score = matchScore_;
    }

    // ─── Tank canvas ─────────────────────────────────────────────────────────
    const ctx = tc.getContext("2d");
    clearCanvas(ctx, W, H, isDark);
    drawDotGrid(ctx, W, H);
    drawTankBorder(ctx, lay.tankLeft, lay.tankTop, lay.tankW, lay.tankH);
    drawSpeaker(ctx, H, lay.tankTop, lay.tankH, lay.pistonX, A, t);
    drawWall(ctx, lay.wallX, lay.tankTop, lay.tankH, isRigid);
    drawParticles(ctx, lay.tankLeft, lay.tankTop, lay.tankW, lay.tankH, disp);

    // ─── Graph canvas ─────────────────────────────────────────────────────────
    const gctx = gc.getContext("2d");
    clearCanvas(gctx, gW, gH, false);
    const wavelength = actualV / f;
    drawWaveGraph(
      gctx, 0, 0, gW, gH,
      disp,
      mission === MISSION.RESONANCE ? targetArrRef.current : null,
      mission === MISSION.CANCEL    ? noiseArrRef.current  : null,
    );
    drawGraphLabels(gctx, 0, 0, gW, gH, wavelength, actualV, f);
  }, [tankCanvasRef, graphCanvasRef, buildNoise]);

  // ─── RAF loop ─────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    if (!runningRef.current) return;
    tRef.current += DT;
    drawFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  // ─── Idle loop (always runs for static redraws on param changes) ──────────
  const idleLoopRef  = useRef(null);
  const idleRafRef   = useRef(null);

  const idleLoop = useCallback(() => {
    if (runningRef.current) return;
    drawFrame();
    idleRafRef.current = requestAnimationFrame(idleLoop);
  }, [drawFrame]);

  useEffect(() => { idleLoopRef.current = idleLoop; }, [idleLoop]);

  useEffect(() => {
    idleRafRef.current = requestAnimationFrame(idleLoop);
    return () => {
      if (rafRef.current)     cancelAnimationFrame(rafRef.current);
      if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    };
  }, [idleLoop]);

  // Redraw on canvas resize
  useEffect(() => { drawFrame(); }, [drawFrame, canvasSize]);

  const updateTelemetryNow = useCallback(() => {
    const f         = freqRef.current;
    const tempC     = tempRef.current;
    const mediumKey = mediumRef.current;
    const boundary  = boundaryRef.current;
    const v         = computeSpeedOfSound(mediumKey, tempC);
    const wl        = f > 0 ? (v / f) : 0;
    const totalSpatialSpanMeters = Math.max(1, f * 1.5) * wl;

    const period = f > 0 ? (1 / f) : 0;
    const omega  = 2 * Math.PI * f;
    const k      = wl > 0 ? (2 * Math.PI / wl) : 0;
    const nodes  = wl > 0 ? Math.floor((2 * totalSpatialSpanMeters) / wl) : 0;

    const isRigid = boundary === BOUNDARY.RIGID;
    const tEcho   = (isRigid && v > 0) ? ((2 * totalSpatialSpanMeters) / v) : null;

    const densities = { gas: 1.2, liquid: 1000, solid: 7870 };
    const density   = densities[mediumKey] || 1.2;

    setTelemetry(p => ({
      ...p,
      running:      runningRef.current,
      wavelength:   wl,
      v,
      freq:         f,
      period,
      omega,
      k,
      nodes,
      totalSpatialSpanMeters,
      tempC,
      mediumKey,
      density,
      boundary,
      tEcho,
      mission:      missionRef.current,
      matchPct:     Math.round(matchRef.current.score * 100),
      matchWon:     matchRef.current.won,
      cancelRms:    cancelRef.current.rms,
      cancelWon:    cancelRef.current.won,
    }));
  }, []);

  // ─── Telemetry poll ──────────────────────────────────────────────────────
  useEffect(() => {
    updateTelemetryNow();
    const id = setInterval(() => {
      updateTelemetryNow();
    }, 100);
    return () => clearInterval(id);
  }, [updateTelemetryNow]);

  // ─── Public handlers & ref-setters ───────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (runningRef.current) return;
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
    setTelemetry(p => ({ ...p, running: true }));
  }, [loop]);

  const handlePause = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
    setTelemetry(p => ({ ...p, running: false }));
  }, []);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    tRef.current = 0;
    matchRef.current  = { score: 0, lockTime: 0, won: false };
    cancelRef.current = { rms: 1, won: false };
    setTelemetry(p => ({
      ...p, running: false, matchPct: 0, matchWon: false,
      cancelRms: 1, cancelWon: false,
    }));
    idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
    updateTelemetryNow();
  }, [updateTelemetryNow]);

  // Ref-setters — update ref immediately, RAF picks it up next frame
  const syncFreq     = useCallback((v) => { freqRef.current     = v;                 updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncAmp      = useCallback((v) => { ampRef.current      = v;                 updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncPhase    = useCallback((v) => { phaseRef.current    = v * Math.PI / 180; updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncMedium   = useCallback((v) => { mediumRef.current   = v;                 updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncTemp     = useCallback((v) => { tempRef.current     = v;                 updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncBoundary = useCallback((v) => { boundaryRef.current = v;                 updateTelemetryNow(); }, [updateTelemetryNow]);
  const syncMission  = useCallback((v) => {
    missionRef.current = v;
    matchRef.current   = { score: 0, lockTime: 0, won: false };
    cancelRef.current  = { rms: 1, won: false };
    if (v === MISSION.RESONANCE) buildTarget();
    updateTelemetryNow();
  }, [buildTarget, updateTelemetryNow]);

  return {
    telemetry,
    MISSION,
    BOUNDARY,
    MEDIUM_PRESETS,
    handlePlay,
    handlePause,
    handleReset,
    syncFreq,
    syncAmp,
    syncPhase,
    syncMedium,
    syncTemp,
    syncBoundary,
    syncMission,
  };
}
