/*
  Milestones.jsx

  Creates the Milestones component for the top level Milestones route.
  Provides per-user CRUD operations (Create, Read, Update, Delete)
  for milestones stored in PostgreSQL. A milestone is a goal with an
  optional target date. Checking it off records today as its completed date.

  Created by: Joseph Duff
  Created on: 11/20/2026
*/

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { milestonesRequest, tasksRequest } from '../auth/api';
import CompletionControl from '../components/CompletionControl';
import CompletionNotice from '../components/CompletionNotice';
import ViewSwitcher from '../components/ViewSwitcher';
import MilestoneForm from '../components/MilestoneForm';
import MilestoneProgress from '../components/MilestoneProgress';
import { habitsRequest } from '../habits/api';
import { formatDate, isPastDate, todayString } from '../utils/dates';

const jsonHeaders = { 'Content-Type': 'application/json' };

const secondaryButton =
  'cursor-pointer rounded-md border border-stroke bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60';

// same order the server uses: soonest target date first, no date last
function sortMilestones(list) {
  return [...list].sort((a, b) => {
    const dateA = a.targetDate ?? '9999-12-31';
    const dateB = b.targetDate ?? '9999-12-31';
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;
    return a.id - b.id;
  });
}

function groupByMilestone(items) {
  const groups = new Map();
  for (const item of items) {
    if (item.milestoneId == null) continue;
    const group = groups.get(item.milestoneId);
    if (group) group.push(item);
    else groups.set(item.milestoneId, [item]);
  }
  return groups;
}

