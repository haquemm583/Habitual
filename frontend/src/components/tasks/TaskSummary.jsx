import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksRequest } from '../../auth/api';

function TaskSummary() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback((signal) => tasksRequest('', { signal })
    .then((data) => { if (!signal?.aborted) { setTasks(data); setError(''); } })
    .catch((requestError) => { if (!signal?.aborted) setError(requestError.message); }), []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <section aria-labelledby="task-overview" className="space-y-3 rounded-lg border border-stroke bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="task-overview" className="font-semibold">Task overview</h3>
        <Link to="/tasks" className="rounded-sm text-sm text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Manage tasks</Link>
      </div>
      {error ? <div>
        <p role="alert" className="break-words text-danger">Unable to load task overview. {error}</p>
        <button type="button" onClick={() => load()} className="min-h-11 cursor-pointer rounded-sm underline focus-visible:outline-2 focus-visible:outline-focus">Retry task overview</button>
      </div> : tasks ? <dl className="flex flex-wrap gap-x-8 gap-y-3">
        <div><dt className="text-sm text-muted">Active tasks</dt><dd className="text-xl font-semibold">{tasks.filter((task) => !task.completed).length}</dd></div>
        <div><dt className="text-sm text-muted">Completed tasks</dt><dd className="text-xl font-semibold">{tasks.filter((task) => task.completed).length}</dd></div>
      </dl> : <p role="status" className="text-muted">Loading task overview...</p>}
    </section>
  );
}

export default TaskSummary;
