import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { authRequest } from '../../auth/api';

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkSession = useCallback((signal) =>
    authRequest('me', { signal })
      .then((currentUser) => {
        if (!signal?.aborted) setUser(currentUser);
      })
      .catch((requestError) => {
        if (!signal?.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      }), []);

  function retrySession() {
    setLoading(true);
    setError('');
    checkSession();
  }

  useEffect(() => {
    const controller = new AbortController();
    checkSession(controller.signal);
    return () => controller.abort();
  }, [checkSession]);

  async function login(email, password) {
    const currentUser = await authRequest('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setUser(currentUser);
    setError('');
  }

  async function logout() {
    await authRequest('logout', { method: 'POST' });
    setUser(null);
    setError('');
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, checkSession: retrySession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
