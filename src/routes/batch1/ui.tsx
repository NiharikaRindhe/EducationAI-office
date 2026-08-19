import React from 'react';
import { Link } from 'react-router-dom';
import { artUrl } from './art';

/**
 * Batch 1 UI kit — the shared vocabulary for the Class 1–4 portal.
 *
 * Before this file every page invented its own radii, shadows, press
 * animations and text sizes inline, so two cards sitting next to each other
 * rarely agreed on anything. Everything a Batch 1 page draws now comes from
 * here, which is what makes the portal look deliberate instead of assembled.
 *
 * Three rules the kit enforces, all of them about six-year-olds:
 *
 *  1. NOTHING IS UNLABELLED. The old code hid every text label for Class 1–2
 *     on the theory that they cannot read, which left them six identical
 *     coloured rectangles to choose between. A picture with a word under it
 *     teaches the word; a picture alone teaches nothing. Labels always render.
 *  2. TAP TARGETS ARE BIG. `TAP` below is 64px, above the 48px adult minimum,
 *     because these are small hands on shared lab mice and touch monitors.
 *  3. PICTURES GO THROUGH `<Pic>`. Never render an emoji directly — Pic is the
 *     seam that swaps the whole portal to real artwork later (see art.ts).
 */

/* ── Tokens ────────────────────────────────────────────────────────────── */

export const T = {
  /** Corner radii. Three steps, no in-between values. */
  radius: { sm: 16, md: 24, lg: 32 },
  /** Minimum interactive height. Non-negotiable for this age group. */
  tap: 64,
  ink: {
    /** Body and heading text on light surfaces. */
    strong: '#17425F',
    /** Secondary text — labels, captions, counts. */
    muted: '#6E93AC',
    /** Tertiary — only for text that may be missed without harm. */
    faint: '#9DB8CA',
  },
  surface: {
    card: '#FFFFFF',
    sunk: '#F2F8FC',
    line: '#E1EDF5',
  },
  /** The one shadow scale. `press` is the chunky offset that makes a tile
   *  feel like a physical button when it moves down under the finger. */
  shadow: {
    card: '0 4px 0 rgba(20,90,140,.10), 0 10px 22px rgba(20,90,140,.07)',
    raised: '0 6px 0 rgba(20,90,140,.13), 0 14px 28px rgba(20,90,140,.10)',
  },
} as const;

/** Shared press physics — every tappable thing in Batch 1 moves the same way. */
const PRESS = 'transition-transform duration-100 ease-out active:translate-y-[3px] cursor-pointer';

/* ── Pic ───────────────────────────────────────────────────────────────── */

interface PicProps {
  /** The emoji as written in the UI or in games_catalog.params. */
  emoji: string;
  /** Rendered size in px — applies to both the artwork and the emoji fallback. */
  size?: number;
  /** What the picture shows, for screen readers. Omit for decoration. */
  alt?: string;
  /** Optional registry key to prefer over the emoji (e.g. 'nav-play'). */
  name?: string;
  className?: string;
}

/**
 * One picture. Renders registry artwork when art.ts has it, the emoji glyph
 * when it does not — so the portal works identically before and after the
 * artwork exists, and no caller ever has to know which it got.
 */
export const Pic: React.FC<PicProps> = ({ emoji, size = 48, alt, name, className = '' }) => {
  const src = artUrl(name) ?? artUrl(emoji);

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        width={size}
        height={size}
        className={`object-contain select-none ${className}`}
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      className={`inline-flex items-center justify-center leading-none select-none ${className}`}
      // Emoji are drawn at ~0.8 of their box, so scaling the font size up keeps
      // artwork and fallback visually the same size once art lands.
      style={{ width: size, height: size, fontSize: size * 0.86 }}
    >
      {emoji}
    </span>
  );
};

/* ── Card ──────────────────────────────────────────────────────────────── */

