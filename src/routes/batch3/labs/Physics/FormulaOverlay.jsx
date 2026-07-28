import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, X, Sparkles, Sigma } from "lucide-react";

/**
 * FormulaOverlay Component
 *
 * Showcases mathematical formulas and real-time numeric calculations
 * for Motion, Friction, Sound, and Optics physics simulations.
 */
export default function FormulaOverlay({
  type, // "motion" | "friction" | "sound" | "optics"
  isOpen,
  onClose,
  data = {},
  position = "left", // "left" | "right" | "dock"
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);

  if (!isOpen) return null;

  // Render mathematical formula cards based on domain type
  const renderFormulaContent = () => {
    switch (type) {
      case "motion": {
        const {
          velocity = 20,
          angle = 45,
          height = 0,
          gravity = 9.81,
          telemetry = {},
        } = data;

        const rad = (angle * Math.PI) / 180;
        const v0x = velocity * Math.cos(rad);
        const v0y = velocity * Math.sin(rad);

        const discriminant = v0y * v0y + 2 * gravity * height;
        const flightTime = (v0y + Math.sqrt(Math.max(0, discriminant))) / gravity;
        const maxHeight = height + (v0y * v0y) / (2 * gravity);
        const range = v0x * flightTime;

        const curT = telemetry.time ?? 0;
        const curX = telemetry.x ?? 0;
        const curY = telemetry.y ?? 0;

        const formulas = [
          {
            title: "Initial Velocity Components",
            symbolic: "v₀ₓ = v₀ · cos(θ)   |   v₀ᵧ = v₀ · sin(θ)",
            substitution: `v₀ₓ = ${velocity} · cos(${angle}°) = ${v0x.toFixed(2)} m/s\nv₀ᵧ = ${velocity} · sin(${angle}°) = ${v0y.toFixed(2)} m/s`,
            description: "Break the total launch speed into independent horizontal and vertical vectors.",
            badge: "Vector Splitting",
          },
          {
            title: "Maximum Height (H_max)",
            symbolic: "H_max = h₀ + (v₀ᵧ²) / (2g)",
            substitution: `H_max = ${height} + (${v0y.toFixed(2)}²) / (2 × ${gravity.toFixed(2)}) = ${maxHeight.toFixed(2)} m`,
            description: "The peak vertical distance achieved when vertical velocity vᵧ reaches 0.",
            badge: "Peak Apex",
          },
          {
            title: "Total Flight Time (t_flight)",
            symbolic: "t = [ v₀ᵧ + √(v₀ᵧ² + 2g h₀) ] / g",
            substitution: `t = [ ${v0y.toFixed(2)} + √(${v0y.toFixed(2)}² + 2 × ${gravity.toFixed(2)} × ${height}) ] / ${gravity.toFixed(2)}\n  = ${flightTime.toFixed(2)} s`,
            description: "Duration of time until the projectile impacts the ground.",
            badge: "Duration",
          },
          {
            title: "Horizontal Range (R)",
            symbolic: "R = v₀ₓ · t_flight",
            substitution: `R = ${v0x.toFixed(2)} m/s × ${flightTime.toFixed(2)} s = ${range.toFixed(2)} m`,
            description: "Total horizontal displacement across the trajectory path.",
            badge: "Distance",
          },
          {
            title: "Position at Instant t",
            symbolic: "x(t) = v₀ₓ · t   |   y(t) = h₀ + v₀ᵧ · t - ½ g t²",
            substitution: `At t = ${curT.toFixed(2)}s:\nx = ${v0x.toFixed(2)} × ${curT.toFixed(2)} = ${curX.toFixed(2)} m\ny = ${height} + ${v0y.toFixed(2)}(${curT.toFixed(2)}) - ½(${gravity.toFixed(2)})(${curT.toFixed(2)})² = ${curY.toFixed(2)} m`,
            description: "Real-time parametric equations governing spatial coordinates.",
            badge: "Live Trajectory",
          },
        ];

        return { title: "Motion & Trajectory Equations", formulas };
      }

      case "friction": {
        const {
          angle = 30,
          mass = 5,
          muS = 0.5,
          muK = 0.3,
          gravity = 9.81,
          telemetry = {},
        } = data;

        const rad = (angle * Math.PI) / 180;
        const normalForce = mass * gravity * Math.cos(rad);
        const parallelForce = mass * gravity * Math.sin(rad);
        const maxStatic = muS * normalForce;
        const kineticFriction = muK * normalForce;

        const slipAngleRad = Math.atan(muS);
        const slipAngleDeg = (slipAngleRad * 180) / Math.PI;

        const isSliding = angle > slipAngleDeg;
        const accel = isSliding
          ? gravity * (Math.sin(rad) - muK * Math.cos(rad))
          : 0;

        const formulas = [
          {
            title: "Normal Force (N)",
            symbolic: "N = m · g · cos(θ)",
            substitution: `N = ${mass} kg × ${gravity} m/s² × cos(${angle}°) = ${normalForce.toFixed(2)} N`,
            description: "Perpendicular contact force exerted by the inclined ramp surface.",
            badge: "Contact Force",
          },
          {
            title: "Parallel Gravity Component (F_∥)",
            symbolic: "F_∥ = m · g · sin(θ)",
            substitution: `F_∥ = ${mass} kg × ${gravity} m/s² × sin(${angle}°) = ${parallelForce.toFixed(2)} N`,
            description: "Downslope component of weight pushing the block down the ramp.",
            badge: "Downslope Force",
          },
          {
            title: "Friction Limits (f_s_max & f_k)",
            symbolic: "f_s_max = μ_s · N   |   f_k = μ_k · N",
            substitution: `f_s_max = ${muS} × ${normalForce.toFixed(2)} N = ${maxStatic.toFixed(2)} N\nf_k = ${muK} × ${normalForce.toFixed(2)} N = ${kineticFriction.toFixed(2)} N`,
            description: "Threshold force resisting initial motion vs kinetic resistance during motion.",
            badge: "Friction Forces",
          },
          {
            title: "Critical Slip Angle (θ_slip)",
            symbolic: "θ_slip = arctan(μ_s)",
            substitution: `θ_slip = arctan(${muS}) = ${slipAngleDeg.toFixed(1)}°\nCurrent angle (${angle}°) ${isSliding ? "> θ_slip ➔ Block Slips!" : "≤ θ_slip ➔ Block Stays Stationary"}`,
            description: "Maximum angle at which static friction can prevent sliding.",
            badge: "Slip Condition",
          },
          {
            title: "Downslope Acceleration (a)",
            symbolic: "a = g · (sin θ - μ_k · cos θ)",
            substitution: `a = ${gravity} × (sin(${angle}°) - ${muK} · cos(${angle}°))\n  = ${accel.toFixed(2)} m/s²`,
            description: "Net acceleration when incline angle exceeds critical slip angle.",
            badge: "Kinematic Acceleration",
          },
        ];

        return { title: "Friction & Incline Equations", formulas };
      }

      case "sound": {
        const {
          freq = 440,
          amp = 1.0,
          phase = 0,
          temp = 20,
          medium = "gas",
          telemetry = {},
        } = data;

        const speed = telemetry.v ?? (331.3 + 0.606 * temp);
        const wavelength = telemetry.wavelength ?? (speed / freq);
        const period = telemetry.period ?? (1 / freq);
        const omega = telemetry.omega ?? (2 * Math.PI * freq);
        const k = telemetry.k ?? ((2 * Math.PI) / wavelength);
        const nodes = telemetry.nodes ?? 0;
        const tEcho = telemetry.tEcho;

        const formulas = [
          {
            title: "Harmonic Wave Equation",
            symbolic: "y(x,t) = A · sin(ω · t - k · x + ϕ)",
            substitution: `y(x,t) = ${amp.toFixed(2)} · sin(${omega.toFixed(1)}t - ${k.toFixed(3)}x + ${phase}°)`,
            description: "Mathematical expression describing longitudinal pressure oscillations.",
            badge: "Wave Model",
          },
          {
            title: "Speed of Sound in Medium (v)",
            symbolic: medium === "gas" ? "v_air ≈ 331.3 · √(1 + T / 273.15) (m/s)" : "v = f · λ",
            substitution: `v = ${speed.toFixed(0)} m/s (Medium: ${medium.toUpperCase()}, T = ${temp}°C)`,
            description: "Velocity of pressure propagation governed by medium elasticity & density.",
            badge: "Wave Velocity",
          },
          {
            title: "Wavelength (λ) & Wave Number (k)",
            symbolic: "λ = v / f   |   k = 2π / λ",
            substitution: `λ = (${speed.toFixed(0)} m/s) / (${freq} Hz) = ${wavelength.toFixed(2)} m\nk = 2π / ${wavelength.toFixed(2)} = ${k.toFixed(3)} rad/m`,
            description: "Spatial distance per cycle and angular wave number per meter.",
            badge: "Spatial Dynamics",
          },
          {
            title: "Temporal Period (T), Angular Frequency (ω) & Echo",
            symbolic: "T = 1 / f   |   ω = 2π · f   |   t_echo = 2D / v",
            substitution: `T = 1 / ${freq} Hz = ${period >= 1 ? period.toFixed(2) + " s" : (period * 1000).toFixed(1) + " ms"}\nω = 2π × ${freq} = ${omega.toFixed(1)} rad/s\nStanding Nodes: ${nodes}  |  Echo Time: ${tEcho !== null && tEcho !== undefined ? tEcho.toFixed(3) + " s" : "N/A"}`,
            description: "Time duration per cycle, angular frequency in rad/s, and round-trip echo time.",
            badge: "Temporal & Echo",
          },
        ];

        return { title: "Sound Wave Equations", formulas };
      }

      case "optics": {
        const {
          mode = "bench",
          telemetry = {},
        } = data;

        if (mode === "reflect_refract") {
          const thetaI = telemetry.thetaI ?? 45;
          const thetaR = telemetry.thetaR ?? 45;
          const thetaT = telemetry.thetaT;
          const n1 = telemetry.n1 ?? 1.0;
          const n2 = telemetry.n2 ?? 1.5;
          const tir = telemetry.tir ?? false;
          const thetaC = telemetry.thetaC;

          const formulas = [
            {
              title: "Snell's Law of Refraction",
              symbolic: "n₁ · sin(θ_i) = n₂ · sin(θ_t)",
              substitution: `${n1.toFixed(2)} · sin(${thetaI.toFixed(1)}°) = ${n2.toFixed(2)} · sin(${tir ? "TIR" : (thetaT !== undefined ? thetaT.toFixed(1) + "°" : "—")})`,
              description: "Governs the bending of light rays crossing the boundary between optical media.",
              badge: "Refraction",
            },
            {
              title: "Law of Reflection",
              symbolic: "θ_r = θ_i",
              substitution: `θ_r = ${thetaR.toFixed(1)}° (Equal to Angle of Incidence θ_i = ${thetaI.toFixed(1)}°)`,
              description: "Specular reflection angle relative to normal surface line.",
              badge: "Reflection",
            },
            {
              title: "Critical Angle for Total Internal Reflection (θ_c)",
              symbolic: "sin(θ_c) = n₂ / n₁   (for n₁ > n₂)",
              substitution: n1 > n2 && thetaC !== undefined
                ? `θ_c = arcsin(${n2.toFixed(2)} / ${n1.toFixed(2)}) = ${thetaC.toFixed(1)}°\nStatus: ${tir ? "Total Internal Reflection (θ_i > θ_c)" : "Partial Reflection & Refraction"}`
                : `n₁ (${n1.toFixed(2)}) ≤ n₂ (${n2.toFixed(2)}) ➔ No TIR possible`,
              description: "Incidence angle threshold beyond which no light refracts into medium 2.",
              badge: "TIR Threshold",
            },
          ];

          return { title: "Light Bending & Refraction Equations", formulas };
        }

        if (mode === "eye") {
          const defect = telemetry.defect || "myopia";
          const diopt = telemetry.corrDiopt ?? 2.0;
          const onRetina = telemetry.onRetina ?? false;

          const formulas = [
            {
              title: "Lens Diopter Power (P)",
              symbolic: "P = 1 / f (in meters)",
              substitution: `Correction Power P = ${diopt.toFixed(1)} D ➔ Lens Focal Length f = ${(1000 / diopt).toFixed(0)} mm`,
              description: "Refractive optical power measured in reciprocal meters (Diopters).",
              badge: "Diopters",
            },
            {
              title: "Eye Focal Correction Equation",
              symbolic: "P_total = P_eye + P_lens",
              substitution: `Target Focus: Retina\nDefect: ${defect.toUpperCase()}\nStatus: ${onRetina ? "Focal Point on Retina ✓ (Clear Vision)" : "Adjust Diopter Power to focus on Retina"}`,
              description: "Combines spectacle lens power with crystalline lens to move focal point to retina.",
              badge: "Retinal Focus",
            },
          ];

          return { title: "Optics & Vision Correction Equations", formulas };
        }

        // Default Bench mode
        const u = telemetry.u ?? -280;
        const v = telemetry.v;
        const f = telemetry.f ?? -120;
        const m = telemetry.m;
        const h_o = telemetry.h_o ?? 60;
        const h_i = telemetry.h_i;
        const power = telemetry.power ?? (1000 / f);
        const nature = telemetry.nature;
        const scaleText = telemetry.scaleText;

        const formulas = [
          {
            title: "Thin Lens / Mirror Formula",
            symbolic: "1 / f = 1 / v - 1 / u   ➔   v = (f · u) / (f + u)",
            substitution: isFinite(v)
              ? `u = ${u.toFixed(1)} px  |  f = ${f > 0 ? "+" : ""}${f.toFixed(1)} px\nv = (${f.toFixed(1)} · ${u.toFixed(1)}) / (${f.toFixed(1)} + (${u.toFixed(1)})) = ${v > 0 ? "+" : ""}${v.toFixed(1)} px`
              : `v = ∞ (Parallel rays, object at focus f)`,
            description: "New Cartesian sign convention relation: object distance u is negative in front of optic element.",
            badge: "Lens Formula",
          },
          {
            title: "Linear Magnification (m)",
            symbolic: "m = v / u = H_i / H_o",
            substitution: isFinite(m)
              ? `m = (${isFinite(v) ? v.toFixed(1) : "0"}) / (${u.toFixed(1)}) = ${m > 0 ? "+" : ""}${m.toFixed(2)}\nH_o = ${h_o.toFixed(1)} px  |  H_i = ${isFinite(h_i) ? (h_i > 0 ? "+" : "") + h_i.toFixed(1) + " px" : "∞"}\nScale: ${scaleText || "—"}  |  Nature: ${nature || "—"}`
              : `m = ∞ (Infinite magnification)`,
            description: "Ratio of image height to object height. Negative m indicates inverted orientation.",
            badge: "Magnification",
          },
          {
            title: "Lens Power (P)",
            symbolic: "P = 1000 / f (in px/mm)",
            substitution: isFinite(power)
              ? `P = 1000 / (${f > 0 ? "+" : ""}${f.toFixed(1)} px) = ${power > 0 ? "+" : ""}${power.toFixed(2)} Diopters (D)`
              : "P = 0 D",
            description: "Optical refractive power rating in Diopters (D). Negative for diverging, positive for converging.",
            badge: "Power (D)",
          },
        ];

        return { title: "Geometric Optics Equations", formulas };
      }

      case "power":
      case "circuit": {
        const { solverResults = {}, components = [] } = data;
        const { voltages = {}, currents = {}, powers = {}, isShortCircuit = false } = solverResults;

        // Calculate total circuit metrics
        const battery = components.find(c => c.type === "battery");
        const totalV = battery ? (battery.value || 9) : 9;
        const totalI = battery ? Math.abs(currents[battery.id] || 0) : 0;
        
        // Sum of all load resistances (resistors + bulbs)
        const loadResistors = components.filter(c => c.type === "resistor" || c.type === "bulb");
        const totalNominalR = loadResistors.reduce((sum, c) => sum + (c.value || 0), 0);
        const equivalentR = totalI > 0 ? (totalV / totalI) : totalNominalR;
        const totalPower = totalV * totalI;

        const formulas = [
          {
            title: "Ohm's Law (V = I · R)",
            symbolic: "V = I · R   |   I = V / R   |   R = V / I",
            substitution: `Voltage (V) = ${totalV.toFixed(2)} V\nCurrent (I) = ${totalI.toFixed(2)} A\nEquivalent Load (R) = ${equivalentR.toFixed(2)} Ω`,
            description: "Fundamental law relating potential difference (V), current flow (I), and total resistance (R).",
            badge: "Fundamental Law",
          },
          {
            title: "Joule's Power & Heat (P)",
            symbolic: "P = V · I = I² · R = V² / R",
            substitution: `Total Dissipated Power (P) = ${totalV.toFixed(2)} V × ${totalI.toFixed(2)} A = ${totalPower.toFixed(2)} W\nCircuit Status: ${isShortCircuit ? "⚠️ Short Circuit (Overcurrent Burnout Risk!)" : "Normal Operation ✓"}`,
            description: "The rate at which electric potential energy is converted to light or heat energy.",
            badge: "Power (Watts)",
          },
          {
            title: "Equivalent Resistance (R_eq)",
            symbolic: "Series: R_eq = ∑ Rᵢ   |   Parallel: 1/R_eq = ∑ (1/Rᵢ)",
            substitution: `R_eq = V_source / I_total = ${totalV.toFixed(2)} V / ${totalI.toFixed(3)} A = ${equivalentR.toFixed(2)} Ω`,
            description: "Combines individual branch resistances into a single equivalent load value.",
            badge: "Network Resistance",
          },
          {
            title: "Kirchhoff's Laws (KVL & KCL)",
            symbolic: "KVL: ∑ V_loop = 0   |   KCL: ∑ I_in = ∑ I_out",
            substitution: `Loop EMF Sum = ${totalV.toFixed(2)} V\nNodes Tracked = ${components.length} components connected\nCharge Conservation: Active`,
            description: "Conservation of energy around closed loops (KVL) and conservation of charge at junctions (KCL).",
            badge: "Conservation Laws",
          },
        ];

        return { title: "Electric Circuit & Power Equations", formulas };
      }

      default:
        return { title: "Physics Formulas", formulas: [] };
    }
  };

  const { title, formulas } = renderFormulaContent();
  const currentFormula = formulas[activeTab] || formulas[0];
  const isDocked = position === "dock";

  return (
    <AnimatePresence>
      <motion.div
        drag={!isDocked}
        dragMomentum={false}
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={
          isDocked
            ? "relative z-20 w-full shrink-0 overflow-hidden rounded-xl border backdrop-blur-xl"
            : `absolute ${position === "right" ? "right-4" : "left-4"} top-16 z-30 w-fit max-w-md overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl`
        }
        style={{
          background: "rgba(13, 17, 23, 0.92)",
          borderColor: "rgba(88, 166, 255, 0.3)",
          boxShadow: isDocked ? "0 8px 24px rgba(0,0,0,0.12)" : "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(88,166,255,0.15)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header Bar */}
        <div
          onClick={() => setIsMinimized((prev) => !prev)}
          className={`group relative flex items-center justify-between px-4 py-3 border-b select-none overflow-hidden transition-all duration-300 hover:bg-slate-800/50 ${isDocked ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
          style={{
            borderColor: "rgba(48, 54, 61, 0.8)",
            background: "linear-gradient(90deg, rgba(88,166,255,0.14) 0%, rgba(13,17,23,0.4) 100%)",
          }}
        >
          {/* Sweeping Light Beam Shine Effect on Hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-400/30 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_14px_rgba(6,182,212,0.6)]">
              <Sigma size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 leading-none transition-colors duration-300 group-hover:text-cyan-300">
                {title}
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none transition-colors duration-300 group-hover:text-slate-300">
                Showcasing mathematical equations &amp; live substitution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized((prev) => !prev);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
              title={isMinimized ? "Expand formulas" : "Minimize formulas"}
            >
              {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Hide formulas"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className={`p-3 flex flex-col gap-3 ${isDocked ? "max-h-64 overflow-y-auto" : ""}`}>
            {/* Tabs selection */}
            <div className="flex items-center gap-1 overflow-x-auto p-1">
              {formulas.map((f, idx) => (
                <button
                  key={f.title}
                  onClick={() => setActiveTab(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap border transition-all ${activeTab === idx
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                >
                  {f.badge || `Eq ${idx + 1}`}
                </button>
              ))}
            </div>

            {/* Active Formula Detail Box */}
            {currentFormula && (
              <motion.div
                key={currentFormula.title}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2.5 rounded-xl border p-3 bg-slate-900/80"
                style={{ borderColor: "rgba(48, 54, 61, 0.9)" }}
              >
                {/* Title & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    {currentFormula.title}
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentFormula.badge}
                  </span>
                </div>

                {/* Symbolic Formula Box */}
                <div className="rounded-lg p-2.5 bg-black/50 border border-cyan-500/20 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Symbolic Equation
                  </span>
                  <code className="text-xs font-mono font-bold text-amber-300 whitespace-pre-wrap leading-relaxed">
                    {currentFormula.symbolic}
                  </code>
                </div>

                {/* Live Numeric Substitution Box */}
                <div className="rounded-lg p-2.5 bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400">
                    Live Numerical Substitution
                  </span>
                  <code className="text-[11px] font-mono font-semibold text-cyan-200 whitespace-pre-wrap leading-relaxed">
                    {currentFormula.substitution}
                  </code>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-300 leading-snug">
                  {currentFormula.description}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
