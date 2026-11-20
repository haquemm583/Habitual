import { useRef, useState } from 'react';
import { dateLabel, deviceToday, scheduleLabel, weekdayOptions } from '../../habits/api';

const inputClass = 'min-h-11 w-full rounded-md border border-field-border bg-surface px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

function HabitForm({ habit, busy, onSave, onCancel }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [startDate, setStartDate] = useState(habit?.startDate ?? null);
  const [weekdays, setWeekdays] = useState(habit?.pendingSchedule?.weekdays || habit?.weekdays || [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState(weekdays.length === 7 ? 'daily' : 'custom');
  const options = useRef(null);
  const effectiveStart = startDate ?? deviceToday();

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError('Enter a habit name.'); return; }
    if (!weekdays.length) {
      setError('Choose at least one weekday.');
      options.current.open = true;
      options.current.querySelector('input[type="checkbox"]')?.focus();
      return;
    }
    setError('');
    onSave({ name: name.trim(), description: description.trim(), weekdays, ...(!habit ? { startDate: effectiveStart } : {}) });
  }

  return (
    <form onSubmit={submit} onInvalidCapture={(event) => {
      const disclosure = event.target.closest('details');
      if (disclosure) disclosure.open = true;
    }} className="rounded-lg border border-stroke bg-surface p-4 sm:p-5">
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <legend className="sr-only">{habit ? 'Edit habit' : 'Create a habit'}</legend>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <label htmlFor="habit-name" className="block font-medium">{habit ? 'Habit name' : 'New habit'}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required placeholder="e.g. Read for 10 minutes" className={`${inputClass} min-w-0 flex-1`} aria-describedby="habit-defaults" />
          <button className="min-h-11 shrink-0 cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">{busy ? 'Saving...' : habit ? 'Save habit' : 'Add habit'}</button>
          {habit && <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-md border border-stroke px-4 py-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Cancel</button>}
        </div>
        <p id="habit-defaults" className="text-sm text-muted">{weekdays.length ? scheduleLabel(weekdays) : 'Choose repeat days'}. {habit ? 'Start date stays fixed.' : !effectiveStart ? 'Choose a start date.' : effectiveStart === deviceToday() ? 'Starts today.' : `Starts ${dateLabel(effectiveStart)}.`}</p>
        <details ref={options} open={Boolean(habit)}>
          <summary className="w-fit min-h-11 cursor-pointer rounded-sm py-2 text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">More options</summary>
          <div className="mt-2 space-y-4 border-t border-stroke pt-4">
            <div>
              <label htmlFor="habit-repeat" className="mb-1 block text-sm font-medium">Repeat</label>
              <select id="habit-repeat" value={repeat} onChange={(event) => {
                setRepeat(event.target.value);
                if (event.target.value === 'daily') setWeekdays([0, 1, 2, 3, 4, 5, 6]);
              }} className={inputClass}>
                <option value="daily">Every day</option>
                <option value="custom">Specific days</option>
              </select>
            </div>
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
        </details>
      </fieldset>
    </form>
  );
}

export default HabitForm;
