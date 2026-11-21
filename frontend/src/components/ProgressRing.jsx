function ProgressRing({ completed, total, label, tone }) {
  const percent = total ? Math.round(completed / total * 100) : 0;
  const color = tone === 'habit' ? 'var(--color-progress-habit)' : 'var(--color-progress-task)';
  const description = total ? `${label}, ${percent}%` : `${label}, no items`;

  return (
    <div
      role="img"
      aria-label={description}
      className="grid size-14 shrink-0 place-items-center rounded-full border border-transparent motion-safe:transition-[--progress-sweep,box-shadow] motion-safe:duration-300 motion-safe:ease-fluid forced-colors:border-current"
      style={{
        '--progress-sweep': `${percent}%`,
        backgroundImage: `conic-gradient(${color} 0 var(--progress-sweep), var(--color-hover) var(--progress-sweep) 100%)`,
        boxShadow: total > 0 && completed === total ? `0 0 16px color-mix(in srgb, ${color} 30%, transparent)` : undefined,
      }}
    >
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-surface text-xs font-semibold tabular-nums">
        {total ? `${percent}%` : '—'}
      </span>
    </div>
  );
}

export default ProgressRing;
