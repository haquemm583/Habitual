import { dateLabel } from '../../habits/api';

function HabitCalendar({ days, name, idPrefix, onToggle, disabled, readOnly = false, summary = false }) {
  const offset = (new Date(`${days[0].date}T12:00:00Z`).getUTCDay() + 6) % 7;
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2 text-muted">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
        {days.map((day) => {
          const scheduled = summary ? day.scheduled > 0 : day.scheduled;
          const complete = summary ? scheduled && day.completed === day.scheduled : day.completed;
          const style = complete ? 'border-primary bg-primary text-on-primary' : scheduled ? 'border-stroke bg-hover text-foreground' : 'border-transparent text-muted';
          const label = `${name}, ${dateLabel(day.date)}, ${summary ? `${day.completed} of ${day.scheduled} completed` : day.future ? 'future date' : !scheduled ? 'not scheduled' : complete ? 'completed' : 'not completed'}`;
          const contents = <><span>{Number(day.date.slice(-2))}</span>{summary && scheduled && <span className="block text-[10px]">{day.completed}/{day.scheduled}</span>}</>;
          return summary ? <div key={day.date} aria-label={label} title={label} className={`flex min-h-11 min-w-0 flex-col justify-center rounded-md border py-1 ${style}`}>{contents}</div> : (
            <button key={day.date} id={idPrefix ? `${idPrefix}-${day.date}` : undefined} type="button" aria-label={label} aria-pressed={day.completed} title={label}
              disabled={disabled || readOnly || !scheduled || day.future}
              onClick={() => onToggle(day)} className={`min-h-10 min-w-0 rounded-md border py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus enabled:cursor-pointer enabled:hover:opacity-80 disabled:cursor-default ${style}`}>
              {contents}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HabitCalendar;
