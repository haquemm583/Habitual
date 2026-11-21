import { useEffect, useState } from 'react';
import { tasksRequest } from '../auth/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

export function useTasks() {
  const [tasks, setTasks] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    tasksRequest('', { signal: controller.signal })
      .then((items) => { if (!controller.signal.aborted) setTasks(items); })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [requestVersion]);

  function reload() {
    setLoadError('');
    setRequestVersion((version) => version + 1);
  }

  async function createTask(fields) {
    const created = await tasksRequest('', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(fields) });
    setTasks((items) => [...items, created]);
  }

  async function updateTask(id, fields) {
    const updated = await tasksRequest(String(id), { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(fields) });
    setTasks((items) => items.map((item) => item.id === id ? updated : item));
    return updated;
  }

  async function deleteTask(id) {
    await tasksRequest(String(id), { method: 'DELETE' });
    setTasks((items) => items.filter((item) => item.id !== id));
  }

  return { tasks, loadError, reload, createTask, updateTask, deleteTask };
}
