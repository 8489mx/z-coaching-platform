// P2-C7: pure notification access rules (no database import, runnable under plain node).
// Ownership rule (non-negotiable): a client-scoped notification endpoint serves
// ONLY the owning client. ADMIN/COACH bypass applies ONLY on admin routes
// (e.g. /history), never on client-scoped routes (stream, client read, mark-read).

/**
 * Whether the requester may access notifications addressed to `requestedCode`.
 * requester: { userId, clientCode, role }. requestedCode: the client code from
 * the URL path or request body. A client may use either their client_code or
 * their numeric user id as the address, because both are used as inbox keys.
 */
export function canAccessClientNotifications(requester, requestedCode) {
  if (!requester || requestedCode === undefined || requestedCode === null) return false;
  const wanted = String(requestedCode).trim();
  if (!wanted) return false;
  if (requester.clientCode && String(requester.clientCode).trim() === wanted) return true;
  if (requester.userId !== undefined && requester.userId !== null && String(requester.userId) === wanted) return true;
  return false;
}

/**
 * SSE origin decision for a browser Origin header.
 * Returns { allowed: boolean, echoOrigin: string|null }.
 * - No Origin header (mobile apps, curl): allowed, no header to echo.
 * - localhost / loopback / *.local / same host as the server: allowed, echo it.
 * - Anything else: NOT allowed (the route must answer 403, fail closed).
 * This mirrors the server's trusted-origin rules without importing the
 * CSRF middleware (which pulls in the database-backed audit log).
 */
export function resolveSseOrigin(originHeader, hostHeader) {
  if (!originHeader) return { allowed: true, echoOrigin: null };
  let originUrl;
  try {
    originUrl = new URL(originHeader);
  } catch {
    return { allowed: false, echoOrigin: null };
  }
  const hostname = originUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  ) {
    return { allowed: true, echoOrigin: originHeader };
  }
  if (hostHeader) {
    const hostClean = hostHeader.split(":")[0].toLowerCase();
    if (hostname === hostClean) return { allowed: true, echoOrigin: originHeader };
  }
  return { allowed: false, echoOrigin: null };
}

/**
 * Map a legacy JSON notification row (pre-C7 file store) to a new inbox row.
 * Pure mapping used by the migration; never invents values — rows without a
 * usable client code or title are skipped by the caller (returns null).
 */
export function mapLegacyNotificationRow(row) {
  if (!row || typeof row !== "object") return null;
  const clientCode = row.client_code !== undefined && row.client_code !== null
    ? String(row.client_code).trim()
    : "";
  const title = row.title !== undefined && row.title !== null ? String(row.title) : "";
  if (!clientCode || !title) return null;
  return {
    client_code: clientCode,
    title,
    body: row.body !== undefined && row.body !== null ? String(row.body) : "",
    type: row.payload && typeof row.payload.type === "string" ? row.payload.type : "GENERAL",
    payload: row.payload && typeof row.payload === "object" ? row.payload : {},
    is_read: row.is_read === true,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
  };
}
