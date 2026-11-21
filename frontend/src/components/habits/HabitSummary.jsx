import { dayCount } from '../../habits/api';

function HabitSummary({ summary }) {
  const stats = [
    ['Today', `${summary.today.completed}/${summary.today.scheduled}`],
    ['This week', `${summary.week.percent}%`],
    ['Selected month', `${summary.month.percent}%`],
    ['Best current streak', dayCount(summary.bestCurrentStreak)],
    ['Longest streak', dayCount(summary.longestStreak)],
  ];
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-stroke/55 py-4 sm:grid-cols-3 lg:grid-cols-5">
    {stats.map(([label, value]) => <div key={label} className="flex min-w-0 flex-col-reverse gap-0.5">
      <dt className="text-sm text-muted">{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>;
}

export default HabitSummary;
