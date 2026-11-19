import { useCallback, useEffect, useRef, useState } from 'react';
import { habitsRequest } from './api';

export function useHabits(month = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const mutation = useRef(false);

  const refresh = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    return habitsRequest('', { month, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) { setData(result); setLoadError(''); }
      })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [month]);

  useEffect(() => {
    refresh();
    // Refresh on return and across midnight or a device timezone change.
    const update = () => { if (!mutation.current && !document.hidden) refresh(); };
    const timer = setInterval(update, 30000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      request.current?.abort(); clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh]);

  async function run(path, method, body) {
    if (mutation.current) return false;
    mutation.current = true;
    request.current?.abort();
    setBusy(true); setActionError('');
    try {
      await habitsRequest(path, {
        month, method,
        ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      await refresh();
      return true;
    } catch (error) {
      setActionError(error.message);
      return false;
    } finally { mutation.current = false; setBusy(false); }
  }

  return { data, loading, loadError, actionError, busy, refresh, run };
}
