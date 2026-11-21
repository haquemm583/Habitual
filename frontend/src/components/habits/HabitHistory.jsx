import { useLayoutEffect, useRef, useState } from 'react';
import { dateLabel, dayCount, scheduleLabel } from '../../habits/api';
import AppDialog from '../AppDialog';
import CompletionNotice from '../CompletionNotice';
import HabitCalendar from './HabitCalendar';
import MonthNavigator from './MonthNavigator';

const buttonClass = 'secondary-control cursor-pointer disabled:opacity-60';

export default function HabitHistory({ habit, month, busy, changingMonth, error, change, onRun, onMonthChange, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialog = useRef(null);
  const deleteButton = useRef(null);

  useLayoutEffect(() => {
    if (!dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <AppDialog dialogRef={dialog} onClose={onClose} title={`History for ${habit.name}`}>
      <div className="space-y-4">
        {error && <p role="alert" className="break-words text-sm text-danger">{error}</p>}
        {habit.description && <p className="whitespace-pre-wrap break-words text-muted">{habit.description}</p>}
        <p className="text-sm text-muted">{scheduleLabel(habit.weekdays)}. Starts {dateLabel(habit.startDate)}.</p>
        {habit.pendingSchedule && <p className="text-sm text-muted">From {dateLabel(habit.pendingSchedule.effectiveDate)}: {scheduleLabel(habit.pendingSchedule.weekdays)}</p>}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted">Current streak</dt><dd className="font-semibold">{dayCount(habit.currentStreak)}</dd></div>
          <div><dt className="text-muted">Longest streak</dt><dd className="font-semibold">{dayCount(habit.longestStreak)}</dd></div>
          <div><dt className="text-muted">This week</dt><dd>{habit.week.completed}/{habit.week.scheduled} ({habit.week.percent}%)</dd></div>
          <div><dt className="text-muted">Selected month</dt><dd>{habit.month.completed}/{habit.month.scheduled} ({habit.month.percent}%)</dd></div>
        </dl>
        <MonthNavigator month={month} disabled={busy} onChange={onMonthChange} />
        <p className="text-xs text-muted">{habit.archived ? 'Restore this habit to edit history.' : 'Select a scheduled date to mark or undo completion. Filled dates are complete.'}</p>
        <HabitCalendar days={habit.calendar} name={habit.name} idPrefix={`habit-date-${habit.id}`}
          disabled={busy || changingMonth} readOnly={habit.archived}
          onToggle={(day) => onRun(`${habit.id}/checkins/${day.date}`, 'PUT', { completed: !day.completed })} />
        {changingMonth && !error && <p role="status" className="text-sm text-muted">Loading calendar…</p>}
        <CompletionNotice change={change} busy={busy || changingMonth} />
        {habit.archived && (confirmDelete ? <div className="space-y-2 border-t border-stroke pt-3">
          <p>Permanently delete this habit and all its check-ins?</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${buttonClass} text-danger`} disabled={busy} onClick={() => onRun(String(habit.id), 'DELETE')}>Confirm delete</button>
            <button type="button" autoFocus className={buttonClass} disabled={busy}
              onClick={() => { setConfirmDelete(false); requestAnimationFrame(() => deleteButton.current?.focus()); }}>Keep habit</button>
          </div>
        </div> : <button ref={deleteButton} type="button" disabled={busy} className={`${buttonClass} text-danger`}
          onClick={() => setConfirmDelete(true)}>Delete habit</button>)}
      </div>
    </AppDialog>
  );
}
