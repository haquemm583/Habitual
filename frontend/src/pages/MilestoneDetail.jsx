import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { milestonesRequest } from '../auth/api';
import CompletionBurst from '../components/CompletionBurst';
import HabitChecklist from '../components/habits/HabitChecklist';
import MilestoneDateTile from '../components/MilestoneDateTile';
import NavigationLink from '../components/NavigationLink';
import TaskChecklist from '../components/tasks/TaskChecklist';
import { formatDate, isPastDate, todayString } from '../utils/dates';

function MilestoneDetail() {
  const { id } = useParams();
  const [milestone, setMilestone] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback((signal) => milestonesRequest(id, { signal })
    .then((data) => { if (!signal?.aborted) { setMilestone(data); setLoadError(''); } })
    .catch((error) => { if (!signal?.aborted) setLoadError(error.message); }), [id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function toggleMilestone() {
    if (saving) return;
    setSaving(true);
    setActionError('');
    try {
      setMilestone(await milestonesRequest(id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedOn: milestone.completedOn ? null : todayString() }),
      }));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }
  const overdue = milestone?.targetDate && !milestone.completedOn && isPastDate(milestone.targetDate);

  return (
    <div data-wide-layout className="space-y-6">
      <nav aria-label="Breadcrumb">
        <NavigationLink to="/milestones" back>Back to milestones</NavigationLink>
      </nav>
      {loadError ? (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to open milestone</h2>
          <p role="alert" className="break-words text-danger">{loadError}</p>
          <button type="button" onClick={() => load()} className="secondary-control cursor-pointer">Try again</button>
        </div>
      ) : !milestone ? <p role="status" className="text-muted">Loading milestone…</p> : (
        <>
          <header className="space-y-4 border-b border-stroke/55 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">{milestone.name}</h2>
                <p aria-live="polite" className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${overdue
                  ? 'bg-danger/10 text-danger'
                  : milestone.completedOn ? 'bg-progress-habit/10 text-progress-habit' : 'bg-progress-goal/10 text-progress-goal'}`}>
                  {milestone.completedOn ? `Completed ${formatDate(milestone.completedOn)}` : overdue ? 'Overdue' : 'In progress'}
                </p>
              </div>
              {milestone.targetDate && (
                <div className="space-y-1 text-center">
                  <MilestoneDateTile date={milestone.targetDate} />
                  <p aria-hidden="true" className="text-xs font-medium text-muted">Target</p>
                </div>
              )}
            </div>
            {milestone.description && <p className="whitespace-pre-wrap break-words text-foreground">{milestone.description}</p>}
            <button type="button" aria-disabled={saving} onClick={toggleMilestone}
              className="relative min-h-11 cursor-pointer rounded-lg border border-field-border px-4 py-2 text-sm font-semibold hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-disabled:opacity-60">
              {milestone.completedOn ? 'Reopen milestone' : 'Mark milestone complete'}
              <CompletionBurst trigger={Boolean(milestone.completedOn)} milestone position="top-1/2 right-4" />
            </button>
            {actionError && <p role="alert" className="break-words text-danger">{actionError}</p>}
          </header>
          <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-2">
            <TaskChecklist milestoneId={milestone.id} />
            <HabitChecklist milestoneId={milestone.id} />
          </div>
        </>
      )}
    </div>
  );
}

export default MilestoneDetail;
