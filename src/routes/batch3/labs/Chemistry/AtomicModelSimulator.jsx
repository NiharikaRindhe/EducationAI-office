import { useRef, useEffect, useMemo } from "react";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Compute simplified Bohr shell fill from atomic number */
function getBohrShells(n) {
  const caps = [2, 8, 18, 32, 32, 18, 8];
  const shells = [];
  let rem = n;
  for (const cap of caps) {
    if (rem <= 0) break;
    shells.push(Math.min(rem, cap));
    rem -= cap;
  }
  return shells;
}

/** Box-Muller transform → Gaussian random number (mean=0, std=1) */
function boxMuller() {
  const u1 = Math.max(1e-10, Math.random()); // avoid log(0)
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Parse "#rrggbb" → "r,g,b" string for rgba() usage */
function hexRGB(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

/** Draws a glowing circle helper */
function glowCircle(ctx, x, y, r, color, glowColor, glowR) {
  ctx.beginPath();
  ctx.arc(x, y, glowR ?? r * 2, 0, Math.PI * 2);
  ctx.fillStyle = glowColor ?? `rgba(96,165,250,0.2)`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AtomicModelSimulator({ elementData, currentModel }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Static pre-computed data (not React state — no re-renders during animation)
  const thomsonPts = useRef([]);    // Thomson electron polar coords
  const quantumPts = useRef([]);    // Quantum cloud Gaussian points
  const nucleusPts = useRef([]);    // Rutherford nucleus cluster

  // Compute Bohr shells (memoized, depends on elementData)
  const bohrShells = useMemo(() => {
    if (!elementData) return [1];
    return (
      elementData.simulation?.bohr_shells ??
      getBohrShells(elementData.atomic_number ?? 1)
    );
  }, [elementData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !elementData) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2; // canvas center X
    const cy = H / 2; // canvas center Y

    // ── Destructure element data ─────────────────────────────────────────
    const n = elementData.atomic_number ?? 1;
    const hex = elementData.hex_code ?? "#3b82f6";
    const rgb = hexRGB(hex);
    const symbol = elementData.symbol ?? "?";
    const protons = elementData.simulation?.protons ?? n;
    const neutrons = elementData.simulation?.neutrons ??
      Math.max(0, Math.round((elementData.atomic_mass ?? n * 2) - n));

    // ── Pre-compute static datasets when model changes ───────────────────

    // Thomson: uniform polar distribution inside R=120 circle
    if (currentModel === "thomson") {
      const R = 120;
      thomsonPts.current = Array.from({ length: n }, () => {
        const r = R * Math.sqrt(Math.random()); // uniform polar area
        const theta = Math.random() * 2 * Math.PI;
        return { r, theta };
      });
    }

    // Quantum: 1500 Gaussian-distributed points via Box-Muller
    if (currentModel === "quantum") {
      const spread = 85; // standard deviation in px
      quantumPts.current = Array.from({ length: 1500 }, () => ({
        x: boxMuller() * spread,
        y: boxMuller() * spread,
      }));
    }

    // Rutherford: nucleus particle cluster (fixed random clump)
    if (currentModel === "rutherford") {
      nucleusPts.current = Array.from({ length: protons + neutrons }, (_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const r = Math.random() * 14;
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          isProton: i < protons,
        };
      });
    }

    // ── Animation loop ───────────────────────────────────────────────────
    let time = 0;

    const draw = () => {
      time += 0.016; // ~60 FPS dt accumulator

      // Clear canvas with dark background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, W, H);

      // ================================================================
      // 1. DALTON — Solid billiard ball
      // ================================================================
      if (currentModel === "dalton") {
        // Radial gradient for 3D sphere illusion (light source top-left)
        const grad = ctx.createRadialGradient(cx - 40, cy - 40, 8, cx, cy, 120);
        grad.addColorStop(0, `rgba(${rgb},0.95)`);
        grad.addColorStop(0.5, `rgba(${rgb},0.75)`);
        grad.addColorStop(1, `rgba(${rgb},0.25)`);

        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp rim
        ctx.strokeStyle = `rgba(${rgb},0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight glint (top-left)
        const glint = ctx.createRadialGradient(cx - 50, cy - 50, 2, cx - 40, cy - 40, 35);
        glint.addColorStop(0, "rgba(255,255,255,0.35)");
        glint.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(cx - 40, cy - 40, 35, 0, Math.PI * 2);
        ctx.fillStyle = glint;
        ctx.fill();

        // Element symbol centered
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 52px Inter,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 8;
        ctx.fillText(symbol, cx, cy);
        ctx.shadowBlur = 0;
      }

      // ================================================================
      // 2. THOMSON — Plum Pudding
      // ================================================================
      else if (currentModel === "thomson") {
        // Positive pudding blob (translucent, radial gradient fill)
        const puddingGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        puddingGrad.addColorStop(0, `rgba(${rgb},0.30)`);
        puddingGrad.addColorStop(0.7, `rgba(${rgb},0.12)`);
        puddingGrad.addColorStop(1, `rgba(${rgb},0.03)`);

        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fillStyle = puddingGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb},0.35)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Electrons — vibrating in place with small sinusoidal jitter
        thomsonPts.current.forEach((pt, i) => {
          // ±0.5 px jitter each axis (unique phase per electron)
          const jx = 0.5 * Math.sin(time * 3.1 + i * 1.37);
          const jy = 0.5 * Math.cos(time * 2.7 + i * 0.91);

          // Convert polar → Cartesian, offset to canvas center
          const ex = cx + pt.r * Math.cos(pt.theta) + jx;
          const ey = cy + pt.r * Math.sin(pt.theta) + jy;

          // Outer glow halo
          ctx.beginPath();
          ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(96,165,250,0.18)";
          ctx.fill();

          // Core electron dot (bright blue)
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#60a5fa";
          ctx.fill();
        });
      }

      // ================================================================
      // 3. RUTHERFORD — Planetary model (elliptical orbits)
      // ================================================================
      else if (currentModel === "rutherford") {
        // ── Orbit tracks (drawn first, underneath everything) ──────────
        for (let i = 0; i < n; i++) {
          // Each orbit has a unique inclination angle (flower layout)
          const inclination = (i / n) * Math.PI;

          // Vary semi-axes by index group so orbits don't all overlap
          const a = 80 + (i % 4) * 20; // semi-major axis
          const b = 38 + (i % 4) * 10; // semi-minor axis

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(inclination); // rotate orbit plane

          ctx.beginPath();
          ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.07)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.restore();
        }

        // ── Nucleus cluster ────────────────────────────────────────────
        nucleusPts.current.forEach((p) => {
          glowCircle(
            ctx,
            cx + p.x, cy + p.y,
            3.5,
            p.isProton ? "rgba(248,113,113,0.95)" : "rgba(148,163,184,0.85)",
            p.isProton ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.1)",
            8
          );
        });

        // Nucleus ambient glow
        const nGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
        nGlow.addColorStop(0, "rgba(239,68,68,0.45)");
        nGlow.addColorStop(1, "rgba(239,68,68,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = nGlow;
        ctx.fill();

        // ── Orbiting electrons ─────────────────────────────────────────
        for (let i = 0; i < n; i++) {
          const inclination = (i / n) * Math.PI;
          const a = 80 + (i % 4) * 20;
          const b = 38 + (i % 4) * 10;
          const speed = 1.3 - (i % 4) * 0.18; // inner faster
          const phase = (i / n) * 2 * Math.PI; // stagger start angles
          const t = time * speed + phase;

          // Parametric ellipse in local (un-rotated) frame:
          //   x_local = a·cos(t),  y_local = b·sin(t)
          const lx = a * Math.cos(t);
          const ly = b * Math.sin(t);

          // Apply 2D rotation matrix for orbit inclination:
          //   [ cos θ  -sin θ ] · [ lx ]
          //   [ sin θ   cos θ ]   [ ly ]
          const ex = cx + lx * Math.cos(inclination) - ly * Math.sin(inclination);
          const ey = cy + lx * Math.sin(inclination) + ly * Math.cos(inclination);

          // Trail (5 ghost positions behind)
          for (let tr = 5; tr >= 1; tr--) {
            const tt = t - tr * 0.06;
            const tlx = a * Math.cos(tt);
            const tly = b * Math.sin(tt);
            const tx = cx + tlx * Math.cos(inclination) - tly * Math.sin(inclination);
            const ty = cy + tlx * Math.sin(inclination) + tly * Math.cos(inclination);

            ctx.beginPath();
            ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(147,197,253,${0.12 * (6 - tr)})`;
            ctx.fill();
          }

          // Electron dot + glow
          glowCircle(ctx, ex, ey, 4, "#93c5fd", "rgba(147,197,253,0.22)", 8);
        }
      }

      // ================================================================
      // 4. BOHR — Concentric shells with rotating electrons
      // ================================================================
      else if (currentModel === "bohr") {
        const totalShells = bohrShells.length;

        // ── Dynamic radii: divide available canvas space evenly across shells ──
        // Leaves 14px margin from the edge; nucleus takes the first slice.
        const edgeMargin = 14;
        const maxRadius = Math.min(cx, cy) - edgeMargin; // e.g. 196 for 420px canvas
        // Nucleus radius scales with shell count so it doesn't crowd inner shells
        const nucRadius = Math.max(14, Math.min(28, maxRadius / (totalShells + 1) * 0.85));
        // Shell radii spread evenly from just outside nucleus to maxRadius
        const shellRadius = (si) =>
          nucRadius + ((maxRadius - nucRadius) / totalShells) * (si + 1);

        // ── Shell orbit tracks (dashed rings) ─────────────────────────
        ctx.setLineDash([4, 5]);
        bohrShells.forEach((_, si) => {
          ctx.beginPath();
          ctx.arc(cx, cy, shellRadius(si), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.30)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // ── Central nucleus (radius scales with element) ───────────────
        const nGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, nucRadius);
        nGrad.addColorStop(0, `rgba(${rgb},1)`);
        nGrad.addColorStop(0.55, `rgba(${rgb},0.65)`);
        nGrad.addColorStop(1, `rgba(${rgb},0.1)`);

        ctx.beginPath();
        ctx.arc(cx, cy, nucRadius, 0, Math.PI * 2);
        ctx.fillStyle = nGrad;
        ctx.fill();

        // Outer nucleus glow
        const ngGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucRadius * 1.6);
        ngGlow.addColorStop(0, `rgba(${rgb},0.2)`);
        ngGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, nucRadius * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = ngGlow;
        ctx.fill();

        // Symbol label — font size proportional to nucleus radius
        const fontSize = Math.max(8, Math.min(15, nucRadius * 0.75));
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${fontSize.toFixed(0)}px Inter,monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol, cx, cy);

        // ── Electrons per shell ────────────────────────────────────────
        // Electron/glow dot sizes also scale with available space
        const electronR = Math.max(2, Math.min(4.5, maxRadius / totalShells * 0.12));
        bohrShells.forEach((count, si) => {
          const r = shellRadius(si);
          const angularSpeed = 0.50 / (si + 1); // outer shells rotate slower

          for (let ei = 0; ei < count; ei++) {
            // Evenly distribute electrons: 2π / count per electron
            const baseAngle = (ei / count) * 2 * Math.PI;
            const angle = time * angularSpeed + baseAngle;

            // Circular position (standard polar → Cartesian)
            const ex = cx + r * Math.cos(angle);
            const ey = cy + r * Math.sin(angle);

            glowCircle(ctx, ex, ey, electronR, "#60a5fa", "rgba(96,165,250,0.22)", electronR * 2);
          }
        });
      }

      // ================================================================
      // 5. QUANTUM MECHANICAL — Gaussian electron cloud
      // ================================================================
      else if (currentModel === "quantum") {
        // Breathing animation: slow sinusoidal scale + opacity modulation
        const breathe = 1 + 0.07 * Math.sin(time * 0.5);
        const baseOpacity = 0.20 + 0.06 * Math.sin(time * 0.5);

        // Draw the 1500 pre-computed Gaussian points (no live calculation)
        // Each frame only applies the scale multiplier — O(1500) * O(1)
        quantumPts.current.forEach((pt) => {
          const px = cx + pt.x * breathe;
          const py = cy + pt.y * breathe;

          ctx.beginPath();
          ctx.arc(px, py, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59,130,246,${baseOpacity.toFixed(3)})`;
          ctx.fill();
        });

        // Outer halo glow for cloud boundary
        const cloudGlow = ctx.createRadialGradient(cx, cy, 60, cx, cy, 140);
        cloudGlow.addColorStop(0, "rgba(59,130,246,0.04)");
        cloudGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.fillStyle = cloudGlow;
        ctx.fill();

        // Central nucleus (tiny bright point)
        const qGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
        qGrad.addColorStop(0, "rgba(255,255,255,0.95)");
        qGrad.addColorStop(0.5, `rgba(${rgb},0.6)`);
        qGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = qGrad;
        ctx.fill();

        // Symbol label
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "bold 13px Inter,monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol, cx, cy);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    // ── Cleanup: cancel RAF on unmount or prop change ────────────────────
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [elementData, currentModel, bohrShells]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={420}
      className="block rounded-xl"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