/** The standard white surface. Every panel in Batch 1 is one of these. */
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  raised?: boolean;
}> = ({ children, className = '', padded = true, raised = false }) => (
  <div
    className={`bg-white ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
    style={{
      borderRadius: T.radius.md,
      boxShadow: raised ? T.shadow.raised : T.shadow.card,
    }}
  >
    {children}
  </div>
);

/* ── SectionTitle ──────────────────────────────────────────────────────── */

/** A titled section head. `hint` is the one-line explanation under the title;
 *  it is written for the adult in the room as much as for the child. */
export const SectionTitle: React.FC<{
  emoji?: string;
  artKey?: string;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}> = ({ emoji, artKey, title, hint, right }) => (
  <div className="flex items-center gap-3">
    {emoji && <Pic emoji={emoji} name={artKey} size={36} />}
    <div className="flex-1 min-w-0">
      <h2 className="font-display font-black text-lg sm:text-xl leading-tight" style={{ color: T.ink.strong }}>
        {title}
      </h2>
      {hint && (
        <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: T.ink.muted }}>
          {hint}
        </p>
      )}
    </div>
    {right}
  </div>
);

/* ── Button ────────────────────────────────────────────────────────────── */

type ButtonTone = 'primary' | 'secondary' | 'quiet';

const TONE: Record<ButtonTone, { bg: string; shadow: string; color: string; border: string }> = {
  primary: { bg: 'linear-gradient(180deg,#7BE034,#55C400)', shadow: '#3F9C00', color: '#FFFFFF', border: 'transparent' },
  secondary: { bg: 'linear-gradient(180deg,#4FC3FF,#1CA5F1)', shadow: '#0E86CC', color: '#FFFFFF', border: 'transparent' },
  quiet: { bg: '#FFFFFF', shadow: '#CBDDE9', color: T.ink.strong, border: '#E1EDF5' },
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  tone?: ButtonTone;
  /** Fills the width of its container — use inside cards, not in toolbars. */
  block?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * The only button in Batch 1. Renders as a link when `to` is given so that
 * navigation stays a real anchor (middle-click, focus ring, screen readers)
 * while looking identical to an action button.
 */
export const Button: React.FC<ButtonProps> = ({
  children, onClick, to, tone = 'primary', block = false, disabled = false, icon, ariaLabel, className = '',
}) => {
  const t = TONE[tone];
  const cls = `inline-flex items-center justify-center gap-2 font-display font-black text-base sm:text-lg
               px-6 select-none ${block ? 'w-full' : ''} ${disabled ? 'opacity-50 pointer-events-none' : PRESS} ${className}`;
  const style: React.CSSProperties = {
    minHeight: T.tap,
    borderRadius: T.radius.sm,
    background: t.bg,
    color: t.color,
    border: `2px solid ${t.border}`,
    boxShadow: `0 4px 0 ${t.shadow}`,
  };

  const inner = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} style={style} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style} aria-label={ariaLabel}>
      {inner}
    </button>
  );
};

/* ── IconButton ────────────────────────────────────────────────────────── */

/** Square icon-only control (home, exit, back). Always carries an aria-label,
 *  because there is no visible text to read. */
export const IconButton: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
}> = ({ children, label, onClick, to }) => {
  const cls = `inline-flex items-center justify-center bg-white ${PRESS}`;
  const style: React.CSSProperties = {
    width: 52, height: 52,
    borderRadius: T.radius.sm,
    color: T.ink.muted,
    border: `2px solid ${T.surface.line}`,
    boxShadow: '0 3px 0 rgba(20,90,140,.10)',
  };
  if (to) return <Link to={to} aria-label={label} title={label} className={cls} style={style}>{children}</Link>;
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={cls} style={style}>{children}</button>;
};

/* ── ActionTile ────────────────────────────────────────────────────────── */

/**
 * A big coloured door on the Home screen.
 *
 * `label` is never optional and never hidden. `hint` is the small line under
 * it — shown from Class 3 up, where a child can read a short phrase, and
 * dropped for Class 1–2 so the tile stays a picture and one word.
 */
export interface TileMeter {
  /** Small picture inside the meter pill, left of the bar. */
  emoji: string;
  value: number;
  max: number;
  /** Overrides the "value / max" readout, e.g. "60%" or "+6". */
  readout?: string;
}

export const ActionTile: React.FC<{
  to: string;
  emoji: string;
  artKey?: string;
  label: string;
  /** One short phrase under the title. Always shown — see the note in Home. */
  subtitle?: string;
  from: string;
  to_: string;
  shadow: string;
  badge?: number;
  /** Progress along the bottom. Omitted when nothing real can be measured. */
  meter?: TileMeter;
  /** Shown in the meter's place when there is no progress to report. */
  caption?: string;
}> = ({ to, emoji, artKey, label, subtitle, from, to_, shadow, badge, meter, caption }) => (
  <Link
    to={to}
    className={`group relative flex flex-col items-center overflow-hidden text-center px-4 pt-6 pb-4 ${PRESS}`}
    style={{
      minHeight: 268,
      borderRadius: T.radius.lg,
      background: `linear-gradient(160deg, ${from}, ${to_})`,
      boxShadow: `0 6px 0 ${shadow}, 0 18px 30px ${to_}40`,
    }}
  >
    {/* Glossy highlight across the top third. Purely decorative. */}
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 pointer-events-none"
      style={{ height: '46%', background: 'linear-gradient(180deg, rgba(255,255,255,.26), rgba(255,255,255,0))' }}
    />
    {/* A couple of sparkles, so a flat panel reads as somewhere to go. */}
    <span aria-hidden="true" className="absolute top-4 left-4 text-white/45 text-sm select-none">✦</span>
    <span aria-hidden="true" className="absolute top-12 right-6 text-white/30 text-xs select-none">✦</span>

    {/* Count of things waiting behind this door — only when there are any. */}
    {badge !== undefined && badge > 0 && (
      <span
        className="absolute top-3.5 right-3.5 min-w-[36px] h-[36px] px-2.5 inline-flex items-center justify-center
                   rounded-full bg-white font-display font-black text-base z-10"
        style={{ color: shadow, boxShadow: '0 2px 0 rgba(0,0,0,.12)' }}
      >
        {badge}
      </span>
    )}

    <span className="flex-1 flex items-center justify-center">
      <Pic
        emoji={emoji}
        name={artKey}
        size={88}
        className="drop-shadow-[0_4px_6px_rgba(0,0,0,.22)] transition-transform duration-200 group-hover:scale-105"
      />
    </span>

    <span
      className="font-display font-black text-white text-lg xl:text-xl leading-tight tracking-wide"
      style={{ textShadow: '0 2px 3px rgba(0,0,0,.22)' }}
    >
      {label}
    </span>

    {subtitle && (
      <span className="font-bold text-[11px] xl:text-xs text-white/85 leading-snug mt-0.5 mb-3 px-1">
        {subtitle}
      </span>
    )}

    {/* Footer: how far along this child is behind this door. */}
    {meter ? (
      <span
        className="w-full mt-auto flex items-center gap-2 px-2.5 py-2"
        style={{ borderRadius: T.radius.sm, background: 'rgba(255,255,255,.22)' }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.92)' }}
        >
          <Pic emoji={meter.emoji} size={16} />
        </span>
        <span className="flex-1 overflow-hidden" style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.35)' }}>
          <span
            className="block h-full"
            style={{
              width: `${meter.max > 0 ? Math.min(100, Math.round((meter.value / meter.max) * 100)) : 0}%`,
              borderRadius: 999,
              background: '#FFFFFF',
              transition: 'width .5s ease-out',
            }}
          />
        </span>
        <span className="font-display font-black text-[11px] text-white whitespace-nowrap">
          {meter.readout ?? `${meter.value} / ${meter.max}`}
        </span>
      </span>
    ) : caption ? (
      <span
        className="w-full mt-auto px-2.5 py-2 font-display font-black text-[11px] text-white"
        style={{ borderRadius: T.radius.sm, background: 'rgba(255,255,255,.22)' }}
      >
        {caption}
      </span>
    ) : null}
  </Link>
);

/* ── StatChip ──────────────────────────────────────────────────────────── */

/** A labelled number in the header — stars, streak. */
export const StatChip: React.FC<{ emoji: string; artKey?: string; label: string; value: React.ReactNode }> = ({
  emoji, artKey, label, value,
}) => (
  <div
    className="flex items-center gap-2 bg-white px-3.5"
    style={{ height: 52, borderRadius: T.radius.sm, border: `2px solid ${T.surface.line}`, boxShadow: '0 3px 0 rgba(20,90,140,.10)' }}
  >
    <Pic emoji={emoji} name={artKey} size={22} />
    <span className="leading-none">
      <span className="block text-[9px] font-black tracking-[.14em] mb-0.5" style={{ color: T.ink.faint }}>
        {label}
      </span>
      <span className="block font-display font-black text-base" style={{ color: T.ink.strong }}>
        {value}
      </span>
    </span>
  </div>
);

/* ── StarRow ───────────────────────────────────────────────────────────── */

/** Three stars, filled to `earned`. Drawn, not emoji, so they stay identical
 *  across Windows/Android/iOS lab machines. */
export const StarRow: React.FC<{ earned: number; size?: number }> = ({ earned, size = 22 }) => (
  <span className="inline-flex gap-1" role="img" aria-label={`${earned} of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z"
          fill={n <= earned ? '#FFC400' : '#DFEAF2'}
          stroke={n <= earned ? '#E0A400' : '#CFDDE8'}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    ))}
  </span>
);

