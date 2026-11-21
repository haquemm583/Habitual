/*
  Tasks.jsx

  Creates the Tasks component for the dedicated Tasks route.
  Provides per-user CRUD operations (Create, Read, Update, Delete)
  for tasks stored in PostgreSQL.

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useState, useLayoutEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTasks } from '../tasks/useTasks';
import MilestonePicker from '../components/MilestonePicker';
import MilestoneChip from '../components/MilestoneChip';
import CompletionControl from '../components/CompletionControl';
import CompletionNotice from '../components/CompletionNotice';
import ViewSwitcher from '../components/ViewSwitcher';
import { useMilestoneOptions } from '../milestones/useMilestoneOptions';

function Tasks() {
  const { user } = useAuth();
  const milestoneOptions = useMilestoneOptions();
  const { tasks, loadError, reload, createTask, updateTask, deleteTask } = useTasks();
  const [actionError, setActionError] = useState('');
  const [change, setChange] = useState(null);
  const [view, setView] = useState('active');
  const focusAfterRender = useRef(null);

  // Create task state
  const [newTaskName, setNewTaskName] = useState('');
  const [newMilestoneId, setNewMilestoneId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Edit task state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);

  // Track in-flight task mutations by task ID
  const [busyTaskIds, setBusyTaskIds] = useState([]);

  function setTaskBusy(taskId, isBusy) {
    setBusyTaskIds((current) =>
      isBusy ? [...current, taskId] : current.filter((id) => id !== taskId)
    );
  }

  useLayoutEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    const element = document.getElementById(target.id);
    if (element && !element.closest('[hidden]')) element.focus();
    else if (target.fallback) document.getElementById(target.fallback)?.focus();
  }, [tasks, editingId, change]);

  async function handleCreateTask(event) {
    event.preventDefault();
    if (creating) return;

    const trimmedName = newTaskName.trim();
    if (!trimmedName) {
      setActionError('Enter a task name.');
      return;
    }

    setCreating(true);
    setActionError('');
    try {
      await createTask({ name: trimmedName, milestoneId: newMilestoneId });
      setNewTaskName('');
      setNewMilestoneId(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCreating(false);
    }
  }

  // Flip completion for the selected task.
  async function toggleTask(task, undoing = false) {
    if (busyTaskIds.includes(task.id)) return;

    setTaskBusy(task.id, true);
    setActionError('');
    try {
      const updatedTask = await updateTask(task.id, { completed: !task.completed });
      const checkboxId = `task-completion-${task.id}`;
      if (undoing || document.activeElement?.id === checkboxId) {
        focusAfterRender.current = { id: checkboxId, fallback: 'undo-task-change' };
      }
      setChange(undoing
        ? { message: 'Task change undone.' }
        : {
          taskId: task.id,
          celebrate: updatedTask.completed ? task.id : null,
          message: updatedTask.completed ? 'Task completed.' : 'Task reopened.',
          undo: () => toggleTask(updatedTask, true),
        });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTaskBusy(task.id, false);
    }
  }

  function startEditing(task) {
    if (busyTaskIds.includes(editingId)) return;
    setEditingId(task.id);
    setEditingName(task.name);
    setEditingMilestoneId(task.milestoneId ?? null);
    setActionError('');
  }

  function cancelEditing() {
    focusAfterRender.current = { id: `task-edit-${editingId}` };
    setEditingId(null);
    setEditingName('');
  }

  async function handleSaveEdit(event, task) {
    event.preventDefault();
    const taskId = task.id;
    if (busyTaskIds.includes(taskId)) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setActionError('Task name cannot be empty.');
      return;
    }

    setTaskBusy(taskId, true);
    setActionError('');
    try {
      await updateTask(taskId, {
        name: trimmedName,
        ...(editingMilestoneId !== (task.milestoneId ?? null) ? { milestoneId: editingMilestoneId } : {}),
      });
      cancelEditing();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTaskBusy(taskId, false);
    }
  }

  async function handleDeleteTask(taskId) {
    if (busyTaskIds.includes(taskId)) return;

    setTaskBusy(taskId, true);
    setActionError('');
    try {
      await deleteTask(taskId);
      setChange((current) => current?.taskId === taskId ? null : current);
      if (editingId === taskId) {
        cancelEditing();
      }
      focusAfterRender.current = { id: 'task-list-heading' };
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTaskBusy(taskId, false);
    }
  }

  // Reuse the same rows for active and completed tasks.
  function renderTasks(taskGroup) {
    return (
      <ul className="divided-list">
        {taskGroup.map((task) => {
          const isBusy = busyTaskIds.includes(task.id);
          const isEditing = editingId === task.id;
          const milestoneName = milestoneOptions.milestones.find((milestone) => milestone.id === task.milestoneId)?.name;

          return (
            <li
              key={task.id}
              className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-1 py-3 hover:bg-surface/60 sm:px-2"
            >
              {isEditing ? (
                <form
                  onSubmit={(event) => handleSaveEdit(event, task)}
                  className="flex w-full flex-wrap items-center gap-2"
                >
                  <label htmlFor={`edit-task-${task.id}`} className="sr-only">
                    Edit task name
                  </label>
                  <input
                    id={`edit-task-${task.id}`}
                    type="text"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    maxLength={200}
                    disabled={isBusy}
                    autoFocus
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-field-border bg-surface px-3 py-1.5 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
                  />
                  <MilestonePicker id={`edit-task-milestone-${task.id}`} options={milestoneOptions}
                    value={editingMilestoneId} onChange={setEditingMilestoneId} disabled={isBusy} />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="min-h-11 cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60"
                    >
                      {isBusy ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isBusy}
                      className="min-h-11 cursor-pointer rounded-lg border border-stroke bg-surface px-3 py-1.5 text-sm font-medium hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="w-full border-t border-stroke pt-2">
                    <button type="button" disabled={isBusy} onClick={() => handleDeleteTask(task.id)}
                      className="secondary-control cursor-pointer text-danger disabled:opacity-60">Delete task</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <CompletionControl
                      id={`task-completion-${task.id}`}
                      label={task.name}
                      checked={Boolean(task.completed)}
                      disabled={isBusy}
                      onChange={() => toggleTask(task)}
                    />
                    <div className="min-w-0">
                      <label htmlFor={`task-completion-${task.id}`} className={`block cursor-pointer break-words ${task.completed ? 'text-muted' : 'text-foreground'}`}>
                        {task.name}
                      </label>
                      {milestoneName && <div className="mt-1"><MilestoneChip id={task.milestoneId} name={milestoneName} /></div>}
                    </div>
                  </div>

                  <button id={`task-edit-${task.id}`} type="button" aria-label={`Edit ${task.name}`}
                    disabled={isBusy || busyTaskIds.includes(editingId)} onClick={() => startEditing(task)}
                    className="secondary-control cursor-pointer disabled:opacity-60">Edit</button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // loading state
  if (!tasks && !loadError) {
    return (
      <div className="loading" role="status">
        Loading Data...
      </div>
    );
  }

  // network error state
  if (loadError) {
    return (
      <div className="network-error">
        <p role="alert">Unable to load your tasks. Please refresh the page to try again.</p>
        <p className="mt-3 break-words text-sm text-muted">{loadError}</p>
        <button
          type="button"
          onClick={reload}
          className="secondary-control mt-4 cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // Derive both groups from the same task state.
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // successful data fetch
  return (
    <div className="page tasks-page">
      <h2 className="mb-6 text-3xl font-bold tracking-tight">
        {user?.name ? `${user.name}'s Tasks` : 'Tasks'}
      </h2>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-danger bg-surface px-4 py-3 text-danger">
          {actionError}
        </p>
      )}

      {/* Create New Task Form */}
      <form onSubmit={handleCreateTask} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label htmlFor="new-task-input" className="sr-only">
          New task name
        </label>
        <input
          id="new-task-input"
          type="text"
          value={newTaskName}
          onChange={(event) => setNewTaskName(event.target.value)}
          placeholder="Add a new task..."
          maxLength={200}
          disabled={creating}
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-field-border bg-surface px-4 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        />
        <div className="sm:w-48">
          <MilestonePicker id="new-task-milestone" options={milestoneOptions}
            value={newMilestoneId} onChange={setNewMilestoneId} disabled={creating} />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="min-h-12 cursor-pointer rounded-lg bg-primary px-5 py-2 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60"
        >
          {creating ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {/* Tasks List */}
      {/* TODO: remove this when we develop the project more */}
      <section aria-labelledby="task-list-heading" className="mt-6 space-y-3">
        <ViewSwitcher label="Task views" value={view} onChange={setView}
          views={[['active', `Active (${activeTasks.length})`], ['completed', `Completed (${completedTasks.length})`]]} />
        <h3 id="task-list-heading" tabIndex={-1} className="text-lg font-semibold">{view === 'active' ? 'Active tasks' : 'Completed tasks'}</h3>
        <div hidden={view !== 'active'}>
          {activeTasks.length > 0 ? renderTasks(activeTasks) : <p className="text-muted">No active tasks.</p>}
        </div>
        <div hidden={view !== 'completed'}>
          {completedTasks.length > 0 ? renderTasks(completedTasks) : <p className="text-muted">No completed tasks.</p>}
        </div>
      </section>
      <div className="mt-3">
        <CompletionNotice change={change} busy={busyTaskIds.length > 0} undoId="undo-task-change" />
      </div>
      {/* Announce updated counts without moving focus. */}
      <p role="status" className="sr-only">{activeTasks.length} active tasks. {completedTasks.length} completed tasks.</p>
    </div>
  );
}

export default Tasks;
