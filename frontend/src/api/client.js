const RAW_BASE = (import.meta.env.VITE_API_URL || '').trim();
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;
const AUTH_TOKEN_KEY = 'mes_auth_token';

let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || null;

export function getStoredAuthToken() {
  return authToken;
}

export function storeAuthToken(token) {
  authToken = token || null;
  if (authToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearStoredAuthToken() {
  storeAuthToken(null);
}

async function request(path, options = {}) {
  const mergedHeaders = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    mergedHeaders.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: mergedHeaders,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const loginUser = (data) => request('/api/auth/login', { method: 'POST', body: data });
export const getCurrentUser = () => request('/api/auth/me');

// Lines
export const getLines            = ()          => request('/api/lines');
export const getLineWithProcesses= (id)        => request(`/api/lines/${id}/processes`);
export const createLine          = (data)      => request('/api/lines',    { method: 'POST', body: data });
export const updateLine          = (id, data)  => request(`/api/lines/${id}`, { method: 'PUT', body: data });
export const deleteLine          = (id)        => request(`/api/lines/${id}`, { method: 'DELETE' });

// Processes
export const getProcesses  = (lineId)     => request(`/api/processes${lineId ? `?line_id=${lineId}` : ''}`);
export const createProcess = (data)       => request('/api/processes',     { method: 'POST', body: data });
export const updateProcess = (id, data)   => request(`/api/processes/${id}`, { method: 'PUT', body: data });
export const deleteProcess = (id)         => request(`/api/processes/${id}`, { method: 'DELETE' });

// Trays
export const getTrays      = ()          => request('/api/trays');
export const getTrayStats  = ()          => request('/api/trays/stats');
export const scanTray      = (qr)        => request(`/api/trays/scan/${encodeURIComponent(qr)}`);
export const createTray = (data)      => request('/api/trays',       { method: 'POST',   body: data });
export const updateTray = (id, data)  => request(`/api/trays/${id}`, { method: 'PUT',    body: data });
export const deleteTray = (id)        => request(`/api/trays/${id}`, { method: 'DELETE' });

// Logs
export const getLogs        = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/logs${qs ? `?${qs}` : ''}`);
};
export const createLog      = (data) => request('/api/logs', { method: 'POST', body: data });
export const updateLog      = (id, data) => request(`/api/logs/${id}`, { method: 'PUT',    body: data });
export const deleteLog      = (id)       => request(`/api/logs/${id}`, { method: 'DELETE' });
export const getLogsSummary = ()     => request('/api/logs/summary');

// Operators
export const getOperators    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/operators${qs ? `?${qs}` : ''}`);
};
export const createOperator  = (data)     => request('/api/operators',      { method: 'POST', body: data });
export const updateOperator  = (id, data) => request(`/api/operators/${id}`, { method: 'PUT',  body: data });
export const deleteOperator  = (id)       => request(`/api/operators/${id}`, { method: 'DELETE' });

// Users
export const getUsers        = ()         => request('/api/users');
export const createUser      = (data)     => request('/api/users', { method: 'POST', body: data });
export const updateUser      = (id, data) => request(`/api/users/${id}`, { method: 'PUT', body: data });
export const deleteUser      = (id)       => request(`/api/users/${id}`, { method: 'DELETE' });
