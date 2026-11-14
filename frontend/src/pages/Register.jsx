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

  const inputClass = 'min-h-16 w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800';

  return (
    <div className="page register-page">
      <h1 className="my-[0.83em] text-2xl font-bold">Create account</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset disabled={submitting} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block font-medium text-stone-900">Name:</label>
            <input id="name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block font-medium text-stone-900">Email:</label>
            <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium text-stone-900">Password:</label>
            <input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} aria-describedby="password-help" className={inputClass} />
            <p id="password-help" className="mt-2 text-sm text-stone-600">Use 8 to 128 characters.</p>
          </div>
          <button type="submit" className="min-h-16 w-full cursor-pointer rounded-md border border-stone-200 bg-white px-4 py-3 font-medium text-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </fieldset>
      </form>
      <p className="mt-4">
        Already have an account?{' '}
        <Link to="/login" state={{ from: location.state?.from }} className="text-green-800 underline focus-visible:outline-2 focus-visible:outline-offset-4">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
