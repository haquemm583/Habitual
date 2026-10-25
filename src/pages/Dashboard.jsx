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
      <h2>Dashboard Page</h2>

      {/* TODO: remove this when we develop the project more */}
      <ul>
        {tasks.map((task) => {
          return <li key={task.id}>{task.name}</li>
        })}
      </ul>
    </div>
  );
}

export default Dashboard;
