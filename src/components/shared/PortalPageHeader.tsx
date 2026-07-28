import React from 'react';

interface PortalPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PortalPageHeader: React.FC<PortalPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  children,
}) => (
  <section className="portal-page-header">
    <div className="relative z-10 flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="portal-eyebrow">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-[28px]">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  </section>
);

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'sky';
}

const toneStyles = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'slate',
}) => (
  <div className="portal-metric">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-2">
        <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
        {hint && <span className="truncate text-xs text-slate-400">{hint}</span>}
      </div>
    </div>
  </div>
);
