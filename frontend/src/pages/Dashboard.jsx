/*
  Dashboard.jsx

  Creates the Dashboard component for the top level Dashboard route

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';

function Dashboard() {


  // TODO: maybe lift some states like the tasks
  // to App.jsx so the app doesn't load/fetch data
  // each time you move away and back to the dashboard.
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    fetch('/mock/tasks.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Fetched tasks:", data);
        setTasks(data);
      })
      .catch((err) => setNetworkError(err.message))
      .finally(() => setLoading(false));
  }, []); // empty array - run once when the page loads


  // Flip completion for the selected task.
  function toggleTask(taskID) {
    setTasks((currentTasks) => 
      currentTasks.map((task) =>
        task.id === taskID ? {...task, completed: !task.completed} : task
      )
    );
  }
  // loading state
  if (loading) {
    return (
      <div className="loading">
        Loading Data...
      </div>
    );
  }

  // network error state
  if (networkError) {
    return (
      <div className="network-error">
        <p role="alert">Unable to load your tasks. Please refresh the page to try again.</p>
        <details className="mt-4 rounded-md border border-stroke bg-surface p-4">
          <summary className="cursor-pointer rounded-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">Technical details</summary>
          <p className="mt-3 break-words text-sm text-muted">{networkError}</p>
        </details>
      </div>
    );
  }

  // Derive both groups from the same task state.
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // successful data fetch
  return (
    <div className="page dashboard-page">
      <h2 className="my-[0.83em] text-2xl font-bold">Dashboard Page</h2>

      {/* TODO: remove this when we develop the project more */}
      <section aria-labelledby="active-tasks" className="mt-6">
        <h3 id="active-tasks" className="mb-3 font-semibold">Active tasks ({activeTasks.length})</h3>
        <TaskList tasks={activeTasks} onToggle={toggleTask} />
        {activeTasks.length === 0 && <p className="text-muted">No active tasks.</p>}
      </section>
      {completedTasks.length > 0 && (
        <details className="mt-6 rounded-md border border-stroke bg-surface p-4">
          <summary className="cursor-pointer rounded-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
            Completed tasks ({completedTasks.length})
          </summary>
          <div className="mt-4">
            <TaskList tasks={completedTasks} onToggle={toggleTask} />
          </div>
        </details>
      )}
      {/* Announce updated counts without moving focus. */}
      <p role="status" className="sr-only">{activeTasks.length} active tasks. {completedTasks.length} completed tasks.</p>
    </div>
  );
}

export default Dashboard;
