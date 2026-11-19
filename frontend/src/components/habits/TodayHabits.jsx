import { Link } from 'react-router-dom';
import { useHabits } from '../../habits/useHabits';

function TodayHabits() {
  const { data, loading, loadError, actionError, busy, refresh, run } = useHabits();
  const due = data?.habits.filter((habit) => !habit.archived && habit.today.scheduled) || [];
  return <section aria-labelledby="today-habits" className="my-6 space-y-3 rounded-lg border border-stroke bg-surface p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id="today-habits" className="font-semibold">Today’s habits{data ? ` (${data.summary.today.completed}/${data.summary.today.scheduled})` : ''}</h3>
      <Link to="/habits" className="rounded-sm text-sm text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Manage habits</Link>
    </div>
    {loading && <p role="status" className="text-muted">Loading habits...</p>}
    {loadError && <div><p role="alert" className="break-words text-danger">Unable to refresh habits. {loadError}</p><button onClick={refresh} className="min-h-11 cursor-pointer rounded-sm underline focus-visible:outline-2 focus-visible:outline-focus">Retry habits</button></div>}
    {actionError && <p role="alert" className="break-words text-danger">{actionError}</p>}
    {data && !loadError && (due.length ? <ul className="space-y-2">{due.map((habit) => <li key={habit.id}>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-stroke px-3 py-2 hover:bg-hover">
        <input type="checkbox" checked={habit.today.completed} disabled={busy} onChange={() => run(`${habit.id}/checkins/${data.today}`, 'PUT', { completed: !habit.today.completed })} className="size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
        <span className={`min-w-0 break-words ${habit.today.completed ? 'text-muted line-through' : ''}`}>{habit.name}</span>
      </label>
    </li>)}</ul> : <p className="text-sm text-muted">No habits scheduled today.</p>)}
    {data && <p role="status" className="sr-only">{data.summary.today.completed} of {data.summary.today.scheduled} habits completed today.</p>}
  </section>;
}

export default TodayHabits;
