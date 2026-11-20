import { useState } from 'react';
import { dateLabel, dayCount, scheduleLabel } from '../../habits/api';
import HabitCalendar from './HabitCalendar';

const buttonClass = 'min-h-11 cursor-pointer rounded-md border border-stroke px-3 py-2 text-sm font-medium hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60';

function HabitCard({ habit, today, month, busy, onEdit, onRun, onMonthChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return <article className="min-w-0 rounded-lg border border-stroke bg-surface p-4">
    <div className="flex min-h-11 items-center gap-3">
      {!habit.archived && <input type="checkbox" aria-label={`Complete ${habit.name} today`} checked={habit.today.completed} disabled={busy || !habit.today.scheduled}
        onChange={() => onRun(`${habit.id}/checkins/${today}`, 'PUT', { completed: !habit.today.completed })}
        className="size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-default" />}
      <div className="min-w-0 flex-1">
        <h3 className={`break-words font-semibold ${habit.today.completed && !habit.archived ? 'text-muted' : ''}`}>{habit.name}</h3>
        <p className="mt-1 text-sm text-muted">{habit.archived ? 'Archived' : habit.today.completed && habit.today.scheduled ? 'Done today' : !habit.today.scheduled ? 'Not scheduled today' : scheduleLabel(habit.weekdays)}</p>
      </div>
    </div>
    <details className="mt-1">
      <summary className="min-h-11 cursor-pointer rounded-sm py-2 text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Details<span className="sr-only"> for {habit.name}</span></summary>
      <div className="mt-2 space-y-4 border-t border-stroke pt-4">
        {habit.description && <p className="whitespace-pre-wrap break-words text-muted">{habit.description}</p>}
        <p className="text-sm text-muted">{scheduleLabel(habit.weekdays)}. Starts {dateLabel(habit.startDate)}.</p>
        {habit.pendingSchedule && <p className="text-sm text-muted">From {dateLabel(habit.pendingSchedule.effectiveDate)}: {scheduleLabel(habit.pendingSchedule.weekdays)}</p>}
        <div className="flex flex-wrap gap-2">
          {!habit.archived && <button className={buttonClass} disabled={busy} onClick={() => onEdit(habit)} aria-label={`Edit ${habit.name}`}>Edit</button>}
          <button className={buttonClass} disabled={busy} onClick={() => onRun(`${habit.id}/${habit.archived ? 'restore' : 'archive'}`, 'POST')} aria-label={`${habit.archived ? 'Restore' : 'Archive'} ${habit.name}`}>{habit.archived ? 'Restore' : 'Archive'}</button>
          <button className={`${buttonClass} text-danger`} disabled={busy} onClick={() => setConfirmDelete(true)} aria-label={`Delete ${habit.name}`}>Delete</button>
        </div>
        {confirmDelete && <div className="space-y-2 rounded-md border border-stroke p-3">
          <p>Permanently delete this habit and all its check-ins? This cannot be undone.</p>
          <div className="flex flex-wrap gap-2">
            <button className={`${buttonClass} text-danger`} disabled={busy} onClick={() => onRun(String(habit.id), 'DELETE')}>Confirm delete</button>
            <button className={buttonClass} disabled={busy} onClick={() => setConfirmDelete(false)}>Keep habit</button>
          </div>
        </div>}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted">Current streak</dt><dd className="font-semibold">{dayCount(habit.currentStreak)}</dd></div>
          <div><dt className="text-muted">Longest streak</dt><dd className="font-semibold">{dayCount(habit.longestStreak)}</dd></div>
          <div><dt className="text-muted">This week</dt><dd>{habit.week.completed}/{habit.week.scheduled} ({habit.week.percent}%)</dd></div>
          <div><dt className="text-muted">Selected month</dt><dd>{habit.month.completed}/{habit.month.scheduled} ({habit.month.percent}%)</dd></div>
        </dl>
        <div>
          <label htmlFor={`history-month-${habit.id}`} className="mb-1 block text-sm font-medium">History month<span className="sr-only"> for {habit.name}</span></label>
          <input id={`history-month-${habit.id}`} type="month" min="1900-01" max="9998-12" value={month} disabled={busy} onChange={(event) => onMonthChange(event.target.value)} className="min-h-11 max-w-full rounded-md border border-field-border bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
        </div>
        <p className="text-xs text-muted">{habit.archived ? 'Restore this habit to edit history.' : 'Select a scheduled date to mark or undo completion. Filled dates are complete.'}</p>
        <HabitCalendar days={habit.calendar} name={habit.name} disabled={busy} readOnly={habit.archived} onToggle={(day) => onRun(`${habit.id}/checkins/${day.date}`, 'PUT', { completed: !day.completed })} />
      </div>
    </details>
  </article>;
}

export default HabitCard;
