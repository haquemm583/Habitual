import { dateLabel } from '../../habits/api';

function HabitWeekStrip({ habits, today }) {
  const active = habits.filter((habit) => !habit.archived);
  const dates = active[0]?.weekDays;
  if (!dates?.length) return null;

  const days = dates.map(({ date, future }, index) => {
    const scheduled = active.filter((habit) => habit.weekDays?.[index]?.scheduled);
    return {
      date, future,
      scheduled: scheduled.length,
      completed: future ? 0 : scheduled.filter((habit) => habit.weekDays[index].completed).length,
    };
  });

  return (
    <figure className="max-w-sm pt-3">
      <figcaption className="mb-2 text-sm font-semibold text-foreground">This week</figcaption>
      <ol className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map(({ date, future, scheduled, completed }) => {
          const percent = scheduled ? Math.round(completed / scheduled * 100) : 0;
          const count = future
            ? `${scheduled} upcoming check-ins`
            : scheduled ? `${completed} of ${scheduled} check-ins` : 'No habits scheduled';
          const label = dateLabel(date, { weekday: 'long', year: undefined });

          return (
            <li key={date} aria-current={date === today ? 'date' : undefined}
              className={`min-w-0 rounded-md px-0.5 py-1 text-center ${date === today ? 'bg-surface ring-1 ring-inset ring-progress-habit/35' : ''}`}>
              <span className="sr-only">{label}{date === today ? ', today' : ''}, {count}</span>
              <div aria-hidden="true" className="flex flex-col items-center gap-1 text-xs text-muted" title={`${label} · ${count}`}>
                <span className={date === today ? 'font-semibold text-progress-habit' : ''}>
                  {dateLabel(date, { weekday: 'short', month: undefined, day: undefined, year: undefined })}
                </span>
                <span className={`relative h-7 w-2 overflow-hidden rounded-full ${future || !scheduled ? 'border border-progress-habit/20' : 'bg-progress-habit/15'}`}>
                  {!future && scheduled > 0 && (
                    <span className="absolute inset-x-0 bottom-0 rounded-full bg-progress-habit motion-safe:transition-[height] motion-safe:duration-300"
                      style={{ height: `${percent}%` }} />
                  )}
                </span>
                <span className="text-[0.625rem] tabular-nums">
                  {future ? (scheduled ? '•' : '–') : scheduled ? `${completed}/${scheduled}` : '–'}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export default HabitWeekStrip;
