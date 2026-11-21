import { useLayoutEffect, useRef, useState } from 'react';
import { dateLabel, deviceToday } from '../habits/api';
import { useHabits } from '../habits/useHabits';
import HabitForm from '../components/habits/HabitForm';
import HabitRow from '../components/habits/HabitRow';
import HabitHistory from '../components/habits/HabitHistory';
import HabitCalendar from '../components/habits/HabitCalendar';
import HabitSummary from '../components/habits/HabitSummary';
import MonthNavigator from '../components/habits/MonthNavigator';
import CompletionNotice from '../components/CompletionNotice';
import ViewSwitcher from '../components/ViewSwitcher';
import { useMilestoneOptions } from '../milestones/useMilestoneOptions';

function Habits() {
  const [month, setMonth] = useState(() => deviceToday().slice(0, 7));
  const [view, setView] = useState('active');
  const [historyId, setHistoryId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [notice, setNotice] = useState('');
  const [checkInChange, setCheckInChange] = useState(null);
  const form = useRef(null);
  const undoFocus = useRef(null);
  const { data, loading, loadError, actionError, busy, refresh, run } = useHabits(month);
  const milestoneOptions = useMilestoneOptions();
  const milestoneNames = new Map(milestoneOptions.milestones.map(({ id, name }) => [id, name]));

  useLayoutEffect(() => {
    if (!undoFocus.current) return;
    const { habitId, date } = undoFocus.current;
    undoFocus.current = null;
    const day = document.getElementById(`habit-date-${habitId}-${date}`);
    const target = day?.closest('dialog[open]') ? day : document.getElementById(`habit-completion-${habitId}`);
    target?.focus();
  }, [checkInChange]);

  function reset(removed = false) {
    setEditing(null); setFormVersion((value) => value + 1);
    requestAnimationFrame(() => {
      const row = editing && !removed ? document.getElementById(`habit-edit-${editing.id}`) : null;
      (row || form.current?.querySelector('input'))?.focus();
    });
  }

  async function save(body) {
    if (await run(editing ? String(editing.id) : '', editing ? 'PATCH' : 'POST', body)) {
      setNotice(editing ? 'Habit saved.' : 'Habit created.');
      reset();
    }
  }

  async function act(path, method, body, undoing = false) {
    setNotice('');
    if (await run(path, method, body)) {
      const [id, , date] = path.split('/');
      const habitId = Number(id);
      if (method === 'PUT') {
        if (undoing) {
          undoFocus.current = { habitId, date };
          setCheckInChange({ message: 'Habit change undone.' });
        } else {
          setCheckInChange({ habitId, message: 'Check-in saved.', undo: () => act(path, 'PUT', { completed: !body.completed }, true) });
        }
        return;
      }
      setCheckInChange((current) => current?.habitId === habitId ? null : current);
      if (path.endsWith('/archive')) { if (editing?.id === habitId) reset(true); setNotice('Habit archived. It is excluded from overall progress.'); }
      else if (path.endsWith('/restore')) {
        setNotice('Habit restored. Its current streak starts fresh.');
        requestAnimationFrame(() => document.getElementById('habit-view-heading')?.focus());
      } else if (method === 'DELETE') {
        if (historyId === habitId) setHistoryId(null);
        if (editing?.id === habitId) reset(true);
        else requestAnimationFrame(() => document.getElementById('habit-view-heading')?.focus());
        setNotice('Habit and check-in history deleted.');
      }
    }
  }

  const active = data?.habits.filter((habit) => !habit.archived) || [];
  const archived = data?.habits.filter((habit) => habit.archived) || [];
  const cards = view === 'archived' ? archived : active;
  const historyHabit = data?.habits.find((habit) => habit.id === historyId);
  const changingMonth = data && month !== data.month;
  const viewName = { active: 'Your habits', progress: 'Overall progress', archived: 'Archived habits' }[view];

  return <div className="mx-auto max-w-3xl space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
      <p className="mt-2 text-muted">Small steps, every day.</p>
      {data && <p className="mt-2 text-sm text-muted">{data.summary.today.completed} of {data.summary.today.scheduled} completed today</p>}
    </div>
    {loading && <p role="status">Loading habits...</p>}
    {loadError && <div className="space-y-2"><p role="alert" className="break-words text-danger">Unable to refresh habits. {loadError}</p><button type="button" onClick={refresh} className="secondary-control cursor-pointer">Try again</button></div>}
    {actionError && <p role="alert" className="break-words text-danger">{actionError}</p>}
    <p role="status" className={notice ? 'text-sm text-muted' : 'sr-only'}>{notice}</p>
    <CompletionNotice change={checkInChange} busy={busy || Boolean(loadError)} />
    <div ref={form}>
      <HabitForm key={`${editing?.id || 'new'}-${formVersion}`} habit={editing} busy={busy || !data || Boolean(loadError)}
        milestoneOptions={milestoneOptions} onSave={save} onCancel={() => reset()}
        onArchive={() => act(`${editing.id}/archive`, 'POST')}
        onDelete={() => act(String(editing.id), 'DELETE')} />
    </div>
    {data && <>
      <ViewSwitcher label="Habit views" value={view} onChange={setView}
        views={[['active', `Active (${active.length})`], ['progress', 'Progress'], ['archived', `Archived (${archived.length})`]]} />
      <section aria-labelledby="habit-view-heading" className="space-y-4">
        <h3 id="habit-view-heading" tabIndex={-1} className="text-lg font-semibold">{viewName}</h3>
        {view === 'progress' ? <div className="space-y-4">
          <HabitSummary summary={data.summary} />
          <MonthNavigator month={month} disabled={busy} onChange={setMonth} />
          <p className="text-sm text-muted">{dateLabel(`${data.month}-01`, { day: undefined })}. Weeks start Monday. Archived habits are excluded.</p>
          <div className="max-w-md" aria-busy={changingMonth}><HabitCalendar days={data.summary.calendar} name="Overall progress" summary /></div>
          {changingMonth && !loadError && <p role="status" className="text-sm text-muted">Loading calendar…</p>}
        </div> : cards.length ? <ul className="divided-list">
          {cards.map((habit) => <HabitRow key={habit.id} habit={habit} milestoneName={milestoneNames.get(habit.milestoneId)}
            today={data.today} busy={busy || Boolean(loadError)}
            onRun={act} onHistory={setHistoryId} onEdit={(selected) => {
              setEditing(selected); setNotice(''); form.current?.scrollIntoView({ block: 'start' });
              requestAnimationFrame(() => form.current?.querySelector('input')?.focus());
            }} />)}
        </ul> : <p className="text-sm text-muted">{view === 'archived' ? 'No archived habits.' : 'Add your first habit above. Start with something small.'}</p>}
      </section>
    </>}
    {historyHabit && <HabitHistory habit={historyHabit} month={month} changingMonth={changingMonth}
      busy={busy || Boolean(loadError)} error={actionError || loadError}
      change={checkInChange?.habitId === historyId ? checkInChange : null}
      onRun={act} onMonthChange={setMonth} onClose={() => setHistoryId(null)} />}
  </div>;
}

export default Habits;
