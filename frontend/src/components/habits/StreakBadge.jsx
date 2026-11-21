function StreakBadge({ count }) {
  if (!count) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-progress-goal"
      title="Consecutive scheduled check-ins">
      <span key={count} aria-hidden="true" className="inline-block leading-none drop-shadow-[0_0_5px_#f59e0b80] motion-safe:animate-streak-flame">🔥</span>
      <span>{count} {count === 1 ? 'day' : 'days'} in a row</span>
    </span>
  );
}

export default StreakBadge;
