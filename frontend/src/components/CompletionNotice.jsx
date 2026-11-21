import CompletionBurst from './CompletionBurst';

function CompletionNotice({ change, busy, undoId, milestone = false }) {
  const celebrate = change?.celebrate;

  return (
    <div hidden={!change} className={`relative min-h-11 flex-wrap items-center justify-between gap-x-3 rounded-lg px-3 text-sm ${change ? 'flex' : ''} ${milestone ? 'bg-progress-goal/10 text-progress-goal' : 'bg-hover'}`}>
      <CompletionBurst trigger={celebrate} milestone={milestone} position="top-1/2 left-5" />
      <p role="status" className="flex min-w-0 items-start gap-2 py-2 break-words">
        {celebrate && <span aria-hidden="true" className="shrink-0 font-semibold">{milestone ? '✦' : '✓'}</span>}
        <span className="min-w-0 break-words">{change?.message}</span>
      </p>
      {change?.undo && (
        <button id={undoId} type="button" aria-disabled={busy} onClick={() => { if (!busy) change.undo(); }}
          className="secondary-control my-1 shrink-0 cursor-pointer aria-disabled:opacity-60">
          Undo
        </button>
      )}
    </div>
  );
}

export default CompletionNotice;
