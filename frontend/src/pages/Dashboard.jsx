/*
  Dashboard.jsx

  Creates the Dashboard component for the top level Dashboard route.
  Provides per-user CRUD operations (Create, Read, Update, Delete)
  for tasks stored in PostgreSQL.

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { tasksRequest } from '../auth/api';

function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [actionError, setActionError] = useState('');

  // Create task state
  const [newTaskName, setNewTaskName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit task state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Track in-flight task mutations by task ID
  const [busyTaskIds, setBusyTaskIds] = useState([]);

  function setTaskBusy(taskId, isBusy) {
    setBusyTaskIds((current) =>
      isBusy ? [...current, taskId] : current.filter((id) => id !== taskId)
    );
  }

  const loadTasks = useCallback((signal) =>
    tasksRequest('', { signal })
      .then((data) => {
        if (!signal?.aborted) {
          setTasks(data);
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

  function retryLoadTasks() {
    setLoading(true);
    setNetworkError(null);
    loadTasks();
  }

  useEffect(() => {
    const controller = new AbortController();
    loadTasks(controller.signal);
    return () => controller.abort();
  }, [loadTasks]);

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
      const createdTask = await tasksRequest('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      setTasks((currentTasks) => [...currentTasks, createdTask]);
      setNewTaskName('');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleTask(task) {
    if (busyTaskIds.includes(task.id)) return;

    setTaskBusy(task.id, true);
    setActionError('');
    try {
      const updatedTask = await tasksRequest(String(task.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? updatedTask : item))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTaskBusy(task.id, false);
    }
  }

  function startEditing(task) {
    setEditingId(task.id);
    setEditingName(task.name);
    setActionError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleSaveEdit(event, taskId) {
    event.preventDefault();
    if (busyTaskIds.includes(taskId)) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setActionError('Task name cannot be empty.');
      return;
    }

    setTaskBusy(taskId, true);
    setActionError('');
    try {
      const updatedTask = await tasksRequest(String(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === taskId ? updatedTask : item))
      );
      setEditingId(null);
      setEditingName('');
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
      await tasksRequest(String(taskId), {
        method: 'DELETE',
      });
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== taskId));
      if (editingId === taskId) {
        cancelEditing();
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTaskBusy(taskId, false);
    }
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
      <div className="network-error" role="alert">
        <p>
          The data request failed for reason: {networkError}. Please try refreshing the page
          or contact the developers if the issue persists.
        </p>
        <button
          type="button"
          onClick={retryLoadTasks}
          className="mt-4 cursor-pointer rounded-md border border-stone-300 bg-white px-4 py-2 font-medium text-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
        >
          Try again
        </button>
      </div>
    );
  }

  // successful data fetch
  return (
    <div className="page dashboard-page">
      <h2 className="my-[0.83em] text-2xl font-bold">
        {user?.name ? `${user.name}'s Dashboard` : 'Dashboard Page'}
      </h2>

      {actionError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {actionError}
        </p>
      )}

      {/* Create New Task Form */}
      <form onSubmit={handleCreateTask} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="new-task-input" className="sr-only">
          New task name
        </label>
        <input
          id="new-task-input"
          type="text"
          value={newTaskName}
          onChange={(event) => setNewTaskName(event.target.value)}
          placeholder="Add a new task or habit..."
          maxLength={200}
          disabled={creating}
          className="min-h-12 flex-1 rounded-md border border-stone-200 bg-white px-4 py-2 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={creating}
          className="min-h-12 cursor-pointer rounded-md border border-stone-200 bg-white px-5 py-2 font-medium text-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:cursor-wait disabled:opacity-60"
        >
          {creating ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <p className="mt-6 rounded-md border border-stone-200 bg-white px-4 py-6 text-center text-stone-600">
          No tasks yet. Add your first task above!
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {tasks.map((task) => {
            const isBusy = busyTaskIds.includes(task.id);
            const isEditing = editingId === task.id;

            return (
              <li
                key={task.id}
                className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 hover:bg-stone-50"
              >
                {isEditing ? (
                  <form
                    onSubmit={(event) => handleSaveEdit(event, task.id)}
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
                      className="min-h-10 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-60"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="cursor-pointer rounded-md border border-green-800 bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isBusy ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isBusy}
                        className="cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-4">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        disabled={isBusy}
                        onChange={() => toggleTask(task)}
                        className="size-5 shrink-0 cursor-pointer accent-green-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:cursor-wait"
                      />

                      <span
                        className={`min-w-0 break-words ${
                          task.completed
                            ? 'text-stone-500 line-through'
                            : 'text-stone-900'
                        }`}
                      >
                        {task.name}
                      </span>
                    </label>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(task)}
                        disabled={isBusy}
                        aria-label={`Edit ${task.name}`}
                        className="cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isBusy}
                        aria-label={`Delete ${task.name}`}
                        className="cursor-pointer rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
