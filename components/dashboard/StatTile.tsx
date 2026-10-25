interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

export default function StatTile({ label, value, hint, tone = "text-ink" }: Props) {
  return (
    <div className="glass-card p-5">
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-2 font-display text-2xl tracking-tight ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}