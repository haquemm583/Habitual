import { useRef, useState } from 'react';
import { useTasks } from '../../tasks/useTasks';
import ChecklistRow from '../ChecklistRow';
import CompletionNotice from '../CompletionNotice';
import NavigationLink from '../NavigationLink';
import ProgressRing from '../ProgressRing';

function TaskChecklist({ milestoneId, milestones }) {
  const { tasks, loadError, reload, createTask, updateTask } = useTasks();
  const [actionError, setActionError] = useState('');
  const [change, setChange] = useState(null);
  const [recentIds, setRecentIds] = useState([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const nameInput = useRef(null);
  const linked = milestoneId != null;

  async function save(action) {
    setBusy(true);
    setActionError('');
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) { setActionError('Enter a task name.'); return; }
    if (!await save(() => createTask({ name: name.trim(), milestoneId }))) return;
    setName('');
    setChange({ message: 'Task added.' });
    nameInput.current?.focus();
  }

  async function setCompletion(task, completed, undoing = false) {
    if (busy) return;
    if (!await save(() => updateTask(task.id, { completed }))) return;
    setRecentIds((current) => current.includes(task.id) ? current : [...current, task.id]);
    if (undoing) document.getElementById(`checklist-task-${task.id}`)?.focus();
    setChange(undoing
      ? { message: 'Task change undone.' }
      : { message: completed ? 'Task completed.' : 'Task reopened.', undo: () => setCompletion(task, !completed, true) });
  }

  const scoped = tasks?.filter((task) => !linked || task.milestoneId === milestoneId) ?? [];
  const completedCount = scoped.filter((task) => task.completed).length;
  const visible = linked ? scoped : scoped.filter((task) => !task.completed || recentIds.includes(task.id));

  return (
    <section aria-labelledby="checklist-tasks" className="min-w-0 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          {tasks && !loadError && (
            <ProgressRing completed={completedCount} total={scoped.length}
              label={linked ? 'Milestone task completion' : 'Completion across all tasks'} />
          )}
          <div className="min-w-0">
            <h3 id="checklist-tasks" className="text-lg font-semibold">{linked ? 'Tasks' : 'Open tasks'}</h3>
            {tasks && <p className="mt-1 text-sm text-muted">{linked
              ? `${completedCount} of ${scoped.length} done`
              : `${scoped.length - completedCount} open · ${completedCount} done`}</p>}
          </div>
        </div>
        <NavigationLink to="/tasks">All tasks</NavigationLink>
      </header>
      {loadError ? (
        <div className="space-y-1">
          <p role="alert" className="break-words text-danger">{loadError}</p>
          <button type="button" onClick={reload} className="secondary-control cursor-pointer">Retry tasks</button>
        </div>
      ) : !tasks ? <p role="status" className="text-sm text-muted">Loading tasks…</p> : (
        <>
          {visible.length ? (
            <ul className="divided-list">
              {visible.map((task) => (
                <ChecklistRow key={task.id} id={`checklist-task-${task.id}`} name={task.name} checked={task.completed}
                  disabled={busy} onChange={() => setCompletion(task, !task.completed)}
                  milestone={!linked && milestones?.get(task.milestoneId)} />
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{linked ? 'No linked tasks yet.' : 'No open tasks.'}</p>}
          {linked && (
            <form onSubmit={addTask} className="flex flex-col gap-2 pt-1 sm:flex-row">
              <label className="sr-only" htmlFor="linked-task-name">New task name</label>
              <input ref={nameInput} id="linked-task-name" value={name} onChange={(event) => setName(event.target.value)}
                placeholder="New task" required maxLength={200} readOnly={busy}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-field-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
              <button type="submit" disabled={busy} className="min-h-11 shrink-0 cursor-pointer rounded-lg bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">Add task</button>
            </form>
          )}
        </>
      )}
      {actionError && <p role="alert" className="break-words text-sm text-danger">{actionError}</p>}
      <CompletionNotice change={change} busy={busy} />
    </section>
  );
}

export default TaskChecklist;
