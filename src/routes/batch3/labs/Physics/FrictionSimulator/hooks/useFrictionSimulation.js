import { useRef, useState, useEffect, useCallback } from "react";
import { G, DT, BLOCK_SIZE, CLR } from "../constants/frictionConstants";
import {
  getRampGeometry, blockCentre,
  clearCanvas, drawDotGrid, drawGroundLine, drawRamp,
  drawAngleArc, drawBlock, drawForceVectors,
  drawSlipAngleLine, drawFrictionUtilBar, drawForceReadout,
} from "../utils/frictionDrawing";

// ─── Simulation state machine ─────────────────────────────────────────────────
// "idle"    → not started, block sits at top
// "static"  → running, but gravity < static friction limit → no movement
// "kinetic" → running, block is sliding down
// "done"    → block reached the bottom
const STATES = { IDLE: "idle", STATIC: "static", KINETIC: "kinetic", DONE: "done" };

export function useFrictionSimulation({ canvasRef, canvasSize }) {
  // ── Mutable sim refs (never trigger re-renders, read inside RAF) ───────────
  const rafRef       = useRef(null);
  const idleRafRef   = useRef(null);
  const idleLoopRef  = useRef(null);

  // Physics state
  const simRef = useRef({
    d:        0,     // distance travelled from top of ramp (metres)
    v:        0,     // velocity along ramp (m/s)
    a:        0,     // acceleration (m/s²)
    t:        0,     // elapsed time (s)
    maxSpeed: 0,     // peak speed recorded this run
    state:    STATES.IDLE,
  });

  // Mirror of control inputs (written by React state effects, read by RAF)
  const angleRef    = useRef(30);
  const muSRef      = useRef(0.50);
  const muKRef      = useRef(0.30);
  const massRef     = useRef(5);
  const rampLenRef  = useRef(0.75);  // fraction of canvas min(W,H)
  const showVecRef  = useRef(true);
  const showGridRef = useRef(true);
  const sizeRef     = useRef(canvasSize);

  // Keep refs in sync
  useEffect(() => { sizeRef.current = canvasSize; }, [canvasSize]);

  // ── React UI state (updated ~10 fps via interval) ─────────────────────────
  const [telemetry, setTelemetry] = useState({
    state:          STATES.IDLE,
    speed:          0,
    maxSpeed:       0,
    acceleration:   0,
    elapsed:        0,
    distance:       0,
    fGravity:       0,
    fNormal:        0,
    fFriction:      0,
    fNet:           0,     // net force along slope (N)
    frictionRatio:  0,
    kineticEnergy:  0,     // ½mv² (J)
    workByGravity:  0,     // mg·sin(θ)·d (J)
    workByFriction: 0,     // µk·mg·cos(θ)·d (J) — energy lost to heat
    frictionHeat:   0,     // same as workByFriction, renamed for clarity
  });

  // ── Canvas resize seed ────────────────────────────────────────────────────
  useEffect(() => { sizeRef.current = canvasSize; }, [canvasSize]);

  // ─── Core physics tick ────────────────────────────────────────────────────
  /**
   * Computes forces for the current angle/friction/mass and advances the
   * sim state by one DT step.  Returns the computed forces for drawing.
   */
  const physicsStep = useCallback(() => {
    const s    = simRef.current;
    const tRad = (angleRef.current * Math.PI) / 180;
    const m    = massRef.current;
    const muS  = muSRef.current;
    const muK  = muKRef.current;

    const fNormal   = m * G * Math.cos(tRad);
    const fParallel = m * G * Math.sin(tRad);   // gravity component down-slope
    const fStaticLim = muS * fNormal;

    let fFriction = 0;
    let accel     = 0;

    if (s.state === STATES.STATIC) {
      if (fParallel > fStaticLim) {
        // Overcome static friction → switch to kinetic
        s.state   = STATES.KINETIC;
        fFriction = muK * fNormal;
        accel     = (fParallel - fFriction) / m;
      } else {
        // Held by static friction
        fFriction = fParallel;   // static friction exactly balances gravity component
        accel     = 0;
      }
    } else if (s.state === STATES.KINETIC) {
      fFriction = muK * fNormal;
      accel     = (fParallel - fFriction) / m;
      if (accel < 0) accel = 0;  // can't decelerate past zero with pure gravity sim
    }

    s.a = accel;

    if (s.state === STATES.KINETIC && accel > 0) {
      // ── Velocity Verlet integration for constant acceleration ─────────────
      // Eliminates explicit Euler integration error and lag:
      // d(t + dt) = d(t) + v(t)*dt + 0.5*a*dt²
      // v(t + dt) = v(t) + a*dt
      s.d += s.v * DT + 0.5 * accel * DT * DT;
      s.v += accel * DT;
      s.t += DT;

      if (s.v > s.maxSpeed) s.maxSpeed = s.v;
    }

    return {
      fGravity:      m * G,
      fNormal,
      fFriction,
      frictionRatio: fStaticLim > 0 ? fParallel / fStaticLim : 0,
    };
  }, []);

  // ─── Full canvas redraw ───────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;

    clearCanvas(ctx, W, H);

    const frac   = rampLenRef.current;
    const deg    = angleRef.current;
    const rad0   = (deg * Math.PI) / 180;

    // ── 1. Compute raw geometry at natural origin (0,0) ───────────────────────
    // We treat the ramp origin as (0,0) in scene-space, then offset to center.
    const rampLen  = Math.min(W, H) * frac;
    const cosA     = Math.cos(rad0);
    const sinA     = Math.sin(rad0);

    // Canvas-pixel margin reserved on every side.
    const PAD_PX = 32;

    // Key scene-space points for current ramp length
    const tipX  =  rampLen * cosA;
    const tipY  = -rampLen * sinA;
    const baseX =  tipX;
    const baseY =  0;

    // ── 2. Stable reference bounds (set to maximum slider capacity 1.50) ─
    // Using max capacity 1.50 guarantees that even when ramp length is maxed out, it stays 100% inside the canvas.
    const MAX_RAMP_FRACTION = 1.50;
    const refRampLen        = Math.min(W, H) * MAX_RAMP_FRACTION;
    const refTipX           = refRampLen * cosA;
    const refTipY           = -refRampLen * sinA;
    const roughScale        = Math.min((W - PAD_PX * 2) / (refTipX + 50), (H - PAD_PX * 2) / (Math.abs(refTipY) + 50), 2.2);
    const vecPad            = 60 / Math.max(0.5, roughScale);

    // ── 3. Stable scene bounding box for maximum ramp capacity ─────────────────
    const sceneLeft   = Math.min(-vecPad, -BLOCK_SIZE - vecPad);
    const sceneRight  = Math.max(refTipX, 40) + vecPad;
    const sceneTop    = refTipY - BLOCK_SIZE - vecPad;
    const sceneBottom = Math.max(vecPad * 0.4, 45);

    const sceneW = sceneRight - sceneLeft;
    const sceneH = sceneBottom - sceneTop;

    // ── 4. Fixed scale — fits maximum ramp capacity cleanly inside canvas bounds ──
    const scaleX    = (W - PAD_PX * 2) / sceneW;
    const scaleY    = (H - PAD_PX * 2) / sceneH;
    const autoScale = Math.min(scaleX, scaleY, 2.0);

    // ── 5. Center the scaled scene in the canvas ──────────────────────────────
    const scaledW = sceneW * autoScale;
    const scaledH = sceneH * autoScale;
    const centerX = (W - scaledW) / 2 - sceneLeft * autoScale;
    const centerY = (H - scaledH) / 2 - sceneTop  * autoScale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(autoScale, autoScale);

    // ── 4. Build geometry relative to scene origin (0,0) ─────────────────────
    const origin = { x: 0,    y: 0    };
    const tip    = { x: tipX, y: tipY };
    const base   = { x: baseX, y: baseY };

    // ── 5. Draw everything in scene-space ─────────────────────────────────────
    if (showGridRef.current) drawDotGrid(ctx, W, H);

    // Ground line — spans the full visible scene width
    const gW = sceneRight + vecPad;
    drawGroundLine(ctx, sceneLeft - vecPad, gW, 0);

    drawRamp(ctx, origin, tip, base);
    drawAngleArc(ctx, origin, rad0, deg, autoScale);

    // Slip angle guide — drawn AFTER the ramp so it is never hidden by the filled triangle.
    // Use gW * 1.1 so the line just extends past the ramp's right edge without going too far.
    const slipDeg = (Math.atan(muSRef.current) * 180) / Math.PI;
    drawSlipAngleLine(ctx, origin, gW * 1.1, slipDeg, deg, autoScale);

    const s              = simRef.current;
    const pixelsPerMetre = rampLen / 10;
    const dPx            = s.d * pixelsPerMetre;
    const { x: cx, y: cy } = blockCentre(tip, cosA, sinA, rampLen, dPx);

    const m          = massRef.current;
    const muS        = muSRef.current;
    const muK        = muKRef.current;
    const fNormal    = m * G * Math.cos(rad0);
    const fParallel  = m * G * Math.sin(rad0);
    const fStaticLim = muS * fNormal;
    let   fFriction  = 0;
    if (s.state === STATES.STATIC || s.state === STATES.IDLE) {
      fFriction = Math.min(fParallel, fStaticLim);
    } else if (s.state === STATES.KINETIC) {
      fFriction = muK * fNormal;
    }

    const forces = {
      fGravity:  m * G,
      fNormal,
      fFriction,
      frictionRatio: fStaticLim > 0 ? fParallel / fStaticLim : 0,
    };

    drawForceVectors(ctx, cx, cy, rad0, cosA, sinA, forces, showVecRef.current, autoScale);
    drawBlock(ctx, cx, cy, rad0, s.state === STATES.KINETIC);

    ctx.restore();

    // ── 6. Fixed overlays — drawn AFTER restore so they ignore scale/translate ─
    drawFrictionUtilBar(ctx, W, H, forces.frictionRatio);
    drawForceReadout(ctx, W, H, forces, deg, s.state);

    if (autoScale < 0.68) {
      ctx.save();
      ctx.font      = "bold 10px monospace";
      ctx.fillStyle = CLR.muted;
      ctx.textAlign = "left";
      ctx.fillText(`zoom: ${Math.round(autoScale * 100)}%`, 10, H - 8);
      ctx.restore();
    }
  }, [canvasRef]);

  // ─── RAF physics + draw loop (runs while sim is active) ──────────────────
  const loop = useCallback(() => {
    const s = simRef.current;
    if (s.state !== STATES.STATIC && s.state !== STATES.KINETIC) return;

    // Get ramp length to check stopping condition
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W   = canvas.width;
    const H   = canvas.height;
    const geo = getRampGeometry(W, H, angleRef.current, rampLenRef.current);
    const pixelsPerMetre = geo.rampLen / 10;
    const maxD = (geo.rampLen - BLOCK_SIZE) / pixelsPerMetre;

    const forces = physicsStep();

    // Check if block reached the bottom
    if (s.d >= maxD) {
      s.d     = maxD;
      const tRad    = (angleRef.current * Math.PI) / 180;
      const m       = massRef.current;
      const muK     = muKRef.current;
      const fNormal = m * G * Math.cos(tRad);
      const fPar    = m * G * Math.sin(tRad);
      const fFric   = muK * fNormal;
      const accel   = Math.max(0, (fPar - fFric) / m);

      // Exact Kinematic final time and terminal velocity with friction
      const exactTime = accel > 0 ? Math.sqrt((2 * maxD) / accel) : s.t;
      const exactV = accel > 0 ? Math.sqrt(2 * accel * maxD) : 0;
      const vFrictionless = Math.sqrt(2 * G * Math.sin(tRad) * maxD);

      s.v        = exactV;
      s.t        = exactTime;
      s.maxSpeed = Math.max(s.maxSpeed, exactV);
      s.state    = STATES.DONE;

      const kineticEnergy = 0.5 * m * exactV * exactV;
      const workByGravity = fPar * maxD;
      const workByFric    = fFric * maxD;
      const efficiency    = workByGravity > 0 ? Math.min(100, Math.max(0, (kineticEnergy / workByGravity) * 100)) : 0;

      drawFrame();
      setTelemetry(prev => ({
        ...prev,
        state:          STATES.DONE,
        speed:          0,
        maxSpeed:       exactV,
        vTheory:        vFrictionless,
        vActual:        exactV,
        elapsed:        exactTime,
        distance:       maxD,
        kineticEnergy,
        workByGravity,
        workByFriction: workByFric,
        frictionHeat:   workByFric,
        efficiency,
        ...forces,
      }));
      // Resume idle loop for continued redraws (angle can still change)
      idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
      return;
    }

    drawFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef, physicsStep, drawFrame]);

  // ─── Continuous idle RAF (redraws when idle/done — keeps angle changes live) ─
  const idleLoop = useCallback(() => {
    const s = simRef.current;
    if (s.state === STATES.KINETIC || s.state === STATES.STATIC) return; // physics loop owns it
    drawFrame();
    idleRafRef.current = requestAnimationFrame(idleLoop);
  }, [drawFrame]);

  useEffect(() => { idleLoopRef.current = idleLoop; }, [idleLoop]);

  // Start idle loop on mount
  useEffect(() => {
    idleRafRef.current = requestAnimationFrame(idleLoop);
    return () => {
      if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
      if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    };
  }, [idleLoop]);

  // ─── Telemetry poll at ~10 fps ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current;
      if (s.state === STATES.IDLE || s.state === STATES.DONE) return;

      const tRad    = (angleRef.current * Math.PI) / 180;
      const m       = massRef.current;
      const muS     = muSRef.current;
      const muK     = muKRef.current;
      const fNormal = m * G * Math.cos(tRad);
      const fPar    = m * G * Math.sin(tRad);
      const fSLim   = muS * fNormal;
      const fFric   = s.state === STATES.KINETIC ? muK * fNormal : Math.min(fPar, fSLim);
      const fNet    = s.state === STATES.KINETIC ? Math.max(0, fPar - fFric) : 0;
      const accel   = m > 0 ? fNet / m : 0;

      const d = s.d;

      // Actual speed with friction (v_actual = sqrt(2 * a * d) or current integrated v)
      const vActual = accel > 0 && d > 0 ? Math.sqrt(2 * accel * d) : s.v;

      // Theoretical terminal speed without friction: v_frictionless = sqrt(2 * g * sin(theta) * d)
      const vFrictionless = d > 0 ? Math.sqrt(2 * G * Math.sin(tRad) * d) : 0;

      // Continuous Energy & Efficiency recalculations:
      const kineticEnergy = 0.5 * m * vActual * vActual;
      const workByGravity = fPar * d;
      const workByFric    = fFric * d;
      const efficiency    = workByGravity > 0 ? Math.min(100, Math.max(0, (kineticEnergy / workByGravity) * 100)) : 0;

      const currentMax = Math.max(s.maxSpeed, vActual);
      s.maxSpeed = currentMax;

      setTelemetry({
        state:          s.state,
        speed:          vActual,
        maxSpeed:       currentMax,
        vTheory:        vFrictionless,
        vActual:        vActual,
        acceleration:   accel,
        elapsed:        s.t,
        distance:       d,
        fGravity:       m * G,
        fNormal,
        fFriction:      fFric,
        fNet,
        frictionRatio:  fSLim > 0 ? fPar / fSLim : 0,
        kineticEnergy,
        workByGravity,
        workByFriction: workByFric,
        frictionHeat:   workByFric,
        efficiency,
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Idle redraw on canvas resize
  useEffect(() => { drawFrame(); }, [drawFrame, canvasSize]);

  // ─── Public handlers ──────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    const s = simRef.current;
    if (s.state === STATES.KINETIC) return; // already running

    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);

    // If idle/done — fresh start
    if (s.state === STATES.IDLE || s.state === STATES.DONE) {
      s.d = 0; s.v = 0; s.a = 0; s.t = 0; s.maxSpeed = 0;
    }

    // Determine initial state
    const tRad    = (angleRef.current * Math.PI) / 180;
    const m       = massRef.current;
    const fPar    = m * G * Math.sin(tRad);
    const fNormal = m * G * Math.cos(tRad);
    const fSLim   = muSRef.current * fNormal;

    s.state = fPar > fSLim ? STATES.KINETIC : STATES.STATIC;

    setTelemetry(prev => ({ ...prev, state: s.state }));
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const handlePause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const s = simRef.current;
    if (s.state === STATES.KINETIC || s.state === STATES.STATIC) {
      s.state = STATES.IDLE; // treat pause as idle-in-place
      setTelemetry(prev => ({ ...prev, state: STATES.IDLE }));
      idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);

    simRef.current = { d: 0, v: 0, a: 0, t: 0, maxSpeed: 0, state: STATES.IDLE };
    setTelemetry({
      state: STATES.IDLE, speed: 0, maxSpeed: 0, acceleration: 0, elapsed: 0,
      distance: 0, fGravity: 0, fNormal: 0, fFriction: 0, fNet: 0,
      frictionRatio: 0, kineticEnergy: 0, workByGravity: 0,
      workByFriction: 0, frictionHeat: 0,
    });

    idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
  }, []);

  // ─── Setters that update both React state and refs ────────────────────────
  // Angle / friction params are set from outside via these; the ref mirrors
  // update immediately so the next RAF frame picks them up.
  const setAngleRef    = useCallback((v) => { angleRef.current    = v; }, []);
  const setMuSRef      = useCallback((v) => { muSRef.current      = v; }, []);
  const setMuKRef      = useCallback((v) => { muKRef.current      = v; }, []);
  const setMassRef     = useCallback((v) => { massRef.current     = v; }, []);
  const setRampLenRef  = useCallback((v) => { rampLenRef.current  = v; }, []);
  const setShowVecRef  = useCallback((v) => { showVecRef.current  = v; }, []);
  const setShowGridRef = useCallback((v) => { showGridRef.current = v; }, []);

  return {
    telemetry,
    simState: simRef.current.state,
    STATES,
    handleRun,
    handlePause,
    handleReset,
    syncAngle:    setAngleRef,
    syncMuS:      setMuSRef,
    syncMuK:      setMuKRef,
    syncMass:     setMassRef,
    syncRampLen:  setRampLenRef,
    syncShowVec:  setShowVecRef,
    syncShowGrid: setShowGridRef,
  };
}
