import { useRef, useState } from 'react';
import { dateLabel, deviceToday, scheduleLabel, weekdayOptions } from '../../habits/api';
import MilestonePicker from '../MilestonePicker';

const inputClass = 'min-h-11 w-full rounded-md border border-field-border bg-surface px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

function HabitForm({ habit, busy, milestoneOptions, linkedMilestoneId, onSave, onCancel, onArchive, onDelete }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [milestoneId, setMilestoneId] = useState(habit?.milestoneId ?? null);
  const [startDate, setStartDate] = useState(habit?.startDate ?? null);
  const [weekdays, setWeekdays] = useState(habit?.pendingSchedule?.weekdays || habit?.weekdays || [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState(weekdays.length === 7 ? 'daily' : 'custom');
  const [customizing, setCustomizing] = useState(Boolean(habit));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const options = useRef(null);
  const deleteButton = useRef(null);
  const effectiveStart = startDate ?? deviceToday();

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError('Enter a habit name.'); return; }
    if (!weekdays.length) {
      setError('Choose at least one weekday.');
      options.current.hidden = false;
      setCustomizing(true);
      options.current.querySelector('input[type="checkbox"]')?.focus();
      return;
    }
    setError('');
    onSave({
      name: name.trim(), description: description.trim(), weekdays,
      ...(!habit ? { startDate: effectiveStart } : {}),
      ...(linkedMilestoneId != null || milestoneId !== (habit?.milestoneId ?? null)
        ? { milestoneId: linkedMilestoneId ?? milestoneId } : {}),
    });
  }

  return (
    <form onSubmit={submit} onInvalidCapture={(event) => {
      if (options.current.contains(event.target)) {
        options.current.hidden = false;
        setCustomizing(true);
      }
    }}>
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <legend className="sr-only">{habit ? 'Edit habit' : 'Create a habit'}</legend>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <label htmlFor="habit-name" className="block font-medium">{habit ? 'Habit name' : 'New habit'}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required placeholder="e.g. Take a walk" className={`${inputClass} min-w-0 flex-1`} aria-describedby="habit-defaults" />
          <button className="min-h-11 shrink-0 cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">{busy ? 'Saving...' : habit ? 'Save habit' : 'Add habit'}</button>
          {habit && <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-md border border-stroke px-4 py-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Cancel</button>}
        </div>
        <p id="habit-defaults" className="text-sm text-muted">{weekdays.length ? scheduleLabel(weekdays) : 'Choose repeat days'}. {habit ? 'Start date stays fixed.' : !effectiveStart ? 'Choose a start date.' : effectiveStart === deviceToday() ? 'Starts today.' : `Starts ${dateLabel(effectiveStart)}.`}</p>
        {!habit && <button type="button" aria-expanded={customizing} aria-controls="habit-settings"
          className="secondary-control cursor-pointer" onClick={() => setCustomizing(!customizing)}>
          {customizing ? 'Hide settings' : 'Customize habit'}
        </button>}
        <div ref={options} id="habit-settings" hidden={!customizing} className="space-y-4 border-t border-stroke pt-4">
          {linkedMilestoneId == null && (
            <MilestonePicker id="habit-milestone" options={milestoneOptions} value={milestoneId} onChange={setMilestoneId} />
          )}
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Repeat</legend>
            <div className="flex flex-wrap gap-2">
              {[['daily', 'Every day'], ['custom', 'Specific days']].map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" name="habit-repeat" value={value} checked={repeat === value}
                    onChange={() => { setRepeat(value); if (value === 'daily') setWeekdays([0, 1, 2, 3, 4, 5, 6]); }}
                    className="peer sr-only" />
                  <span className="secondary-control peer-checked:border-primary peer-checked:bg-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-60">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {repeat === 'custom' && <fieldset>
            <legend className="mb-1 text-sm font-medium">Repeat on</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {weekdayOptions.map(([day, label]) => <label key={day} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input type="checkbox" checked={weekdays.includes(day)} onChange={(event) => setWeekdays((current) => event.target.checked ? [...current, day] : current.filter((value) => value !== day))} className="size-5 accent-primary" />{label}
              </label>)}
            </div>
          </fieldset>}
          {habit && <p className="text-sm text-muted">Schedule changes begin tomorrow, or on the start date if later. Past dates stay unchanged.</p>}
          <div>
            <label htmlFor="habit-start" className="mb-1 block text-sm font-medium">Start date</label>
            <input id="habit-start" type="date" min="1900-01-01" max="9998-12-31" value={effectiveStart} onChange={(event) => setStartDate(event.target.value)} disabled={Boolean(habit)} required className={`${inputClass} disabled:opacity-60`} aria-describedby="habit-start-help" />
            <p id="habit-start-help" className="mt-1 text-sm text-muted">{habit ? 'Start date stays fixed to preserve history.' : 'Earlier scheduled dates count as missed until you check them off.'}</p>
          </div>
          <div>
            <label htmlFor="habit-description" className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea id="habit-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={2} className={inputClass} />
          </div>
        </div>
        {habit && <div className="space-y-2 border-t border-stroke pt-3">
          {confirmDelete ? <>
            <p>Permanently delete this habit and all its check-ins?</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="secondary-control cursor-pointer text-danger" onClick={onDelete}>Confirm delete</button>
              <button type="button" autoFocus className="secondary-control cursor-pointer"
                onClick={() => { setConfirmDelete(false); requestAnimationFrame(() => deleteButton.current?.focus()); }}>Keep habit</button>
            </div>
          </> : <div className="flex flex-wrap gap-2">
            <button type="button" className="secondary-control cursor-pointer" onClick={onArchive}>Archive habit</button>
            <button ref={deleteButton} type="button" className="secondary-control cursor-pointer text-danger" onClick={() => setConfirmDelete(true)}>Delete habit</button>
          </div>}
        </div>}
      </fieldset>
    </form>
  );
}

export default HabitForm;
