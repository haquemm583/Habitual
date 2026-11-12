export async function authRequest(path, options = {}) {
  const response = await fetch(`/api/auth/${path}`, {
    credentials: 'same-origin',
    ...options,
  });

  if (path === 'me' && response.status === 401) return null;
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Unable to reach the server. Please try again.');
  if (!data) throw new Error('The server returned an invalid response. Please try again.');
  return data;
}
