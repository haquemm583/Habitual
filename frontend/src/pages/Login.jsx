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
      <h1 className="my-[0.83em] text-2xl font-bold">Login Page</h1>
      {location.state?.registered && <p role="status" className="text-green-800">Account created. Log in to continue.</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block font-medium text-stone-900">Email:</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-h-16 w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block font-medium text-stone-900">Password:</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="min-h-16 w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
          />
        </div>

        <button type="submit" disabled={submitting}
        className="min-h-16 w-full cursor-pointer rounded-md border border-stone-200 bg-white px-4 py-3 font-medium text-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:cursor-wait disabled:opacity-60"
        >{submitting ? 'Logging in...' : 'Login'}</button>
      </form>
      <p className="mt-4">
        New to Habitual?{' '}
        <Link to="/register" state={{ from: location.state?.from }} className="text-green-800 underline focus-visible:outline-2 focus-visible:outline-offset-4">Create account</Link>
      </p>
    </div>
  );
}

export default Login;
