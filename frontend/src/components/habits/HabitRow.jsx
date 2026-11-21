import { scheduleLabel } from '../../habits/api';
import CompletionControl from '../CompletionControl';
import MilestoneChip from '../MilestoneChip';
import StreakBadge from './StreakBadge';

const buttonClass = 'min-h-11 cursor-pointer rounded-md border border-stroke px-3 py-2 text-sm font-medium hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60';

function HabitRow({ habit, milestoneName, today, busy, onEdit, onRun, onHistory }) {
  return <li className="min-w-0 px-1 py-3 hover:bg-surface/60 sm:px-2">
    <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex min-w-36 flex-1 items-center gap-1">
        {!habit.archived && (
          <CompletionControl id={`habit-completion-${habit.id}`} label={`Complete ${habit.name} today`} checked={habit.today.completed} disabled={busy || !habit.today.scheduled}
            onChange={() => onRun(`${habit.id}/checkins/${today}`, 'PUT', { completed: !habit.today.completed })} />
        )}
        <div className="min-w-0 flex-1">
          <h4 className={`break-words font-semibold ${habit.today.completed && !habit.archived ? 'text-muted' : ''}`}>{habit.name}</h4>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{habit.archived ? 'Archived' : habit.today.completed && habit.today.scheduled ? 'Done today' : !habit.today.scheduled ? 'Not scheduled today' : scheduleLabel(habit.weekdays)}</span>
            <StreakBadge count={habit.currentStreak} />
          </div>
          {milestoneName && <div className="mt-1"><MilestoneChip id={habit.milestoneId} name={milestoneName} /></div>}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap gap-1">
        <button type="button" aria-haspopup="dialog" aria-label={`History for ${habit.name}`} className={buttonClass}
          onClick={() => onHistory(habit.id)}>History</button>
        {habit.archived ? <button type="button" disabled={busy} aria-label={`Restore ${habit.name}`} className={buttonClass}
          onClick={() => onRun(`${habit.id}/restore`, 'POST')}>Restore</button>
          : <button id={`habit-edit-${habit.id}`} type="button" disabled={busy} aria-label={`Edit ${habit.name}`} className={buttonClass}
            onClick={() => onEdit(habit)}>Edit</button>}
      </div>
    </div>
  </li>;
}

export default HabitRow;
