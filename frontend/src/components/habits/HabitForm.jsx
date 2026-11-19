import { useState } from 'react';
import { deviceToday, weekdayOptions } from '../../habits/api';

const inputClass = 'min-h-11 w-full rounded-md border border-field-border bg-surface px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

function HabitForm({ habit, busy, onSave, onCancel }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [startDate, setStartDate] = useState(habit?.startDate || deviceToday());
  const [weekdays, setWeekdays] = useState(habit?.pendingSchedule?.weekdays || habit?.weekdays || [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError('Enter a habit name.'); return; }
    if (!weekdays.length) { setError('Choose at least one weekday.'); return; }
    setError('');
    onSave({ name: name.trim(), description: description.trim(), weekdays, ...(!habit ? { startDate } : {}) });
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-stroke bg-surface p-4 sm:p-5">
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="mb-3 text-lg font-semibold">{habit ? 'Edit habit' : 'Create a habit'}</legend>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <div>
          <label htmlFor="habit-name" className="mb-1 block font-medium">Name</label>
          <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="habit-description" className="mb-1 block font-medium">Description (optional)</label>
          <textarea id="habit-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={2} className={inputClass} />
        </div>
        <div>
          <label htmlFor="habit-start" className="mb-1 block font-medium">Start date</label>
          <input id="habit-start" type="date" min="1900-01-01" max="9998-12-31" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={Boolean(habit)} required className={`${inputClass} disabled:opacity-60`} aria-describedby="habit-start-help" />
          <p id="habit-start-help" className="mt-1 text-sm text-muted">{habit ? 'Start date stays fixed to preserve history.' : 'Earlier scheduled dates count as missed until you check them off.'}</p>
        </div>
        <fieldset>
          <legend className="mb-2 font-medium">Repeat on</legend>
          <label className="mb-2 flex min-h-10 cursor-pointer items-center gap-2">
            <input type="checkbox" checked={weekdays.length === 7} onChange={(event) => setWeekdays(event.target.checked ? [0, 1, 2, 3, 4, 5, 6] : [])} className="size-5 accent-primary" /> Every day
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {weekdayOptions.map(([day, label]) => <label key={day} className="flex min-h-10 cursor-pointer items-center gap-2">
              <input type="checkbox" checked={weekdays.includes(day)} onChange={(event) => setWeekdays((current) => event.target.checked ? [...current, day] : current.filter((value) => value !== day))} className="size-5 accent-primary" />{label}
            </label>)}
          </div>
          {habit && <p className="mt-2 text-sm text-muted">Schedule changes begin tomorrow, or on the start date if later. Past dates stay unchanged.</p>}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button className="min-h-11 cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">{busy ? 'Saving...' : habit ? 'Save habit' : 'Add habit'}</button>
          {habit && <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-md border border-stroke px-4 py-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Cancel</button>}
        </div>
      </fieldset>
    </form>
  );
}

export default HabitForm;
