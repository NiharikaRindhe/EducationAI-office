import { useRef, useState, useEffect, useCallback } from "react";
import { DEFAULT_SCALE, MIN_SCALE, WORLD_PADDING, DT, CLR } from "../constants/physicsConstants";
import {
  drawGrid, drawTrails, drawCurrentPath, drawApexFlag,
  drawLaunchMarker, drawImpactMarker, drawVectors, drawProjectile,
  drawScaleBadge, toScreenX, toScreenY,
  createWindParticles, tickWindParticles, drawWindParticles,
} from "../utils/canvasDrawing";

function toRad(deg) { return (deg * Math.PI) / 180; }

/**
 * useSimulation
 *
 * Owns all simulation refs, the RAF loop, and the telemetry polling interval.
 * Returns refs needed by CanvasViewport and handlers needed by ActionBar/parent.
 *
 * @param {object} params - live control values from parent state
 */
export function useSimulation({
  canvasRef,
  canvasSize,
  angle,
  velocity,
  height,
  mass,
  gravity,
  airResist,
  dragCoeff,
  windSpeed,
  retainTrails,
  showGrid,
  showVectors,
}) {
  // ── Simulation refs (mutated inside RAF — never trigger re-renders) ─────────
  const rafRef         = useRef(null);
  const idleRafRef     = useRef(null);
  const idleLoopRef    = useRef(null);
  const simRef         = useRef({ x: 0, y: 0, vx: 0, vy: 0, mass: 1, running: false, paused: false });
  const pathRef        = useRef([]);
  const apexRef        = useRef(null);
  const impactRef      = useRef(null);
  const launchPtRef    = useRef(null);
  const trailsRef      = useRef([]);
  const windParticles  = useRef([]);
  const timeRef        = useRef(0);

  // World-bounds: the furthest extents the trajectory has reached this flight.
  // Used to compute the dynamic scale each frame.
  const worldBoundsRef = useRef({ maxX: 0, maxY: 0 });

  // Current display scale (pixels/metre). Smoothly lerped toward target.
  const displayScaleRef = useRef(DEFAULT_SCALE);

  // ── Mirror mutable control values into refs so RAF reads latest without stale closure ──
  const gravRef   = useRef(gravity);
  const airRef    = useRef(airResist);
  const dragRef   = useRef(dragCoeff);
  const windRef   = useRef(windSpeed);
  const gridRef   = useRef(showGrid);
  const vecRef    = useRef(showVectors);
  const sizeRef   = useRef(canvasSize);

  useEffect(() => { gravRef.current  = gravity;    }, [gravity]);
  useEffect(() => { airRef.current   = airResist;  }, [airResist]);
  useEffect(() => { dragRef.current  = dragCoeff;  }, [dragCoeff]);
  useEffect(() => { windRef.current  = windSpeed;  }, [windSpeed]);
  useEffect(() => { gridRef.current  = showGrid;   }, [showGrid]);
  useEffect(() => { vecRef.current   = showVectors;}, [showVectors]);
  useEffect(() => { sizeRef.current  = canvasSize; }, [canvasSize]);

  // ── React UI state (updated ~10 fps via interval, not inside RAF) ───────────
  const [isRunning,  setIsRunning]  = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [trailCount, setTrailCount] = useState(0);
  const [telemetry,  setTelemetry]  = useState({
    x: 0, y: 0, speed: 0, maxHeight: 0, range: null, time: 0, status: "idle",
  });

  // ── Canvas origin helper ────────────────────────────────────────────────────
  // Origin is always bottom-left: x=40, y=canvasH-40 — computed inline in drawFrame.

  // ── Full-frame draw (called from RAF and on idle redraws) ───────────────────
  const drawFrame = useCallback((dt = DT) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W   = canvas.width || 800;
    const H   = canvas.height || 480;

    // ── Compute dynamic scale ─────────────────────────────────────────────────
    // Available drawing area (leave left/bottom margin for axes)
    const drawW = Math.max(10, W - 50);
    const drawH = Math.max(10, H - 50);

    const bounds = worldBoundsRef.current || {};
    const maxX = isNaN(bounds.maxX) || bounds.maxX < 0 ? WORLD_PADDING : bounds.maxX;
    const maxY = isNaN(bounds.maxY) || bounds.maxY < 0 ? WORLD_PADDING : bounds.maxY;

    const worldW = Math.max(1, maxX + WORLD_PADDING);
    const worldH = Math.max(1, maxY + WORLD_PADDING);

    let rawScale = Math.min(DEFAULT_SCALE, drawW / worldW, drawH / worldH);
    if (isNaN(rawScale) || !isFinite(rawScale) || rawScale <= 0) {
      rawScale = DEFAULT_SCALE;
    }
    const targetScale = Math.max(MIN_SCALE, rawScale);

    let prev = displayScaleRef.current;
    if (isNaN(prev) || !isFinite(prev) || prev <= 0) {
      prev = DEFAULT_SCALE;
    }

    const lerpFactor = targetScale < prev ? 0.06 : 0.12;
    const nextScale = prev + (targetScale - prev) * lerpFactor;
    const scale = isNaN(nextScale) || !isFinite(nextScale) || nextScale <= 0 ? DEFAULT_SCALE : nextScale;
    displayScaleRef.current = scale;

    // Origin is always bottom-left margin
    const originX = 40;
    const originY = H - 40;

    // ── Paint ─────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CLR.bg;
    ctx.fillRect(0, 0, W, H);

    if (gridRef.current) drawGrid(ctx, W, H, originX, originY, scale);

    tickWindParticles(windParticles.current, W, H, windRef.current, dt);
    drawWindParticles(ctx, windParticles.current, windRef.current);

    drawTrails(ctx, trailsRef.current, originX, originY, scale);
    drawCurrentPath(ctx, pathRef.current, originX, originY, scale);
    drawApexFlag(ctx, apexRef.current, originX, originY, scale);

    if (launchPtRef.current && isFinite(launchPtRef.current.x) && isFinite(launchPtRef.current.y)) {
      drawLaunchMarker(
        ctx,
        toScreenX(launchPtRef.current.x, originX, scale),
        toScreenY(launchPtRef.current.y, originY, scale),
      );
    }
    if (impactRef.current && isFinite(impactRef.current.x) && isFinite(impactRef.current.y)) {
      drawImpactMarker(
        ctx,
        toScreenX(impactRef.current.x, originX, scale),
        toScreenY(impactRef.current.y, originY, scale),
      );
    }

    const s = simRef.current;
    if (s.running || s.paused) {
      const sx = toScreenX(s.x, originX, scale);
      const sy = toScreenY(s.y, originY, scale);
      if (isFinite(sx) && isFinite(sy)) {
        drawVectors(ctx, sx, sy, s.vx, s.vy, vecRef.current);
        drawProjectile(ctx, sx, sy);
      }
    }

    drawScaleBadge(ctx, W, scale, DEFAULT_SCALE);
  }, [canvasRef]);

  // ── RAF physics loop ────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = simRef.current;
    if (!s.running || s.paused) return;

    const g     = gravRef.current;
    const k     = airRef.current ? dragRef.current : 0;
    const vW    = windRef.current;
    const vRelX = s.vx - vW;
    const speed = Math.sqrt(vRelX * vRelX + s.vy * s.vy);

    const ax = (-k * vRelX * speed) / s.mass;
    const ay = -g + (-k * s.vy * speed) / s.mass;

    s.vx += ax * DT;
    s.vy += ay * DT;
    s.x  += s.vx * DT;
    s.y  += s.vy * DT;
    timeRef.current += DT;

    pathRef.current.push({ x: s.x, y: s.y });

    // Expand world bounds so the dynamic scale can zoom out to fit
    const b = worldBoundsRef.current;
    if (s.x > b.maxX) b.maxX = s.x;
    if (s.y > b.maxY) b.maxY = s.y;

    if (!apexRef.current || s.y > apexRef.current.y) {
      apexRef.current = { x: s.x, y: s.y };
    }

    if (s.y <= 0) {
      s.y       = 0;
      s.running = false;
      impactRef.current = { x: s.x, y: 0 };
      setIsRunning(false);
      setTelemetry(prev => ({ ...prev, range: s.x, time: timeRef.current, status: "landed" }));
      drawFrame(DT);
      // Restart idle loop so wind keeps animating after landing
      idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
      return;
    }

    drawFrame(DT);
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  // ── Seed wind particles whenever canvas size changes ───────────────────────
  useEffect(() => {
    const { w, h } = canvasSize;
    if (w > 0 && h > 0) {
      windParticles.current = createWindParticles(w, h);
    }
  }, [canvasSize]);

  // ── Continuous idle RAF — keeps wind animating when no projectile is flying ─
  const idleLoop = useCallback(() => {
    const s = simRef.current;
    // Hand off to the physics loop if actively running
    if (s.running) return;
    drawFrame(DT);
    idleRafRef.current = requestAnimationFrame(idleLoop);
  }, [drawFrame]);

  // Keep a stable ref so the physics loop can schedule it without circular dep
  useEffect(() => { idleLoopRef.current = idleLoop; }, [idleLoop]);

  // Start idle loop on mount; physics loop will take over on launch
  useEffect(() => {
    idleRafRef.current = requestAnimationFrame(idleLoop);
    return () => {
      if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    };
  }, [idleLoop]);

  // ── Telemetry poll at ~10 fps ───────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current;
      if (!s.running && !s.paused) return;
      setTelemetry(prev => ({
        ...prev,
        x:         s.x,
        y:         s.y,
        speed:     Math.sqrt(s.vx * s.vx + s.vy * s.vy),
        maxHeight: apexRef.current ? apexRef.current.y : 0,
        time:      timeRef.current,
        status:    s.paused ? "paused" : "flying",
      }));
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Cleanup RAF on unmount ──────────────────────────────────────────────────
  useEffect(() => () => {
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
  }, []);

  // ── Public handlers ─────────────────────────────────────────────────────────
  const handleLaunch = useCallback(() => {
    // Stop idle wind loop — physics loop will draw every frame instead
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);

    const rad = toRad(angle);
    const vx0 = velocity * Math.cos(rad);
    const vy0 = velocity * Math.sin(rad);

    if (retainTrails && pathRef.current.length > 1) {
      trailsRef.current = [...trailsRef.current, [...pathRef.current]];
      if (trailsRef.current.length > 5) trailsRef.current.shift();
      setTrailCount(trailsRef.current.length);
    }

    simRef.current    = { x: 0, y: height, vx: vx0, vy: vy0, mass, running: true, paused: false };
    pathRef.current   = [{ x: 0, y: height }];
    apexRef.current   = null;
    impactRef.current = null;
    launchPtRef.current = { x: 0, y: height };

    // Reset world bounds and scale for the new flight
    worldBoundsRef.current  = { maxX: WORLD_PADDING, maxY: Math.max(height, WORLD_PADDING) };
    displayScaleRef.current = DEFAULT_SCALE;

    setIsRunning(true);
    setIsPaused(false);
    timeRef.current   = 0;
    setTelemetry({ x: 0, y: height, speed: velocity, maxHeight: height, range: null, time: 0, status: "flying" });

    rafRef.current = requestAnimationFrame(loop);
  }, [angle, velocity, height, mass, retainTrails, loop]);

  const handlePauseResume = useCallback(() => {
    const s = simRef.current;
    if (!s.running && !s.paused) return;
    if (s.paused) {
      s.paused = false;
      setIsPaused(false);
      // Stop idle loop, hand back to physics loop
      if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    } else {
      s.paused = true;
      setIsPaused(true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Restart idle loop while paused so wind still moves
      idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
    }
  }, [loop]);

  const handleReset = useCallback(() => {
    if (rafRef.current)     cancelAnimationFrame(rafRef.current);
    if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
    simRef.current      = { x: 0, y: 0, vx: 0, vy: 0, mass: 1, running: false, paused: false };
    pathRef.current     = [];
    apexRef.current     = null;
    impactRef.current   = null;
    launchPtRef.current = null;
    trailsRef.current   = [];
    setIsRunning(false);
    setIsPaused(false);
    setTrailCount(0);
    timeRef.current   = 0;
    setTelemetry({ x: 0, y: 0, speed: 0, maxHeight: 0, range: null, time: 0, status: "idle" });
    worldBoundsRef.current  = { maxX: WORLD_PADDING, maxY: WORLD_PADDING };
    displayScaleRef.current = DEFAULT_SCALE;
    // Restart idle loop for continuous wind
    idleRafRef.current = requestAnimationFrame(idleLoopRef.current);
  }, []);

  return {
    isRunning,
    isPaused,
    telemetry,
    trailCount,
    handleLaunch,
    handlePauseResume,
    handleReset,
  };
}