/* ── ProgressBar ───────────────────────────────────────────────────────── */

export const ProgressBar: React.FC<{ value: number; max: number; className?: string }> = ({ value, max, className = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ height: 12, borderRadius: 999, background: T.surface.sunk }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg,#FFD43B,#FFB100)',
          transition: 'width .45s ease-out',
        }}
      />
    </div>
  );
};

/* ── EmptyState ────────────────────────────────────────────────────────── */

/**
 * What a child sees when there is genuinely nothing here.
 *
 * The old screens printed a grey adult sentence — "No exams assigned yet —
 * they'll appear here when your teacher publishes one." — on an otherwise
 * blank page. This says the same thing in words a seven-year-old can read,
 * shows a picture, and always offers somewhere to go instead of dead-ending.
 */
export const EmptyState: React.FC<{
  emoji: string;
  artKey?: string;
  title: string;
  body?: string;
  action?: { label: string; to: string };
}> = ({ emoji, artKey, title, body, action }) => (
  // Capped and centred on purpose: an empty state is the one place where a
  // narrow column is right, because there is nothing to fill a wide one with.
  <Card className="flex flex-col items-center gap-3 text-center py-12 w-full max-w-xl mx-auto">
    <Pic emoji={emoji} name={artKey} size={80} />
    <h3 className="font-display font-black text-xl" style={{ color: T.ink.strong }}>{title}</h3>
    {body && <p className="text-sm font-semibold max-w-sm" style={{ color: T.ink.muted }}>{body}</p>}
    {action && <Button to={action.to} tone="secondary" className="mt-2">{action.label}</Button>}
  </Card>
);

