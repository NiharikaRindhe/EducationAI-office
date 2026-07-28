import { motion } from "framer-motion";
import { Radio, Wind, Thermometer, Zap } from "lucide-react";
import { CLR, MEDIUM_PRESETS, BOUNDARY, computeSpeedOfSound } from "../constants/soundConstants";
import SoundSection   from "./SoundSection";
import SoundSliderRow from "./SoundSliderRow";
import SoundToggle    from "./SoundToggle";
import InfoTooltip    from "./InfoTooltip";

// ─── Per-parameter info text ──────────────────────────────────────────────────
const INFO = {
  freq:     "Frequency (f) controls how many complete wave cycles pass a point per second. Higher frequency = shorter wavelength, more tightly packed compressions in the tank. Formula: λ = v / f",
  amp:      "Amplitude (A) is the peak displacement of air molecules from rest. Higher amplitude = louder sound, taller wave on the graph. Energy carried by the wave scales with A².",
  phase:    "Phase (φ) shifts the starting point of the wave cycle. At 0° the wave begins at zero. At 180° it starts inverted. Useful for destructive interference — matching a noise wave with φ = 180° cancels it.",
  medium:   "The medium determines the speed of sound (v). Sound travels fastest through dense solids and slowest through gases because molecular spacing and elasticity differ. Changing medium rescales wavelength: λ = v / f.",
  temp:     "Temperature increases the kinetic energy of molecules, so they collide more rapidly and transmit the pressure wave faster. In air: v ≈ 331 + 0.6 × T m/s. In liquids and solids the effect is smaller but still present.",
  boundary: "A rigid wall reflects the wave back with a 180° phase inversion (fixed-end reflection). The outgoing and reflected waves superimpose to form a standing wave with nodes (zero displacement) and antinodes (maximum displacement). Foam absorbs the wave — no reflection occurs.",
};


export default function SoundControlPanel({
  freq, setFreq,
  amp,  setAmp,
  phase, setPhase,
  temp,  setTemp,
  medium, setMedium,
  boundary, setBoundary,
  running,
  onPlay, onPause, onReset,
  onFireSonar,
}) {
  const isRigid    = boundary === BOUNDARY.RIGID;
  const preset     = MEDIUM_PRESETS[medium];
  const liveV      = computeSpeedOfSound(medium, temp);
  const tempMin    = -50;
  const tempMax    = 500;

  return (
    <div
      className="w-72 xl:w-80 shrink-0 border-l flex flex-col overflow-y-auto"
      style={{ borderColor: CLR.border, background: CLR.panel }}
    >
      <div className="flex flex-col gap-3 p-4">

        {/* ── 1. Wave Generator Setup ── */}
        <SoundSection
          title="Wave Generator"
          icon={<Radio size={13} style={{ color: CLR.wave }} />}
        >
          <div className="pt-3 flex flex-col gap-4">
            <SoundSliderRow
              label="Frequency (f)" value={freq}
              min={1} max={10} step={0.1} unit="Hz"
              hint="1 – 10 Hz scaled"
              onChange={setFreq}
              accentColor={CLR.wave}
              info={INFO.freq}
            />
            <SoundSliderRow
              label="Amplitude (A)" value={amp}
              min={0} max={1} step={0.01} unit=""
              hint="0 – 100%"
              onChange={setAmp}
              accentColor={CLR.wave}
              info={INFO.amp}
            />
            <SoundSliderRow
              label="Phase (φ)" value={phase}
              min={0} max={360} step={1} unit="°"
              hint="Source phase offset"
              onChange={setPhase}
              accentColor={CLR.target}
              info={INFO.phase}
            />
          </div>
        </SoundSection>

        {/* ── 2. Medium & Environment ── */}
        <SoundSection
          title="Medium & Environment"
          icon={<Wind size={13} style={{ color: CLR.accent }} />}
        >
          <div className="pt-3 flex flex-col gap-4">

            {/* Medium buttons */}
            {/* <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: CLR.muted }}>
                Speed of Sound
                <InfoTooltip text={INFO.medium} />
              </span>
              <div className="flex flex-col gap-1.5">
                {Object.entries(MEDIUM_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setMedium(key)}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border transition-all text-left"
                    style={{
                      borderColor: medium === key ? p.color : CLR.border,
                      color:       medium === key ? p.color : CLR.muted,
                      background:  medium === key ? `${p.color}15` : "transparent",
                    }}
                  >
                    <span>{p.icon} {p.label}</span>
                    <span className="font-mono" style={{ color: p.color }}>{p.v} m/s</span>
                  </button>
                ))}
              </div>
            </div> */}

            {/* Divider */}
            {/* <div className="h-px" style={{ background: CLR.border }} /> */}

            {/* Temperature slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Thermometer size={12} style={{ color: CLR.target }} />
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: CLR.muted }}>
                  Medium Temperature
                  <InfoTooltip text={INFO.temp} />
                </span>
              </div>
              <SoundSliderRow
                label="Temperature (T)"
                value={temp}
                min={tempMin}
                max={tempMax}
                step={1}
                unit="°C"
                hint={`Range: ${tempMin}°C – ${tempMax}°C`}
                onChange={(v) => {
                  setTemp(v);
                  // If medium changes range bounds, clamp
                }}
                accentColor={CLR.target}
              />
              {/* Live speed preview */}
              <div
                className="flex items-center justify-between rounded-md px-3 py-1.5 border"
                style={{ borderColor: `${preset?.color ?? CLR.border}55`, background: `${preset?.color ?? CLR.border}0d` }}
              >
                <span className="text-[10px]" style={{ color: CLR.muted }}>
                  Computed v at {temp}°C
                </span>
                <span className="text-xs font-mono font-bold tabular-nums" style={{ color: preset?.color ?? CLR.text }}>
                  {liveV} m/s
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: CLR.border }} />

            {/* Boundary toggle */}
            <SoundToggle
              label="Rigid Wall (Echo)"
              value={isRigid}
              hint={isRigid ? "180° reflected wave active" : "Foam absorber — no echo"}
              info={INFO.boundary}
              onChange={(v) => setBoundary(v ? BOUNDARY.RIGID : BOUNDARY.ABSORB)}
            />
          </div>
        </SoundSection>
      </div>
    </div>
  );
}
