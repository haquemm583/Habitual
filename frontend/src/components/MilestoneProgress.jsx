function MilestoneProgress({ tasks, habits }) {
  if (!tasks.length && !habits.length) {
    return <p className="mt-2 text-sm text-muted">No linked tasks or habits</p>;
  }

  const taskCount = tasks.filter((task) => task.completed).length;
  const checkIns = { completed: 0, scheduled: 0 };
  for (const habit of habits) {
    if (habit.archived) continue;
    checkIns.completed += habit.week.completed;
    checkIns.scheduled += habit.week.scheduled;
  }
  const indicators = [
    { label: 'Tasks done', completed: taskCount, total: tasks.length, fill: 'bg-progress-task' },
    { label: 'Habit check-ins this week', completed: checkIns.completed, total: checkIns.scheduled, fill: 'bg-progress-habit' },
  ];

  return (
    <div className="mt-3 grid gap-x-5 gap-y-3 text-sm text-muted sm:grid-cols-2">
      {indicators.map(({ label, completed, total, fill }) => (
        <div key={label} className="min-w-0">
          <p className="mb-1.5 flex flex-wrap justify-between gap-x-2 gap-y-0.5">
            <span>{label}</span>
            <span className="font-semibold text-foreground tabular-nums">{completed}/{total}</span>
          </p>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-stroke/30">
            <div className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 ${fill}`}
              style={{ width: `${total ? completed / total * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MilestoneProgress;