/* ── PageHeader ────────────────────────────────────────────────────────── */

/** The title block every inner page opens with, so they all start the same. */
export const PageHeader: React.FC<{
  emoji: string;
  artKey?: string;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}> = ({ emoji, artKey, title, hint, right }) => (
  <div className="flex items-center gap-3 sm:gap-4">
    <div
      className="flex items-center justify-center bg-white shrink-0"
      style={{ width: 64, height: 64, borderRadius: T.radius.md, boxShadow: T.shadow.card }}
    >
      <Pic emoji={emoji} name={artKey} size={40} />
    </div>
    <div className="flex-1 min-w-0">
      <h1 className="font-display font-black text-2xl sm:text-3xl leading-tight" style={{ color: T.ink.strong }}>
        {title}
      </h1>
      {hint && <p className="text-sm font-semibold mt-0.5" style={{ color: T.ink.muted }}>{hint}</p>}
    </div>
    {right}
  </div>
);

/* ── Skeleton ──────────────────────────────────────────────────────────── */

export const Skeleton: React.FC<{ height?: number; className?: string }> = ({ height = 120, className = '' }) => (
  <div
    className={`skeleton-pulse ${className}`}
    style={{ height, borderRadius: T.radius.md, background: T.surface.sunk }}
    aria-hidden="true"
  />
);
