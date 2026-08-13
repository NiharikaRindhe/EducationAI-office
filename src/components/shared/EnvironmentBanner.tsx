import React from 'react';

/**
 * A strip across the top of every page whenever this is NOT production.
 *
 * The reason it exists: the portals are identical in every environment, so
 * there is nothing on screen to tell a staff member whether the student list
 * they are editing is real. That is how someone resets a real child's PIN
 * while believing they are on the demo box, and how a demo gets given against
 * production data by accident.
 *
 * Driven by VITE_ENV_LABEL. Production sets it empty (or omits it) and the
 * banner disappears — the default is to show nothing rather than to show
 * "PRODUCTION", because a banner that is always there stops being read.
 */

const PRESETS: Record<string, { text: string; className: string }> = {
  local: {
    text: 'LOCAL DEVELOPMENT — data here is disposable',
    className: 'bg-slate-800 text-slate-100',
  },
  demo: {
    text: 'DEMO ENVIRONMENT — sample data, not a real school',
    className: 'bg-indigo-600 text-white',
  },
  staging: {
    text: 'STAGING — not production. Do not enter real student information.',
    className: 'bg-amber-500 text-amber-950',
  },
  test: {
    text: 'TEST ENVIRONMENT — not production. Do not enter real student information.',
    className: 'bg-amber-500 text-amber-950',
  },
};

export const EnvironmentBanner: React.FC = () => {
  const raw = (import.meta.env.VITE_ENV_LABEL ?? '').trim();
  if (!raw) return null;

  const preset = PRESETS[raw.toLowerCase()] ?? {
    // An unrecognised label still shows — an operator who typed something we
    // do not know about still needs to see that this is not production.
    text: `${raw.toUpperCase()} — not production`,
    className: 'bg-amber-500 text-amber-950',
  };

  return (
    <div
      role="status"
      className={`w-full px-4 py-1.5 text-center text-[11px] font-bold tracking-wide select-none ${preset.className}`}
    >
      {preset.text}
    </div>
  );
};
