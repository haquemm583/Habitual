/*
  Dashboard.jsx

  Creates the Dashboard component for the top level Dashboard route

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { useState, useEffect } from 'react';

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


  function toggleTask(taskID) {
    setTasks((currentTasks) => 
      currentTasks.map((task) =>
        task.id === taskID ? {...task, completed:task.completed} : task
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
        The data request failed for reason: {networkError}. Please try refreshing the page
        or contact the developers if the issue persists.
      </div>
    );
  }

  // successful data fetch
  return (
    <div className="page dashboard-page">
      <h2 className="my-[0.83em] text-2xl font-bold">Dashboard Page</h2>

      {/* TODO: remove this when we develop the project more */}
      <ul className="mt-6 space-y-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border border-stone-200 bg-white px-4 py-3 hover:bg-stone-50">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="size-5 shrink-0 cursor-pointer accent-green-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
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
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
