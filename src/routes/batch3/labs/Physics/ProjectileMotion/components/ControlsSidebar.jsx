import { motion, AnimatePresence } from "framer-motion";
import { Gauge, Mountain, Wind, SlidersHorizontal } from "lucide-react";
import { CLR, GRAVITY_PRESETS } from "../constants/physicsConstants";
import Section from "./Section";
import SliderRow from "./SliderRow";
import Toggle from "./Toggle";

/**
 * Right-hand controls sidebar containing three accordion sections:
 *   1. Initial Conditions
 *   2. Environmental Factors
 *   3. Visualization Toggles
 *
 * All values are fully controlled — parent owns state, sidebar only calls setters.
 */
export default function ControlsSidebar({
  // Initial conditions
  angle, setAngle,
  velocity, setVelocity,
  height, setHeight,
  mass, setMass,

  // Environment
  gravityKey, setGravityKey,
  customGrav, setCustomGrav,
  airResist, setAirResist,
  dragCoeff, setDragCoeff,
  windSpeed, setWindSpeed,

  // Visualization
  showVectors, setShowVectors,
  showGrid, setShowGrid,
  retainTrails, setRetainTrails,
  trailCount,
}) {
  return (
    <div
      className="w-80 2xl:w-[340px] shrink-0 border-l flex flex-col overflow-y-auto"
      style={{ borderColor: CLR.border, background: CLR.panel }}
    >
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-4 backdrop-blur-md" style={{ borderColor: CLR.border, background: `${CLR.panel}F2` }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: CLR.accent, background: `${CLR.accent}14` }}>
          <SlidersHorizontal size={16} />
        </div>
        <div>
          <p className="text-[13px] font-bold" style={{ color: CLR.text }}>Experiment controls</p>
          <p className="mt-0.5 text-[10px]" style={{ color: CLR.muted }}>Change one variable and observe</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">

        {/* ── 1. Initial Conditions ── */}
        <Section
          title="Initial Conditions"
          icon={<Gauge size={14} style={{ color: CLR.accent }} />}
        >
          <div className="pt-3 flex flex-col gap-4">
            <SliderRow
              label="Launch Angle" value={angle} min={0} max={90} step={1}
              unit="°" onChange={setAngle}
            />
            <SliderRow
              label="Initial Velocity" value={velocity} min={0} max={50} step={0.5}
              unit="m/s" onChange={setVelocity}
            />
            <SliderRow
              label="Launch Height" value={height} min={0} max={20} step={0.5}
              unit="m" onChange={setHeight}
            />
            <SliderRow
              label="Projectile Mass" value={mass} min={0.1} max={10} step={0.1}
              unit="kg" onChange={setMass}
            />
          </div>
        </Section>

        {/* ── 2. Environmental Factors ── */}
        <Section
          title="Environmental Factors"
          icon={<Mountain size={14} style={{ color: CLR.velY }} />}
        >
          <div className="pt-3 flex flex-col gap-4">

            {/* Gravity segmented button-group */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium" style={{ color: CLR.muted }}>
                Gravity Preset
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(GRAVITY_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setGravityKey(key)}
                    className="px-2 py-1.5 rounded-md text-xs font-medium border transition-all"
                    style={{
                      borderColor: gravityKey === key ? CLR.accent : CLR.border,
                      background: gravityKey === key ? "rgba(88,166,255,0.12)" : "transparent",
                      color: gravityKey === key ? CLR.accent : CLR.muted,
                    }}
                  >
                    {preset.icon} {preset.label}
                    {key !== "custom" && (
                      <span className="block text-[9px] mt-0.5 opacity-70">
                        {preset.value} m/s²
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {gravityKey === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SliderRow
                      label="Custom Gravity" value={customGrav}
                      min={0.1} max={25} step={0.1} unit="m/s²"
                      onChange={setCustomGrav}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Air resistance toggle + revealed sub-controls */}
            <Toggle label="Air Resistance" value={airResist} onChange={(val) => {
              setAirResist(val);
              // Turning air resistance off makes wind irrelevant — zero it out
              if (!val) setWindSpeed(0);
            }} />

            <AnimatePresence>
              {airResist && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex flex-col gap-4 rounded-lg p-3 border"
                    style={{ borderColor: CLR.border, background: "rgba(88,166,255,0.04)" }}
                  >
                    {/* Drag coefficient */}
                    <SliderRow
                      label="Drag Coefficient (k)" value={dragCoeff}
                      min={0.0} max={0.5} step={0.01} unit=""
                      onChange={setDragCoeff}
                    />

                    {/* Divider */}
                    <div className="h-px" style={{ background: CLR.border }} />

                    {/* Wind speed — lives here because wind acts through drag */}
                    <SliderRow
                      label="Wind Speed" value={windSpeed}
                      min={-15} max={15} step={0.5} unit="m/s"
                      onChange={setWindSpeed}
                    />

                    {/* Wind direction hint */}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: CLR.muted }}>
                      <Wind size={11} />
                      {windSpeed === 0
                        ? "No wind"
                        : windSpeed > 0
                          ? `Tailwind +${windSpeed} m/s`
                          : `Headwind ${windSpeed} m/s`}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>
      </div>
    </div>
  );
}
