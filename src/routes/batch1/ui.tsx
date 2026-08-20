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

/** Shared press physics — every tappable thing in Batch 1 moves the same way:
 *  a chunky press-down plus a small squish, so a tap reads as squeezing a
 *  soft clay surface rather than sliding a flat panel. Exported so a page
 *  that builds its own bespoke tappable element (not one of the primitives
 *  below) can still match, instead of inventing its own transition. */
export const PRESS = 'transition-transform duration-100 ease-out active:translate-y-[3px] anim-squish-tap cursor-pointer';

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

type ButtonTone = 'primary' | 'secondary' | 'amber' | 'quiet';

const TONE: Record<ButtonTone, { bg: string; shadow: string; color: string; border: string }> = {
  primary: { bg: 'linear-gradient(180deg,#7BE034,#55C400)', shadow: '#3F9C00', color: '#FFFFFF', border: 'transparent' },
  secondary: { bg: 'linear-gradient(180deg,#4FC3FF,#1CA5F1)', shadow: '#0E86CC', color: '#FFFFFF', border: 'transparent' },
  /** Hint / confirm-adjacent actions inside game engines — every engine
   *  hand-rolled its own amber "Hint"/"Check"/"Confirm" pill before this;
   *  one tone now covers all of them. */
  amber: { bg: 'linear-gradient(180deg,#FFD53E,#FFB100)', shadow: '#DB9A00', color: '#7A5200', border: 'transparent' },
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
 * A big door on the Home screen — one soft, tinted card per subject.
 *
 * Was a bold saturated gradient with white text; now a pale tint of a single
 * `accent` colour with the title set IN that colour, matching the reference
 * mockup (light mint/blue/amber/pink/lilac cards, not solid ones). `label` is
 * never optional and never hidden; `subtitle` is always shown too — see the
 * note in Home about why that changed.
 */
export interface TileMeter {
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
  /** The one colour this tile is built from — everything else derives from it. */
  accent: string;
  badge?: number;
  /** Progress along the bottom. Omitted when nothing real can be measured. */
  meter?: TileMeter;
  /** Shown in the meter's place when there is no progress to report. */
  caption?: string;
}> = ({ to, emoji, artKey, label, subtitle, accent, badge, meter, caption }) => (
  <Link
    to={to}
    className={`group relative flex flex-col items-center overflow-hidden text-center px-4 pt-6 pb-5 ${PRESS}`}
    style={{
      minHeight: 248,
      borderRadius: T.radius.lg,
      background: `color-mix(in srgb, ${accent} 13%, white)`,
      border: `2px solid color-mix(in srgb, ${accent} 20%, white)`,
      boxShadow: `0 4px 0 color-mix(in srgb, ${accent} 26%, white), 0 12px 22px rgba(20,90,140,.06)`,
    }}
  >
    {/* A couple of sparkles in the tile's own colour, so a soft panel still
        reads as somewhere to go rather than a plain swatch. */}
    <span aria-hidden="true" className="absolute top-4 left-4 text-sm select-none" style={{ color: accent, opacity: 0.4 }}>✦</span>
    <span aria-hidden="true" className="absolute top-9 right-5 text-xs select-none" style={{ color: accent, opacity: 0.3 }}>✦</span>

    {/* Count of things waiting behind this door — only when there are any. */}
    {badge !== undefined && badge > 0 && (
      <span
        className="absolute top-3.5 right-3.5 min-w-[30px] h-[30px] px-2 inline-flex items-center justify-center
                   rounded-full text-white font-display font-black text-sm z-10"
        style={{ background: accent, boxShadow: '0 2px 0 rgba(0,0,0,.12)' }}
      >
        {badge}
      </span>
    )}

    <span className="flex-1 flex items-center justify-center">
      <Pic
        emoji={emoji}
        name={artKey}
        size={104}
        className="drop-shadow-[0_6px_10px_rgba(0,0,0,.16)] transition-transform duration-200 group-hover:scale-105"
      />
    </span>

    <span className="font-display font-black text-lg xl:text-xl leading-tight tracking-wide" style={{ color: accent }}>
      {label}
    </span>

    {subtitle && (
      <span className="font-bold text-xs leading-snug mt-1 px-1" style={{ color: T.ink.muted }}>
        {subtitle}
      </span>
    )}

    {/* Footer: how far along this child is behind this door. Thin, so it
        supplements the calm tile rather than dominating it. */}
    {meter ? (
      <span className="w-full mt-3 flex items-center gap-2">
        <span
          className="flex-1 overflow-hidden"
          style={{ height: 8, borderRadius: 999, background: '#FFFFFF', border: `1px solid color-mix(in srgb, ${accent} 22%, white)` }}
        >
          <span
            className="block h-full"
            style={{
              width: `${meter.max > 0 ? Math.min(100, Math.round((meter.value / meter.max) * 100)) : 0}%`,
              borderRadius: 999,
              background: accent,
              transition: 'width .5s ease-out',
            }}
          />
        </span>
        <span className="font-display font-black text-[11px] whitespace-nowrap" style={{ color: accent }}>
          {meter.readout ?? `${meter.value}/${meter.max}`}
        </span>
      </span>
    ) : caption ? (
      <span
        className="mt-3 px-3 py-1.5 font-display font-black text-[11px]"
        style={{ borderRadius: 999, background: '#FFFFFF', color: accent, border: `1px solid color-mix(in srgb, ${accent} 24%, white)` }}
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

/* ── Game chrome ───────────────────────────────────────────────────────────
 *
 * Every one of the 17 game engines hand-rolled its own progress dots, answer
 * buttons and finish screen — same idea, 15+ slightly different
 * implementations (amber-400 in one file, amber-500 in the next, a raw
 * lucide <Star> loop instead of StarRow, "rounded-2xl" here and
 * "rounded-xl" there). That's why a Fraction game and a Crossword didn't
 * quite feel like the same product. These three cover the shared 90% of
 * every engine's chrome; each engine keeps its own board/canvas/drag logic —
 * only the surrounding UI language is now one thing.
 * ────────────────────────────────────────────────────────────────────── */

/** The row of dots every engine shows for "question 2 of 5". */
export const GameProgressDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
  <div
    className="flex gap-2"
    role="progressbar"
    aria-valuenow={current + 1}
    aria-valuemin={1}
    aria-valuemax={total}
    aria-label={`Question ${current + 1} of ${total}`}
  >
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className="rounded-full transition-all duration-200"
        style={{
          width: i === current ? 16 : 13,
          height: i === current ? 16 : 13,
          background: i < current ? '#3FA84B' : i === current ? '#F2A03D' : T.surface.line,
        }}
      />
    ))}
  </div>
);

