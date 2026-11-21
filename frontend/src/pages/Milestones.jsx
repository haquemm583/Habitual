/*
  Milestones.jsx

  Creates the Milestones component for the top level Milestones route.
  Provides per-user CRUD operations (Create, Read, Update, Delete)
  for milestones stored in PostgreSQL. A milestone is a goal with an
  optional target date. Checking it off records today as its completed date.

  Created by: Joseph Duff
  Created on: 11/20/2026
*/

import { useState, useEffect, useCallback } from 'react';
import { milestonesRequest } from '../auth/api';
import MilestoneForm from '../components/MilestoneForm';
import { formatDate, isPastDate, todayString } from '../utils/dates';

const jsonHeaders = { 'Content-Type': 'application/json' };

const secondaryButton =
  'cursor-pointer rounded-md border border-stroke bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60';

const dangerButton =
  'cursor-pointer rounded-md border border-danger bg-surface px-3 py-1.5 text-sm font-medium text-danger hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-wait disabled:opacity-60';

// same order the server uses: soonest target date first, no date last
function sortMilestones(list) {
  return [...list].sort((a, b) => {
    const dateA = a.targetDate ?? '9999-12-31';
    const dateB = b.targetDate ?? '9999-12-31';
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;
    return a.id - b.id;
  });
}

