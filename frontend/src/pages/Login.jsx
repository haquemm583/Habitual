/*
  Login.jsx

  Creates the Login component for the top level Login route

  Created by: Joseph Duff
  Created on: 10/25/2026

  Note: Currently this Login Page does not store the credentials 
        nor does it have any actionable purpose. 
  TODO: Create a link between Login Page and database 
        to have saved user information 

  Update: The form now authenticates through the backend session API.

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/

import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Login() {
  const location = useLocation();
  /* these constants create two pieces of the state.
    
    - email: holding the value
    - setEmail: submitting a reqeust to update the state of the value, 
    - useState(''): initialized empty state
    
   */
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, loading, login } = useAuth();
  const from = location.state?.from;
  const destination = typeof from === 'string' && /^\/dashboard(?:[?#]|$)/.test(from) ? from : '/dashboard';
  
  async function handleSubmit(event) {
    // prevents the page from reloading before the submission is handled 
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p role="status">Checking your session...</p>;
  if (user) return <Navigate to={destination} replace />;

  return (
    <div className="page login-page">
      {/* Keep the requested destination when switching forms. */}
      <nav aria-label="Account access" className="mb-6 grid grid-cols-2 rounded-lg bg-hover p-1">
        <span aria-current="page" className="rounded-md bg-surface px-3 py-2 text-center text-sm font-semibold text-foreground shadow-sm">Log in</span>
        <Link to="/register" state={{ from: location.state?.from }} className="rounded-md px-3 py-2 text-center text-sm font-medium text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus">Sign up</Link>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Sign in to your Habitual account.</p>
      {location.state?.registered && <p role="status" className="text-muted">Account created. Log in to continue.</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block font-medium text-foreground">Email:</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-h-16 w-full rounded-md transition-colors duration-150 motion-reduce:transition-none border border-field-border bg-surface px-4 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block font-medium text-foreground">Password:</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="min-h-16 w-full rounded-md transition-colors duration-150 motion-reduce:transition-none border border-field-border bg-surface px-4 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          />
        </div>

        <button type="submit" disabled={submitting}
        className="min-h-12 w-full cursor-pointer rounded-md transition-colors duration-150 motion-reduce:transition-none bg-primary px-4 py-3 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60"
        >{submitting ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}

export default Login;
