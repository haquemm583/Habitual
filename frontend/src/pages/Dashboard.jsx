import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MilestoneDateTile from '../components/MilestoneDateTile';
import NavigationLink from '../components/NavigationLink';
import HabitChecklist from '../components/habits/HabitChecklist';
import TaskChecklist from '../components/tasks/TaskChecklist';
import { useMilestoneOptions } from '../milestones/useMilestoneOptions';

function Dashboard() {
  const [now, setNow] = useState(() => new Date());
  const { milestones, loading, error } = useMilestoneOptions();
  const milestonesById = new Map(milestones.map((milestone) => [milestone.id, milestone]));
  const active = milestones.filter((milestone) => !milestone.completedOn);
  const featured = active.slice(0, 3);
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    let timer;

    function scheduleClock() {
      timer = setTimeout(updateClock, 60_000 - (Date.now() % 60_000));
    }

    function updateClock() {
      clearTimeout(timer);
      setNow(new Date());
      scheduleClock();
    }

    scheduleClock();
    document.addEventListener('visibilitychange', updateClock);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', updateClock);
    };
  }, []);

  return (
    <div data-wide-layout className="space-y-8 sm:space-y-10">
      <header className="relative isolate flex min-h-36 items-end overflow-hidden rounded-2xl bg-[#202d1a] p-5 text-white shadow-sm sm:min-h-44 sm:p-7">
        <img src="/branding/today-path.webp" width="1440" height="480" alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-[#142011]/90 via-[#142011]/40 to-transparent" />
        <div>
          <h2 className="text-4xl font-bold tracking-tight">Today</h2>
          <time dateTime={now.toISOString()} className="mt-1 block text-sm font-medium text-white/90">
            {date}<span aria-hidden="true"> · </span><span className="whitespace-nowrap tabular-nums">{time}</span>
          </time>
        </div>
      </header>
      <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-2">
        <HabitChecklist milestones={milestonesById} />
        <TaskChecklist milestones={milestonesById} />
      </div>
      <section aria-labelledby="today-milestones" className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="today-milestones" className="text-lg font-semibold">Active milestones</h3>
          <NavigationLink to="/milestones">{active.length > featured.length ? `View all ${active.length} active milestones` : 'All milestones'}</NavigationLink>
        </header>
        {loading && <p role="status" className="text-sm text-muted">Loading milestones…</p>}
        {error && <p role="status" className="text-sm text-muted">Unable to load milestones.</p>}
        {!loading && !error && (active.length ? (
          <ul className="divided-list">
            {featured.map((milestone) => (
              <li key={milestone.id}>
                <Link to={`/milestones/${milestone.id}`} className="flex min-h-14 items-center gap-3 px-2 py-2 hover:bg-surface/60 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus">
                  {milestone.targetDate && <MilestoneDateTile date={milestone.targetDate} />}
                  <span className="min-w-0 flex-1 break-words font-medium">{milestone.name}</span>
                  <span aria-hidden="true" className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No active milestones.</p>)}
      </section>
    </div>
  );
}

export default Dashboard;
