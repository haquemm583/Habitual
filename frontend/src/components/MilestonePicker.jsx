import { useRef, useState } from 'react';
import AppDialog from './AppDialog';

export default function MilestonePicker({ id, options, value, onChange, disabled }) {
  const { milestones, loading, error } = options;
  const [query, setQuery] = useState('');
  const dialog = useRef(null);
  const selected = milestones.find((item) => item.id === value);
  const search = query.trim().toLocaleLowerCase();
  const matches = milestones.filter((item) => item.name.toLocaleLowerCase().includes(search));

  function choose(id) {
    onChange(id);
    dialog.current.close();
  }

  function choice(id, name, completed) {
    return (
      <button key={id ?? 'none'} type="button" aria-pressed={id === value} onClick={() => choose(id)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus aria-pressed:bg-hover aria-pressed:font-semibold">
        <span className="min-w-0 break-words">{name}{completed && <span className="block text-sm font-normal text-muted">Completed</span>}</span>
        {id === value && <span aria-hidden="true">✓</span>}
      </button>
    );
  }

  return (
    <div className="min-w-0">
      <p id={`${id}-label`} className="mb-1 text-sm font-medium">Milestone (optional)</p>
      <div className="flex flex-wrap items-center gap-2">
        {value != null && <span className="min-w-0 break-words text-sm">{selected?.name ?? 'Current milestone'}</span>}
        <button id={id} type="button" aria-haspopup="dialog" aria-describedby={`${id}-label`}
          disabled={disabled || loading || error} className="secondary-control cursor-pointer disabled:opacity-60"
          onClick={() => { setQuery(''); dialog.current.showModal(); dialog.current.querySelector('input').focus(); }}>
          {loading ? 'Loading milestones…' : value == null ? 'Choose milestone' : 'Change milestone'}
        </button>
      </div>
      {error && <p role="status" className="mt-1 text-sm text-muted">Unable to load milestones.</p>}
      <AppDialog title="Choose milestone" dialogRef={dialog}>
        <input type="search" aria-label="Search milestones" value={query} placeholder="Search milestones"
          onChange={(event) => setQuery(event.target.value)}
          className="mb-3 min-h-11 w-full rounded-lg border border-field-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-focus" />
        {choice(null, 'No milestone')}
        {value != null && !selected && !search && choice(value, 'Current milestone')}
        <div className="mt-1 border-t border-stroke pt-1">
          {matches.map(({ id, name, completedOn }) => choice(id, name, Boolean(completedOn)))}
          {!matches.length && <p className="px-3 py-2 text-sm text-muted" role="status">{search ? 'No matching milestones.' : 'No milestones yet.'}</p>}
        </div>
      </AppDialog>
    </div>
  );
}
