/**
 * In-memory per-profile FlowCV session (local dev).
 * Key: profile slug (e.g. "hasan"). Value: session object passed to flowCvRequestContext.
 */

const sessions = new Map();

export function getSession(slug) {
  return sessions.get(String(slug || "").trim()) || null;
}

export function setSession(slug, data) {
  const k = String(slug || "").trim();
  if (!k) return;
  sessions.set(k, data);
}

export function clearSession(slug) {
  sessions.delete(String(slug || "").trim());
}
