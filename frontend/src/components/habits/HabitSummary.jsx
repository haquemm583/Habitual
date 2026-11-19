import { dayCount } from '../../habits/api';

function HabitSummary({ summary }) {
  const stats = [
    ['Today', `${summary.today.completed}/${summary.today.scheduled}`],
    ['This week', `${summary.week.percent}%`],
    ['Selected month', `${summary.month.percent}%`],
    ['Best current streak', dayCount(summary.bestCurrentStreak)],
    ['Longest streak', dayCount(summary.longestStreak)],
  ];
  return <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    {stats.map(([label, value]) => <div key={label} className="rounded-lg border border-stroke bg-surface p-3">
      <dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>)}
  </dl>;
}

export default HabitSummary;
