import { useState, useEffect, useRef } from "react";
import { CLR } from "../constants/physicsConstants";

// ─── Custom stepper input ─────────────────────────────────────────────────────
// Replaces the browser's ugly native spin buttons with clean ＋ / ﹣ icon buttons
// that match the obsidian palette. The text field itself is type="text" so no
// browser chrome appears at all.

export default function SliderRow({ label, value, min, max, step = 0.1, unit, onChange }) {
  const [raw,     setRaw]  = useState(formatVal(value, step));
  const [focused, setFocus] = useState(false);
  const inputRef = useRef(null);

  // Sync display when value changes externally (slider move, reset, etc.)
  useEffect(() => {
    if (!focused) setRaw(formatVal(value, step));
  }, [value, step, focused]);

  // ── Commit a string → clamped number ──────────────────────────────────────
  const commit = (str) => {
    const n = parseFloat(str);
    if (!isNaN(n)) {
      const clamped = clamp(n, min, max);
      onChange(clamped);
      setRaw(formatVal(clamped, step));
    } else {
      setRaw(formatVal(value, step));
    }
  };

  // ── Step helpers ───────────────────────────────────────────────────────────
  const nudge = (dir) => {
    const next = clamp(
      parseFloat((value + dir * step).toFixed(10)),
      min, max
    );
    onChange(next);
  };

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const str = e.target.value;
    setRaw(str);
    const n = parseFloat(str);
    if (!isNaN(n)) onChange(clamp(n, min, max));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")     { commit(raw); inputRef.current?.blur(); }
    if (e.key === "Escape")    { setRaw(formatVal(value, step)); inputRef.current?.blur(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); nudge(+1); }
    if (e.key === "ArrowDown") { e.preventDefault(); nudge(-1); }
  };

  return (
    <div className="flex flex-col gap-1.5">

      {/* ── Label row ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium shrink-0" style={{ color: CLR.muted }}>
          {label}
        </span>

        {/* ── Stepper widget ── */}
        <div
          className="flex items-center rounded-md overflow-hidden border shrink-0"
          style={{ borderColor: focused ? CLR.accent : CLR.border, transition: "border-color 0.15s" }}
        >
          {/* Decrement */}
          <StepBtn
            onClick={() => nudge(-1)}
            disabled={value <= min}
            label="−"
          />

          {/* Text field — type="text" so no browser spinner ever appears */}
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={handleChange}
            onFocus={() => { setFocus(true); inputRef.current?.select(); }}
            onBlur={(e) => { setFocus(false); commit(e.target.value); }}
            onKeyDown={handleKeyDown}
            className="w-14 text-xs text-center outline-none border-x py-0.5"
            style={{
              background:  CLR.bg,
              borderColor: focused ? CLR.accent : CLR.border,
              color:       CLR.text,
              transition:  "border-color 0.15s",
            }}
          />

          {/* Increment */}
          <StepBtn
            onClick={() => nudge(+1)}
            disabled={value >= max}
            label="+"
          />
        </div>

        {/* Unit label */}
        {unit && (
          <span className="text-xs shrink-0 w-5" style={{ color: CLR.muted }}>
            {unit}
          </span>
        )}
      </div>

      {/* ── Range slider ── */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-0.5 bg-gray-800 my-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: CLR.accent }}
      />

    </div>
  );
}

// ─── Step button ──────────────────────────────────────────────────────────────
function StepBtn({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={e => e.preventDefault()} // prevent blur on input
      className="flex items-center justify-center w-6 h-6 text-sm font-bold select-none transition-colors"
      style={{
        background: "transparent",
        color:      disabled ? CLR.border : CLR.muted,
        cursor:     disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = CLR.text; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = CLR.muted; }}
    >
      {label}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function formatVal(n, step) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  return n.toFixed(decimals);
}
