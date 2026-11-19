import { useRef, useState } from 'react';
import { dateLabel, deviceToday } from '../habits/api';
import { useHabits } from '../habits/useHabits';
import HabitForm from '../components/habits/HabitForm';
import HabitCard from '../components/habits/HabitCard';
import HabitCalendar from '../components/habits/HabitCalendar';
import HabitSummary from '../components/habits/HabitSummary';

function Habits() {
  const [month, setMonth] = useState(() => deviceToday().slice(0, 7));
  const [editing, setEditing] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [notice, setNotice] = useState('');
  const form = useRef(null);
  const { data, loading, loadError, actionError, busy, refresh, run } = useHabits(month);

  function reset() { setEditing(null); setFormVersion((value) => value + 1); }

  async function save(body) {
    if (await run(editing ? String(editing.id) : '', editing ? 'PATCH' : 'POST', body)) {
      setNotice(editing ? 'Habit saved.' : 'Habit created.');
      reset();
    }
  }

  async function act(path, method, body) {
    setNotice('');
    if (await run(path, method, body)) {
      if (path.endsWith('/archive')) { if (editing?.id === Number(path.split('/')[0])) reset(); setNotice('Habit archived. It is excluded from overall progress.'); }
      else if (path.endsWith('/restore')) setNotice('Habit restored. Its current streak starts fresh.');
      else if (method === 'DELETE') { if (editing?.id === Number(path)) reset(); setNotice('Habit and check-in history deleted.'); }
      else setNotice('Check-in saved.');
    }
  }

  const active = data?.habits.filter((habit) => !habit.archived) || [];
  const archived = data?.habits.filter((habit) => habit.archived) || [];

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Habits</h2>
      <p className="mt-2 text-muted">Build a routine, one scheduled day at a time.</p>
    </div>
    {loading && <p role="status">Loading habits...</p>}
    {loadError && <div className="rounded-md border border-stroke bg-surface p-3"><p role="alert" className="break-words text-danger">Unable to refresh habits. {loadError}</p><button onClick={refresh} className="min-h-11 cursor-pointer rounded-sm underline focus-visible:outline-2 focus-visible:outline-focus">Try again</button></div>}
    {actionError && <p role="alert" className="break-words text-danger">{actionError}</p>}
    <p role="status" className="text-sm text-muted">{notice}</p>
    {data && <>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="habit-month" className="mb-1 block text-sm font-medium">Calendar month</label>
          <input id="habit-month" type="month" min="1900-01" max="9998-12" value={month} disabled={busy} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value); }} className="min-h-11 max-w-full rounded-md border border-field-border bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
        </div>
        <p className="text-sm text-muted">Today: {dateLabel(data.today)}. Weeks start Monday.</p>
      </div>
      <HabitSummary summary={data.summary} />
      <details className="rounded-lg border border-stroke bg-surface p-4">
        <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Overall calendar for {dateLabel(`${data.month}-01`, { day: undefined })}</summary>
        <p className="my-3 text-sm text-muted">Completed / scheduled habits each day. Archived habits are excluded from all overall stats.</p>
        <div className="max-w-md"><HabitCalendar days={data.summary.calendar} name="Overall progress" summary /></div>
      </details>
    </>}
    <div ref={form}>
      <HabitForm key={`${editing?.id || 'new'}-${formVersion}`} habit={editing} busy={busy || !data || Boolean(loadError)} onSave={save} onCancel={reset} />
    </div>
    {data && <>
      <section aria-labelledby="active-habits" className="space-y-4">
        <h3 id="active-habits" className="text-lg font-semibold">Active habits ({active.length})</h3>
        {!active.length && <p className="text-muted">No active habits. Create your first routine above.</p>}
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {active.map((habit) => <HabitCard key={habit.id} habit={habit} today={data.today} month={data.month} busy={busy || Boolean(loadError)} onRun={act} onEdit={(selected) => {
            setEditing(selected); setNotice(''); form.current?.scrollIntoView({ block: 'start' });
            requestAnimationFrame(() => form.current?.querySelector('input')?.focus());
          }} />)}
        </div>
      </section>
      <section aria-label="Archived habits" className="space-y-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-2"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="size-5 accent-primary" />Show archived habits ({archived.length})</label>
        {showArchived && (archived.length ? <div className="grid items-start gap-4 lg:grid-cols-2">{archived.map((habit) => <HabitCard key={habit.id} habit={habit} today={data.today} month={data.month} busy={busy || Boolean(loadError)} onRun={act} />)}</div> : <p className="text-muted">No archived habits.</p>)}
      </section>
    </>}
  </div>;
}

export default Habits;
