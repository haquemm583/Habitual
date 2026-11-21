import { useRef, useState } from 'react';
import { dateLabel } from '../../habits/api';
import AppDialog from '../AppDialog';

const firstYear = 1900;
const lastYear = 9998;
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const button = 'secondary-control justify-center cursor-pointer disabled:cursor-default disabled:opacity-50';

export default function MonthNavigator({ month, disabled, onChange }) {
  const [year, setYear] = useState('');
  const dialog = useRef(null);
  const [currentYear, currentMonth] = month.split('-').map(Number);
  const validYear = /^\d{4}$/.test(year) && Number(year) >= firstYear && Number(year) <= lastYear;
  const label = dateLabel(`${month}-01`, { day: undefined });

  function shiftMonth(offset) {
    const next = new Date(Date.UTC(currentYear, currentMonth - 1 + offset, 1));
    onChange(`${next.getUTCFullYear()}-${months[next.getUTCMonth()]}`);
  }

  return (
    <div className="inline-flex max-w-full items-center gap-1">
      <button type="button" aria-label="Previous month" className={button} disabled={disabled || month === '1900-01'} onClick={() => shiftMonth(-1)}>‹</button>
      <button type="button" aria-haspopup="dialog" aria-label={`Choose month, ${label}`} className={button} disabled={disabled}
        onClick={() => { setYear(String(currentYear)); dialog.current.showModal(); dialog.current.querySelector('input').focus(); }}>{label}</button>
      <button type="button" aria-label="Next month" className={button} disabled={disabled || month === '9998-12'} onClick={() => shiftMonth(1)}>›</button>
      <AppDialog title="Choose month" dialogRef={dialog}>
        <div className="mb-3 flex items-center justify-center gap-2">
          <button type="button" aria-label="Previous year" className={button} disabled={!validYear || Number(year) === firstYear} onClick={() => setYear(String(Number(year) - 1))}>‹</button>
          <label className="flex items-center gap-2 text-sm font-medium">Year
            <input type="text" inputMode="numeric" maxLength={4} value={year}
              onChange={(event) => setYear(event.target.value.replace(/\D/g, ''))}
              className="min-h-10 w-18 rounded-lg border border-field-border bg-surface px-2 text-center focus-visible:outline-2 focus-visible:outline-focus" />
          </label>
          <button type="button" aria-label="Next year" className={button} disabled={!validYear || Number(year) === lastYear} onClick={() => setYear(String(Number(year) + 1))}>›</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((number) => (
            <button key={number} type="button" aria-pressed={`${year}-${number}` === month}
              className={`${button} aria-pressed:border-primary aria-pressed:bg-hover`} disabled={disabled || !validYear}
              onClick={() => { onChange(`${year}-${number}`); dialog.current.close(); }}>
              {dateLabel(`2000-${number}-01`, { month: 'short', day: undefined, year: undefined })}
            </button>
          ))}
        </div>
      </AppDialog>
    </div>
  );
}
