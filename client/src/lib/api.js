export const TOKEN_KEY = 'aptilearn:token';
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// Add the base URL pointing to your Render backend when deployed, 
// and default to empty string ('') for local development.
const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    // Prepend BASE to the path so it reaches your live Render server
    res = await fetch(BASE + path, { 
      method, 
      headers: { 
        'Content-Type': 'application/json', 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      }, 
      body: body === undefined ? undefined : JSON.stringify(body) 
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the AptiLearn server is running.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/api/auth/')) onUnauthorized();
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}