function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [actionError, setActionError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);

  // Track in-flight milestone mutations by milestone ID
  const [busyIds, setBusyIds] = useState([]);

  function setBusy(milestoneId, isBusy) {
    setBusyIds((current) =>
      isBusy ? [...current, milestoneId] : current.filter((id) => id !== milestoneId)
    );
  }

  const loadMilestones = useCallback((signal) =>
    milestonesRequest('', { signal })
      .then((data) => {
        if (!signal?.aborted) {
          setMilestones(sortMilestones(data));
        }
      })
      .catch((err) => {
        if (!signal?.aborted) {
          setNetworkError(err.message);
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }), []);

  function retryLoadMilestones() {
    setLoading(true);
    setNetworkError(null);
    loadMilestones();
  }

  useEffect(() => {
    const controller = new AbortController();
    loadMilestones(controller.signal);
    return () => controller.abort();
  }, [loadMilestones]);

  // The form shows any error from these two, so they throw instead of catching.
  async function handleCreate(values) {
    const created = await milestonesRequest('', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(values),
    });
    setMilestones((current) => sortMilestones([...current, created]));
    setActionError('');
  }

  async function handleUpdate(milestoneId, values) {
    const updated = await milestonesRequest(String(milestoneId), {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify(values),
    });
    setMilestones((current) =>
      sortMilestones(current.map((item) => (item.id === milestoneId ? updated : item)))
    );
    setEditingId(null);
    setActionError('');
  }

  // Check off or reopen a milestone. The date is sent from here so it uses the user's timezone.
  async function toggleComplete(milestone) {
    if (busyIds.includes(milestone.id)) return;

    setBusy(milestone.id, true);
    setActionError('');
    try {
      const updated = await milestonesRequest(String(milestone.id), {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({ completedOn: milestone.completedOn ? null : todayString() }),
      });
      setMilestones((current) =>
        sortMilestones(current.map((item) => (item.id === milestone.id ? updated : item)))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(milestone.id, false);
    }
  }

  async function handleDelete(milestone) {
    if (busyIds.includes(milestone.id)) return;
    if (!window.confirm(`Delete "${milestone.name}"? This cannot be undone.`)) return;

    setBusy(milestone.id, true);
    setActionError('');
    try {
      await milestonesRequest(String(milestone.id), { method: 'DELETE' });
      setMilestones((current) => current.filter((item) => item.id !== milestone.id));
      if (editingId === milestone.id) {
        setEditingId(null);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(milestone.id, false);
    }
  }

  // Reuse the same rows for active and completed milestones.
  function renderMilestones(group) {
    return (
      <ul className="mt-4 space-y-2">
        {group.map((milestone) => {
          const isBusy = busyIds.includes(milestone.id);
          const isComplete = Boolean(milestone.completedOn);
          const isOverdue = !isComplete && Boolean(milestone.targetDate) && isPastDate(milestone.targetDate);

          return (
            <li key={milestone.id} className="rounded-md border border-stroke bg-surface px-4 py-3">
              {editingId === milestone.id ? (
                <MilestoneForm
                  idPrefix={`edit-milestone-${milestone.id}`}
                  initial={milestone}
                  submitLabel="Save"
                  busyLabel="Saving..."
                  onSubmit={(values) => handleUpdate(milestone.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isComplete}
                      disabled={isBusy}
                      onChange={() => toggleComplete(milestone)}
                      aria-label={`Mark ${milestone.name} as ${isComplete ? 'not completed' : 'completed'}`}
                      className="mt-1 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-wait"
                    />
                    <div className="min-w-0">
                      <p className={`break-words font-medium ${isComplete ? 'text-muted line-through' : 'text-foreground'}`}>
                        {milestone.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {isComplete
                          ? `Completed ${formatDate(milestone.completedOn)}`
                          : milestone.targetDate
                            ? `Target ${formatDate(milestone.targetDate)}`
                            : 'No target date'}
                        {isOverdue && <span className="ml-2 font-medium text-danger">Overdue</span>}
                      </p>
                      {milestone.description && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingId(milestone.id); setActionError(''); }}
                      disabled={isBusy || editingId !== null}
                      aria-label={`Edit ${milestone.name}`}
                      className={secondaryButton}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(milestone)}
                      disabled={isBusy}
                      aria-label={`Delete ${milestone.name}`}
                      className={dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // loading state
  if (loading) {
    return (
      <div className="loading" role="status">
        Loading Data...
      </div>
    );
  }

  // network error state
  if (networkError) {
    return (
      <div className="network-error">
        <p role="alert">Unable to load your milestones. Please try again.</p>
        <details className="mt-4 rounded-md border border-stroke bg-surface p-4">
          <summary className="cursor-pointer rounded-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">Technical details</summary>
          <p className="mt-3 break-words text-sm text-muted">{networkError}</p>
        </details>
        <button
          type="button"
          onClick={retryLoadMilestones}
          className="mt-4 cursor-pointer rounded-md border border-stroke bg-surface px-4 py-2 font-medium text-foreground hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Try again
        </button>
      </div>
    );
  }

  // Derive both groups from the same milestone state.
  const activeMilestones = milestones.filter((milestone) => !milestone.completedOn);
  const completedMilestones = milestones.filter((milestone) => milestone.completedOn);

  // successful data fetch
  return (
    <div className="page milestones-page">
      <h2 className="my-[0.83em] text-2xl font-bold">Milestones</h2>
      <p className="text-muted">Set bigger goals and track them to the finish.</p>

      {actionError && (
        <p role="alert" className="mt-4 rounded-md border border-danger px-4 py-3 text-danger">
          {actionError}
        </p>
      )}

      {/* Create New Milestone Form */}
      <section aria-labelledby="new-milestone" className="mt-6 rounded-md border border-stroke bg-surface p-4">
        <h3 id="new-milestone" className="mb-3 font-semibold">New milestone</h3>
        <MilestoneForm
          idPrefix="new-milestone"
          submitLabel="Add Milestone"
          busyLabel="Adding..."
          resetOnSuccess
          onSubmit={handleCreate}
        />
      </section>

      {/* Milestones List */}
      <section aria-labelledby="active-milestones" className="mt-6">
        <h3 id="active-milestones" className="font-semibold">Active milestones ({activeMilestones.length})</h3>
        {renderMilestones(activeMilestones)}
        {activeMilestones.length === 0 && <p className="mt-4 text-muted">No active milestones.</p>}
      </section>
      {completedMilestones.length > 0 && (
        <details className="mt-6 rounded-md border border-stroke bg-surface p-4">
          <summary className="cursor-pointer rounded-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
            Completed milestones ({completedMilestones.length})
          </summary>
          <div className="mt-2">
            {renderMilestones(completedMilestones)}
          </div>
        </details>
      )}
      {/* Announce updated counts without moving focus. */}
      <p role="status" className="sr-only">{activeMilestones.length} active milestones. {completedMilestones.length} completed milestones.</p>
    </div>
  );
}

export default Milestones;