function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [completionNotice, setCompletionNotice] = useState(null);
  const [linkedItems, setLinkedItems] = useState(null);
  const [progressError, setProgressError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState('active');
  const focusAfterRender = useRef(null);

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

  const loadProgress = useCallback((signal) =>
    Promise.all([tasksRequest('', { signal }), habitsRequest('', { signal })])
      .then(([tasks, { habits }]) => {
        if (!signal?.aborted) {
          setLinkedItems({ tasks: groupByMilestone(tasks), habits: groupByMilestone(habits) });
          setProgressError(false);
        }
      })
      .catch(() => {
        if (!signal?.aborted) setProgressError(true);
      }), []);

  useEffect(() => {
    const controller = new AbortController();
    loadMilestones(controller.signal);
    loadProgress(controller.signal);
    return () => controller.abort();
  }, [loadMilestones, loadProgress]);

  useLayoutEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    const element = document.getElementById(target.id);
    if (element && !element.closest('[hidden]')) element.focus();
    else if (target.fallback) document.getElementById(target.fallback)?.focus();
  }, [milestones, editingId, showCreate]);

  // The form shows any error from these two, so they throw instead of catching.
  async function handleCreate(values) {
    const created = await milestonesRequest('', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(values),
    });
    focusAfterRender.current = { id: `milestone-link-${created.id}` };
    setMilestones((current) => sortMilestones([...current, created]));
    setActionError('');
    setShowCreate(false);
    setView('active');
  }

  function toggleCreate() {
    if (!showCreate) focusAfterRender.current = { id: 'new-milestone-name' };
    setShowCreate(!showCreate);
  }

  function cancelCreate() {
    focusAfterRender.current = { id: 'new-milestone-toggle' };
    setShowCreate(false);
  }

  function finishEditing(milestoneId) {
    focusAfterRender.current = { id: `milestone-edit-${milestoneId}` };
    setEditingId(null);
  }

  async function handleUpdate(milestoneId, values) {
    const updated = await milestonesRequest(String(milestoneId), {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify(values),
    });
    finishEditing(milestoneId);
    setMilestones((current) =>
      sortMilestones(current.map((item) => (item.id === milestoneId ? updated : item)))
    );
    setActionError('');
  }

  // Check off or reopen a milestone. The date is sent from here so it uses the user's timezone.
  async function toggleComplete(milestone) {
    if (busyIds.includes(milestone.id)) return;

    const checkboxId = `milestone-completion-${milestone.id}`;
    const hadFocus = document.activeElement?.id === checkboxId;
    setBusy(milestone.id, true);
    setActionError('');
    try {
      const updated = await milestonesRequest(String(milestone.id), {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({ completedOn: milestone.completedOn ? null : todayString() }),
      });
      if (hadFocus && (document.activeElement === document.body || document.activeElement?.id === checkboxId)) {
        focusAfterRender.current = { id: checkboxId, fallback: 'milestone-list-heading' };
      }
      setMilestones((current) =>
        sortMilestones(current.map((item) => (item.id === milestone.id ? updated : item)))
      );
      setCompletionNotice(updated.completedOn
        ? { celebrate: milestone.id, message: `Milestone complete. ${updated.name}` }
        : null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(milestone.id, false);
    }
  }

  async function handleDelete(milestone) {
    if (busyIds.includes(milestone.id)) return;
    if (!window.confirm(`Delete "${milestone.name}"? Linked tasks and habits will be kept and unassigned.`)) return;

    setBusy(milestone.id, true);
    setActionError('');
    try {
      await milestonesRequest(String(milestone.id), { method: 'DELETE' });
      focusAfterRender.current = { id: 'milestone-list-heading' };
      setMilestones((current) => current.filter((item) => item.id !== milestone.id));
      setCompletionNotice((current) => current?.celebrate === milestone.id ? null : current);
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
      <ul className="divided-list">
        {group.map((milestone) => {
          const isBusy = busyIds.includes(milestone.id);
          const isComplete = Boolean(milestone.completedOn);
          const isOverdue = !isComplete && Boolean(milestone.targetDate) && isPastDate(milestone.targetDate);

          return (
            <li key={milestone.id} className="relative motion-safe:transition-colors has-[a:hover]:bg-surface/60">
              {editingId === milestone.id ? (
                <div className="p-4">
                  <MilestoneForm
                    idPrefix={`edit-milestone-${milestone.id}`}
                    initial={milestone}
                    submitLabel="Save"
                    busyLabel="Saving..."
                    onSubmit={(values) => handleUpdate(milestone.id, values)}
                    onCancel={() => finishEditing(milestone.id)}
                    onDelete={() => handleDelete(milestone)}
                    deleting={isBusy}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-1 px-1 py-3 sm:gap-3 sm:px-2">
                  <div className="relative z-10">
                    <CompletionControl
                      id={`milestone-completion-${milestone.id}`}
                      label={`Mark ${milestone.name} as ${isComplete ? 'not completed' : 'completed'}`}
                      checked={isComplete}
                      disabled={isBusy}
                      onChange={() => toggleComplete(milestone)}
                    />
                  </div>
                  <Link id={`milestone-link-${milestone.id}`} to={`/milestones/${milestone.id}`} aria-labelledby={`milestone-title-${milestone.id}`}
                    className="flex min-h-11 min-w-0 items-start gap-2 py-2.5 no-underline before:absolute before:inset-0 focus-visible:outline-none focus-visible:before:-outline-offset-2 focus-visible:before:outline-2 focus-visible:before:outline-focus">
                    <div className="min-w-0 flex-1">
                      <p id={`milestone-title-${milestone.id}`} className={`break-words font-semibold ${isComplete ? 'text-muted' : 'text-foreground'}`}>
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
                      {linkedItems && (
                        <MilestoneProgress
                          tasks={linkedItems.tasks.get(milestone.id) ?? []}
                          habits={linkedItems.habits.get(milestone.id) ?? []}
                        />
                      )}
                    </div>
                    <span aria-hidden="true" className="shrink-0 text-xl leading-6 text-muted">›</span>
                  </Link>
                  <button id={`milestone-edit-${milestone.id}`} type="button" aria-label={`Edit ${milestone.name}`}
                    disabled={isBusy || editingId !== null} onClick={() => { setEditingId(milestone.id); setActionError(''); }}
                    className="secondary-control relative z-10 cursor-pointer disabled:opacity-60">Edit</button>
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
        <p className="mt-3 break-words text-sm text-muted">{networkError}</p>
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Milestones</h2>
          <p className="mt-1 text-muted">Set bigger goals and track them to the finish.</p>
        </div>
        <button id="new-milestone-toggle" type="button" aria-expanded={showCreate} aria-controls="new-milestone-form"
          onClick={toggleCreate} className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          New milestone
        </button>
      </header>

      <div className={completionNotice ? 'mt-4' : ''}>
        <CompletionNotice change={completionNotice} milestone />
      </div>
      {actionError && (
        <p role="alert" className="mt-4 rounded-md border border-danger px-4 py-3 text-danger">
          {actionError}
        </p>
      )}
      {progressError && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <p role="status" className="text-muted">Unable to load linked tasks and habits.</p>
          <button type="button" className={secondaryButton} onClick={() => loadProgress()}>Retry progress</button>
        </div>
      )}

      {/* Create New Milestone Form */}
      <section id="new-milestone-form" hidden={!showCreate} aria-labelledby="new-milestone" className="mt-6 border-y border-stroke/55 py-4">
        <h3 id="new-milestone" className="mb-3 font-semibold">New milestone</h3>
        <MilestoneForm
          idPrefix="new-milestone"
          submitLabel="Add Milestone"
          busyLabel="Adding..."
          resetOnSuccess
          onSubmit={handleCreate}
          onCancel={cancelCreate}
        />
      </section>

      {/* Milestones List */}
      <section aria-labelledby="milestone-list-heading" className="mt-6 space-y-3">
        <ViewSwitcher label="Milestone views" value={view} onChange={setView}
          views={[['active', `Active (${activeMilestones.length})`], ['completed', `Completed (${completedMilestones.length})`]]} />
        <h3 id="milestone-list-heading" tabIndex={-1} className="text-lg font-semibold">{view === 'active' ? 'Active milestones' : 'Completed milestones'}</h3>
        <div hidden={view !== 'active'}>
          {activeMilestones.length > 0 ? renderMilestones(activeMilestones) : <p className="text-muted">No active milestones.</p>}
        </div>
        <div hidden={view !== 'completed'}>
          {completedMilestones.length > 0 ? renderMilestones(completedMilestones) : <p className="text-muted">No completed milestones.</p>}
        </div>
      </section>
      {/* Announce updated counts without moving focus. */}
      <p role="status" className="sr-only">{activeMilestones.length} active milestones. {completedMilestones.length} completed milestones.</p>
    </div>
  );
}

export default Milestones;
