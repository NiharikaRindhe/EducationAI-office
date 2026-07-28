import REACTION_TYPES from "../constants/REACTION_TYPES";

export default function ReactionTypeBadge({ type }) {
  const meta = REACTION_TYPES[type];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
}
