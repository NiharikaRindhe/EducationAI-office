import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CLR } from "../constants/frictionConstants";

/**
 * FrictionInfoTooltip — portal-based tooltip that escapes overflow:hidden/auto
 * containers. Renders directly on document.body using fixed positioning.
 *
 * Props:
 *   text – explanation string to display
 */
export default function FrictionInfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef          = useRef(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r    = btnRef.current.getBoundingClientRect();
    const popW = 230;
    const rawL = r.left + r.width / 2 - popW / 2;
    const left = Math.max(8, Math.min(rawL, window.innerWidth - popW - 8));
    setPos({ top: r.top, left });
  };

  const show = () => { calcPos(); setOpen(true);  };
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const rePos = () => calcPos();
    window.addEventListener("scroll", rePos, true);
    window.addEventListener("resize", rePos);
    return () => {
      window.removeEventListener("scroll", rePos, true);
      window.removeEventListener("resize", rePos);
    };
  }, [open]);

  const popover = open && createPortal(
    <div
      role="tooltip"
      style={{
        position:     "fixed",
        top:          pos.top,
        left:         pos.left,
        width:        "230px",
        transform:    "translateY(calc(-100% - 8px))",
        zIndex:       9999,
        background:   "#1c2128",
        border:       `1px solid ${CLR.border}`,
        borderRadius: "8px",
        padding:      "10px 12px",
        fontSize:     "11px",
        lineHeight:   "1.6",
        color:        "#cdd9e5",
        boxShadow:    "0 8px 28px rgba(0,0,0,0.55)",
        pointerEvents:"none",
        whiteSpace:   "normal",
      }}
    >
      {text}
      {/* Downward arrow pointing at the ⓘ button */}
      <span style={{
        position:     "absolute",
        bottom:       "-5px",
        left:         "50%",
        transform:    "translateX(-50%) rotate(45deg)",
        width:        "9px",
        height:       "9px",
        background:   "#1c2128",
        borderRight:  `1px solid ${CLR.border}`,
        borderBottom: `1px solid ${CLR.border}`,
      }} />
    </div>,
    document.body,
  );

  return (
    <span className="relative inline-flex shrink-0">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-label="More information"
        className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none select-none focus:outline-none"
        style={{
          background: open ? "rgba(88,166,255,0.18)" : "rgba(139,148,158,0.12)",
          color:      open ? CLR.accent : CLR.muted,
          border:     `1px solid ${open ? CLR.accent : "rgba(139,148,158,0.25)"}`,
          cursor:     "default",
          transition: "all 0.15s",
        }}
      >
        i
      </button>
      {popover}
    </span>
  );
}
