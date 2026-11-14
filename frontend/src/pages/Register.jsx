/*
  Register.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authRequest } from '../auth/api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      const account = await authRequest('register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      navigate('/login', {
        replace: true,
        state: { registered: true, email: account.email, from: location.state?.from },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p role="status">Checking your session...</p>;
  if (user) return <Navigate to="/dashboard" replace />;

  const inputClass = 'min-h-16 w-full rounded-md transition-colors duration-150 motion-reduce:transition-none border border-field-border bg-surface px-4 py-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus';

  return (
    <div className="page register-page">
      {/* Keep the requested destination when switching forms. */}
      <nav aria-label="Account access" className="mb-6 grid grid-cols-2 rounded-lg bg-hover p-1">
        <Link to="/login" state={{ from: location.state?.from }} className="rounded-md px-3 py-2 text-center text-sm font-medium text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus">Log in</Link>
        <span aria-current="page" className="rounded-md bg-surface px-3 py-2 text-center text-sm font-semibold text-foreground shadow-sm">Sign up</span>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Start building better habits with Habitual.</p>
      {error && <p role="alert" className="text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset disabled={submitting} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block font-medium text-foreground">Name:</label>
            <input id="name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block font-medium text-foreground">Email:</label>
            <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium text-foreground">Password:</label>
            {/* Match the backend password limits. */}
            <input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} aria-describedby="password-help" className={inputClass} />
            <p id="password-help" className="mt-2 text-sm text-muted">Use 8 to 128 characters.</p>
          </div>
          <button type="submit" className="min-h-12 w-full cursor-pointer rounded-md transition-colors duration-150 motion-reduce:transition-none bg-primary px-4 py-3 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

export default Register;
