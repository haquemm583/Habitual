/*
  App.jsx

  This holds the App component which embeds the
  sidebar component, the main section which contains
  the routes, and the footer.

  To add a new route, simply add it with
  the existing routes.

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026

  Last modified by: Joseph Duff
  Last modified on: 11/20/2026
*/
import { Navigate, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Milestones from './pages/Milestones';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import RequireAuth from './components/auth/RequireAuth';
function App() {
  return (
    <Routes>
      <Route path="welcome" element={<Home />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
        <Route path="habits" element={<RequireAuth><Habits /></RequireAuth>} />
        <Route path="milestones" element={<RequireAuth><Milestones /></RequireAuth>} />
        <Route path="*" element={<NotFound />} /> {/* shows when an invalid route is typed in the url */}
      </Route>
      {/* Account pages use a separate layout. */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
