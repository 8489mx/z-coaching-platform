/**
 * The links a client receives in a WhatsApp message. They are built here, from the real routes in
 * App.jsx, so a message can never send a client to a path that does not exist (they used to point at
 * /app, /app/renew, /app/checkin, /renewal, /client and /checkin - none of which were routes, so
 * every one of them landed the client on the login page and lost the client code with it).
 *
 * Guarded by test/client-links-point-at-real-routes.test.js.
 */
export const CLIENT_ROUTES = Object.freeze({
  app: '/client/today',
  checkin: '/check-in',
  renewal: '/renew',
  intakeForm: '/intake/form',
  portal: '/intake',
});

function appOrigin(origin) {
  if (origin) return String(origin).replace(/\/+$/, '');
  return typeof window !== 'undefined' ? window.location.origin : '';
}

const withCode = (path, code) => {
  const clean = String(code || '').replace(/^#+/, '').trim();
  return clean ? `${path}?code=${encodeURIComponent(clean)}` : path;
};

/** The client's app, weekly check-in and renewal links; the check-in and renewal carry the client code. */
export function buildClientLinks(clientCode, origin) {
  const base = appOrigin(origin);
  return {
    app_url: `${base}${CLIENT_ROUTES.app}`,
    checkin_url: `${base}${withCode(CLIENT_ROUTES.checkin, clientCode)}`,
    renewal_url: `${base}${withCode(CLIENT_ROUTES.renewal, clientCode)}`,
  };
}
