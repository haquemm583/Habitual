import { Link } from 'react-router-dom';

function MilestoneChip({ id, name }) {
  return (
    <Link to={`/milestones/${id}`} className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-md border border-progress-goal/40 bg-progress-goal/5 px-2 py-1 text-xs font-semibold text-progress-goal no-underline hover:border-progress-goal/70 hover:bg-progress-goal/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
      <span aria-hidden="true" className="shrink-0 text-sm leading-none">⚑</span>
      <span className="min-w-0 break-words">{name}</span>
      <span aria-hidden="true" className="shrink-0 text-sm leading-none">›</span>
    </Link>
  );
}

export default MilestoneChip;
