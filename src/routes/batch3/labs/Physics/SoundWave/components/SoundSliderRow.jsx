import { useState, useEffect, useRef } from "react";
import { CLR } from "../constants/soundConstants";
import InfoTooltip from "./InfoTooltip";

export default function SoundSliderRow({ label, value, min, max, step = 0.1, unit, onChange, hint, accentColor, info }) {
  const [raw,     setRaw]   = useState(fmt(value, step));
  const [focused, setFocus] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (!focused) setRaw(fmt(value, step)); }, [value, step, focused]);

  const commit = (str) => {
    const n = parseFloat(str);
    if (!isNaN(n)) { const c = clamp(n, min, max); onChange(c); setRaw(fmt(c, step)); }
    else setRaw(fmt(value, step));
  };

  const nudge = (dir) => onChange(clamp(parseFloat((value + dir * step).toFixed(10)), min, max));

  const handleChange  = (e) => { setRaw(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) onChange(clamp(n, min, max)); };
  const handleKeyDown = (e) => {
    if (e.key === "Enter")     { commit(raw); inputRef.current?.blur(); }
    if (e.key === "Escape")    { setRaw(fmt(value, step)); inputRef.current?.blur(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); nudge(+1); }
    if (e.key === "ArrowDown") { e.preventDefault(); nudge(-1); }
  };

  const accent = accentColor || CLR.wave;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col shrink-0 max-w-[55%]">
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: CLR.muted }}>
            {label}
            {info && <InfoTooltip text={info} />}
          </span>
          {hint && <span className="text-[10px]" style={{ color: "rgba(139,148,158,0.55)" }}>{hint}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="flex items-center rounded-md overflow-hidden border"
            style={{ borderColor: focused ? accent : CLR.border, transition: "border-color 0.15s" }}
          >
            <StepBtn onClick={() => nudge(-1)} disabled={value <= min} accent={accent} />
            <input
              ref={inputRef} type="text" inputMode="decimal" value={raw}
              onChange={handleChange}
              onFocus={() => { setFocus(true); inputRef.current?.select(); }}
              onBlur={(e)  => { setFocus(false); commit(e.target.value); }}
              onKeyDown={handleKeyDown}
              className="w-14 text-xs text-center outline-none border-x py-0.5"
              style={{ background: CLR.bg, borderColor: focused ? accent : CLR.border, color: CLR.text, transition: "border-color 0.15s" }}
            />
            <StepBtn onClick={() => nudge(+1)} disabled={value >= max} plus accent={accent} />
          </div>
          {unit && <span className="text-xs shrink-0 w-7" style={{ color: CLR.muted }}>{unit}</span>}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function StepBtn({ onClick, disabled, plus, accent }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      className="flex items-center justify-center w-6 h-6 text-sm font-bold select-none"
      style={{ background: "transparent", color: disabled ? CLR.border : CLR.muted, cursor: disabled ? "not-allowed" : "pointer", transition: "color 0.12s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = accent; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = CLR.muted; }}
    >{plus ? "+" : "−"}</button>
  );
}

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function fmt(n, step) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  const d = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  return n.toFixed(d);
}
