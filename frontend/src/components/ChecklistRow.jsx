import CompletionControl from './CompletionControl';
import MilestoneChip from './MilestoneChip';
import StreakBadge from './habits/StreakBadge';

function ChecklistRow({ id, name, label = name, checked, disabled, onChange, status, milestone, streak }) {
  return (
    <li className="flex min-h-14 items-center gap-1 py-1 hover:bg-surface/60 sm:px-1">
      {onChange && <CompletionControl id={id} label={label} checked={checked} disabled={disabled} onChange={onChange} />}
      <div className={`min-w-0 flex-1 py-1 pr-2 ${onChange ? '' : 'pl-3'}`}>
        {onChange ? (
          <label htmlFor={id} className={`block break-words font-medium ${disabled ? '' : 'cursor-pointer'} ${checked ? 'text-muted' : ''}`}>{name}</label>
        ) : <p className="break-words font-medium">{name}</p>}
        {(status || milestone || Boolean(streak)) && (
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
            {status && <span>{status}</span>}
            <StreakBadge count={streak} />
            {milestone && <MilestoneChip id={milestone.id} name={milestone.name} />}
          </div>
        )}
      </div>
    </li>
  );
}

export default ChecklistRow;
