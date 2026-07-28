import { Triangle, Layers, Eye } from "lucide-react";
import { CLR, SURFACE_PRESETS } from "../constants/frictionConstants";
import FrictionSection from "./FrictionSection";
import FrictionSliderRow from "./FrictionSliderRow";
import FrictionToggle from "./FrictionToggle";
import FrictionInfoTooltip from "./FrictionInfoTooltip";

// ─── Per-parameter info text ──────────────────────────────────────────────────
const INFO = {
  angle:
    "Incline angle (θ) is the slope of the ramp measured from the horizontal. " +
    "It directly controls the gravity component pulling the block down the slope: " +
    "F_parallel = mg·sin(θ). The block starts to slip when θ exceeds the critical slip angle θc = arctan(µs).",
  mass:
    "Block mass (m) scales all forces equally — gravity, normal force, and friction all grow with mass. " +
    "Because acceleration = (F_parallel − F_friction) / m, the net effect on acceleration is mass-independent " +
    "when there is no air resistance. Changing mass still affects the raw Newton values shown in the vectors.",
  rampLength:
    "Ramp length sets the physical distance the block travels before reaching the bottom. " +
    "A longer ramp gives the block more time to accelerate and reach higher speeds. " +
    "It does not affect the forces or acceleration — only the travel distance and time to reach the ground.",
  muS:
    "Static friction coefficient (µs) defines the maximum grip between the surfaces before the block begins to slip. " +
    "The block stays still as long as the gravitational pull F_parallel ≤ µs × F_normal. " +
    "The critical slip angle is θc = arctan(µs) — shown as the dashed guide line on the canvas.",
  muK:
    "Kinetic friction coefficient (µk) is the friction once the block is already sliding. " +
    "It is always ≤ µs — surfaces grip less once motion has started (Coulomb's Law). " +
    "Net acceleration = (mg·sin θ − µk·mg·cos θ) / m = g(sin θ − µk·cos θ).",
  vectors:
    "Force vector overlays draw three arrows directly from the block's centre of mass: " +
    "Red = Weight (mg) acting straight down, " +
    "Teal = Normal force perpendicular to the slope surface, " +
    "Amber = Friction force opposing motion up the slope. " +
    "Arrow lengths scale proportionally to Newton values.",
  grid:
    "Toggles the background dot grid. The grid helps visually estimate distances and angles " +
    "on the canvas but has no effect on the simulation physics.",
};

/**
 * Right-hand control sidebar.
 * All state is fully controlled — parent owns it, panel only calls setters.
 */
export default function ControlPanel({
  // Ramp geometry
  angle, setAngle,
  mass, setMass,
  rampLength, setRampLen,

  // Friction coefficients
  muS, setMuS,
  muK, setMuK,

  // Visualization
  showVectors, setShowVectors,
  showGrid, setShowGrid,

  // Actions
  onRun, onPause, onReset,
  simState, STATES,
}) {
  const isRunning = simState === STATES.KINETIC || simState === STATES.STATIC;
  const isDone = simState === STATES.DONE;

  const applyPreset = (key) => {
    const p = SURFACE_PRESETS[key];
    setMuS(p.us);
    setMuK(p.uk);
  };

  return (
    <div
      className="w-72 xl:w-80 shrink-0 border-l flex flex-col overflow-y-auto"
      style={{ borderColor: CLR.border, background: CLR.panel }}
    >
      <div className="flex flex-col gap-3 p-4">

        {/* ── Action buttons moved to left nav panel ── */}

        {/* ── 1. Ramp Geometry ── */}
        <FrictionSection
          title="Ramp Geometry"
          icon={<Triangle size={13} style={{ color: CLR.accent }} />}
        >
          <div className="pt-3 flex flex-col gap-4">
            <FrictionSliderRow
              label="Incline Angle" value={angle}
              min={0} max={90} step={1} unit="°"
              info={INFO.angle}
              onChange={setAngle}
            />
            <FrictionSliderRow
              label="Block Mass" value={mass}
              min={0.5} max={20} step={0.5} unit="kg"
              info={INFO.mass}
              onChange={setMass}
            />
            <FrictionSliderRow
              label="Ramp Length" value={rampLength}
              min={0.30} max={1.50} step={0.01} unit=""
              hint="Fraction of canvas size"
              info={INFO.rampLength}
              onChange={setRampLen}
            />
          </div>
        </FrictionSection>

        {/* ── 2. Surface Material Coefficients ── */}
        <FrictionSection
          title="Surface Coefficients"
          icon={<Layers size={13} style={{ color: CLR.friction }} />}
        >
          <div className="pt-3 flex flex-col gap-4">

            {/* Material presets */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium" style={{ color: CLR.muted }}>
                Material Preset
              </span>
              <div className="flex flex-col gap-1.5">
                {Object.entries(SURFACE_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border transition-all text-left"
                    style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = CLR.friction;
                      e.currentTarget.style.color = CLR.text;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = CLR.border;
                      e.currentTarget.style.color = CLR.muted;
                    }}
                  >
                    <span>{p.icon} {p.label}</span>
                    <span style={{ color: CLR.friction }}>µs {p.us} / µk {p.uk}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: CLR.border }} />

            <FrictionSliderRow
              label="Static Friction (µs)" value={muS}
              min={0} max={1} step={0.01} unit=""
              hint={`Slip Angle θc = ${(Math.atan(muS) * 180 / Math.PI).toFixed(1)}°`}
              info={INFO.muS}
              onChange={(v) => { setMuS(v); if (muK > v) setMuK(v); }}
            />
            <FrictionSliderRow
              label="Kinetic Friction (µk)" value={muK}
              min={0} max={muS} step={0.01} unit=""
              hint="While sliding (≤ µs)"
              info={INFO.muK}
              onChange={setMuK}
            />

            {/* µk warning if equal */}
            {muK >= muS && muS > 0 && (
              <p className="text-[10px] px-0.5" style={{ color: CLR.friction }}>
                ⚠ µk = µs — no kinetic energy loss difference
              </p>
            )}
          </div>
        </FrictionSection>

        {/* ── 3. Visualization ── */}
        <FrictionSection
          title="Visualization"
          icon={<Eye size={13} style={{ color: CLR.accent }} />}
          defaultOpen={true}
        >
          <div className="pt-3 flex flex-col gap-3">
            <FrictionToggle
              label="Show Force Vectors"
              value={showVectors}
              info={INFO.vectors}
              onChange={setShowVectors}
            />
            <FrictionToggle
              label="Show Dot Grid"
              value={showGrid}
              info={INFO.grid}
              onChange={setShowGrid}
            />
          </div>
        </FrictionSection>

        {/* ── Vector legend ── */}
        {/* <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: CLR.border }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>
            Vector Legend
          </p>
          {[
            { color: CLR.gravity, label: "Weight  (mg)" },
            { color: CLR.normal, label: "Normal Force  (N)" },
            { color: CLR.friction, label: "Friction  (f)" },
            { color: CLR.accent, label: "Critical slip angle guide" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: CLR.muted }}>
              <span className="w-4 h-0.5 rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div> */}

      </div>
    </div>
  );
}
