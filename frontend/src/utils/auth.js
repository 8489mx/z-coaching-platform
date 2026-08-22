const SESSION_KEY = 'antigravity_client_session_v1';

export function saveSession(client) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...client,
        logged_in_at: new Date().toISOString()
      })
    );
  }
}

export function getSession() {
  try {
    if (typeof localStorage !== 'undefined') {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function destroySession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = '/client/login';
  }
}

export function isClientLoggedIn() {
  return !!getSession();
}

export function updateClientSessionData(updates) {
  const current = getSession();
  if (current) {
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    saveSession(updated);
    return updated;
  }
  return null;
}