export type GameOptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

const OPTION_PALETTE: Record<GameOptionState, { bg: string; color: string; border: string; shadow: string }> = {
  idle: { bg: '#FFFFFF', color: T.ink.strong, border: T.surface.line, shadow: '0 3px 0 rgba(20,90,140,.10)' },
  correct: { bg: '#3FCB6E', color: '#FFFFFF', border: 'transparent', shadow: '0 3px 0 #2E9E54' },
  wrong: { bg: '#F0554C', color: '#FFFFFF', border: 'transparent', shadow: '0 3px 0 #C33F38' },
  dimmed: { bg: T.surface.sunk, color: T.ink.faint, border: T.surface.line, shadow: 'none' },
};

/**
 * The dominant control inside every game — an answer choice. One visual
 * language for all of it: a number square, a word pill, an MCQ row, a
 * crossword-pool tile. Sizing/layout (width, padding, grid placement) stays
 * with each engine via `className`/`style`; this owns color, state and feel.
 */
export const GameOption: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  state?: GameOptionState;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}> = ({ children, onClick, state = 'idle', disabled = false, className = '', style, ariaLabel }) => {
  const p = OPTION_PALETTE[state];
  const anim = state === 'correct' ? 'animate-glow-green' : state === 'wrong' ? 'animate-game-shake' : '';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`font-display font-black select-none ${disabled && state === 'idle' ? 'opacity-60' : PRESS} ${anim} ${className}`}
      style={{
        minHeight: T.tap,
        borderRadius: T.radius.sm,
        background: p.bg,
        color: p.color,
        border: `2px solid ${p.border}`,
        boxShadow: p.shadow,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

/**
 * The screen every game ends on: trophy, stars, an optional score line (hidden
 * for Class 1–2 per the pre-reader rule the rest of the kit follows), Play
 * Again. Real clay trophy art via `<Pic>` once generated — emoji until then,
 * automatically, same seam as everywhere else.
 */
export const GameFinishScreen: React.FC<{
  earned: number;
  /** e.g. "4 of 5 correct" — omit for pre-readers or when a count doesn't apply. */
  scoreLabel?: string;
  onPlayAgain: () => void;
}> = ({ earned, scoreLabel, onPlayAgain }) => (
  <div className="flex flex-col items-center gap-4 py-10 anim-fade-up">
    <Pic emoji="🏆" name="nav-trophies" size={76} className="drop-shadow-[0_4px_6px_rgba(0,0,0,.18)]" />
    <StarRow earned={earned} size={34} />
    {scoreLabel && (
      <p className="font-display font-bold text-sm" style={{ color: T.ink.muted }}>{scoreLabel}</p>
    )}
    <Button tone="primary" onClick={onPlayAgain} className="mt-1">
      🔄 Play Again
    </Button>
  </div>
);
