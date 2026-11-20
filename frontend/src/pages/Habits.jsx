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
  const [notice, setNotice] = useState('');
  const form = useRef(null);
  const { data, loading, loadError, actionError, busy, refresh, run } = useHabits(month);

  function reset() {
    setEditing(null); setFormVersion((value) => value + 1);
    requestAnimationFrame(() => form.current?.querySelector('input')?.focus());
  }

  function changeMonth(value) {
    if (/^\d{4}-\d{2}$/.test(value) && value >= '1900-01' && value <= '9998-12') setMonth(value);
  }

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

  return <div className="mx-auto max-w-3xl space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Habits</h2>
      <p className="mt-2 text-muted">Small steps, every day.</p>
      {data && <p className="mt-2 text-sm text-muted">{data.summary.today.completed} of {data.summary.today.scheduled} completed today</p>}
    </div>
    {loading && <p role="status">Loading habits...</p>}
    {loadError && <div className="rounded-md border border-stroke bg-surface p-3"><p role="alert" className="break-words text-danger">Unable to refresh habits. {loadError}</p><button onClick={refresh} className="min-h-11 cursor-pointer rounded-sm underline focus-visible:outline-2 focus-visible:outline-focus">Try again</button></div>}
    {actionError && <p role="alert" className="break-words text-danger">{actionError}</p>}
    <p role="status" className={notice ? 'text-sm text-muted' : 'sr-only'}>{notice}</p>
    <div ref={form}>
      <HabitForm key={`${editing?.id || 'new'}-${formVersion}`} habit={editing} busy={busy || !data || Boolean(loadError)} onSave={save} onCancel={reset} />
    </div>
    {data && <>
      <section aria-labelledby="active-habits" className="space-y-4">
        <h3 id="active-habits" className="font-semibold">Your habits ({active.length})</h3>
        {!active.length && <p className="text-sm text-muted">Add your first habit above. Start with something small.</p>}
        <div className="space-y-2">
          {active.map((habit) => <HabitCard key={habit.id} habit={habit} today={data.today} month={data.month} busy={busy || Boolean(loadError)} onRun={act} onMonthChange={changeMonth} onEdit={(selected) => {
            setEditing(selected); setNotice(''); form.current?.scrollIntoView({ block: 'start' });
            requestAnimationFrame(() => form.current?.querySelector('input')?.focus());
          }} />)}
        </div>
      </section>
      <details className="rounded-lg border border-stroke p-4">
        <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Progress</summary>
        <div className="mt-3 space-y-4">
          <label htmlFor="habit-month" className="block text-sm font-medium">Calendar month</label>
          <input id="habit-month" type="month" min="1900-01" max="9998-12" value={month} disabled={busy} onChange={(event) => changeMonth(event.target.value)} className="min-h-11 max-w-full rounded-md border border-field-border bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
          <HabitSummary summary={data.summary} />
          <p className="text-sm text-muted">{dateLabel(`${data.month}-01`, { day: undefined })}. Weeks start Monday. Archived habits are excluded.</p>
          <div className="max-w-md"><HabitCalendar days={data.summary.calendar} name="Overall progress" summary /></div>
        </div>
      </details>
      {archived.length > 0 && <details className="rounded-lg border border-stroke p-4">
        <summary className="min-h-11 cursor-pointer rounded-sm py-2 text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Archived habits ({archived.length})</summary>
        <div className="mt-3 space-y-2">{archived.map((habit) => <HabitCard key={habit.id} habit={habit} today={data.today} month={data.month} busy={busy || Boolean(loadError)} onRun={act} onMonthChange={changeMonth} />)}</div>
      </details>}
    </>}
  </div>;
}

export default Habits;
