import { useRef, useState } from 'react';
import { useHabits } from '../../habits/useHabits';
import ChecklistRow from '../ChecklistRow';
import CompletionNotice from '../CompletionNotice';
import NavigationLink from '../NavigationLink';
import ProgressRing from '../ProgressRing';
import HabitForm from './HabitForm';
import HabitWeekStrip from './HabitWeekStrip';

function HabitChecklist({ milestoneId, milestones }) {
  const { data, loading, loadError, actionError, busy, refresh, run } = useHabits();
  const [change, setChange] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const form = useRef(null);
  const linked = milestoneId != null;
  const scoped = data?.habits.filter((habit) => !linked || habit.milestoneId === milestoneId) ?? [];
  const visible = linked ? scoped : scoped.filter((habit) => !habit.archived && habit.today.scheduled);
  const week = scoped.reduce((total, habit) => {
    if (habit.archived) return total;
    return { completed: total.completed + habit.week.completed, scheduled: total.scheduled + habit.week.scheduled };
  }, { completed: 0, scheduled: 0 });
  const progress = data ? (linked ? week : data.summary.today) : null;
  const allDoneToday = !linked && progress?.scheduled > 0 && progress.completed === progress.scheduled;

  async function checkIn(id, date, completed, undoing = false) {
    if (!await run(`${id}/checkins/${date}`, 'PUT', { completed })) return;
    if (undoing) document.getElementById(`checklist-habit-${id}`)?.focus();
    setChange(undoing
      ? { message: 'Habit change undone.' }
      : { message: completed ? 'Habit checked in.' : 'Habit check-in cleared.', undo: () => checkIn(id, date, !completed, true) });
  }

  async function addHabit(body) {
    if (!await run('', 'POST', body)) return;
    setFormVersion((value) => value + 1);
    setChange({ message: 'Habit added.' });
    requestAnimationFrame(() => form.current?.querySelector('input')?.focus());
  }

  return (
    <section aria-labelledby="checklist-habits" className="min-w-0 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          {progress && !loadError && (
            <ProgressRing completed={progress.completed} total={progress.scheduled} tone="habit"
              label={linked ? 'Habit check-ins this week' : 'Habit check-ins today'} />
          )}
          <div className="min-w-0">
            <h3 id="checklist-habits" className="text-lg font-semibold">{linked ? 'Habits' : 'Today’s habits'}</h3>
            {progress && <p className={`mt-1 text-sm ${allDoneToday ? 'font-semibold text-progress-habit' : 'text-muted'}`}>
              {linked ? `${progress.completed} of ${progress.scheduled} check-ins this week`
                : allDoneToday ? 'All habits done today'
                  : `${progress.completed} of ${progress.scheduled} done today`}
            </p>}
          </div>
        </div>
        <NavigationLink to="/habits">All habits</NavigationLink>
      </header>
      {loading && <p role="status" className="text-sm text-muted">Loading habits…</p>}
      {loadError && (
        <div className="space-y-1">
          <p role="alert" className="break-words text-danger">Unable to refresh habits. {loadError}</p>
          <button type="button" onClick={refresh} className="secondary-control cursor-pointer">Retry habits</button>
        </div>
      )}
      {data && !loadError && (
        <>
          {visible.length ? (
            <ul className="divided-list">
              {visible.map((habit) => (
                <ChecklistRow key={habit.id} id={`checklist-habit-${habit.id}`} name={habit.name}
                  label={`Complete ${habit.name} today`} checked={habit.today.completed}
                  disabled={busy || !habit.today.scheduled}
                  onChange={habit.archived ? undefined : () => checkIn(habit.id, data.today, !habit.today.completed)}
                  status={habit.archived ? 'Archived' : habit.today.scheduled ? 'Today' : 'Not scheduled today'}
                  streak={habit.currentStreak}
                  milestone={!linked && milestones?.get(habit.milestoneId)} />
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{linked ? 'No linked habits yet.' : 'No habits scheduled today.'}</p>}
          <HabitWeekStrip habits={scoped} today={data.today} />
          {linked && (
            <div ref={form} className="pt-1">
              <HabitForm key={formVersion} busy={busy} linkedMilestoneId={milestoneId} onSave={addHabit} />
            </div>
          )}
        </>
      )}
      {actionError && <p role="alert" className="break-words text-sm text-danger">{actionError}</p>}
      <CompletionNotice change={change} busy={busy || Boolean(loadError)} />
    </section>
  );
}

export default HabitChecklist;
