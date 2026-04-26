import { flowCvLogin } from "./auth.js";
import { fetchFlowCvResumesAll } from "./fetchResumesAll.js";
import { flowCvRequestContext } from "./flowCvRequestContext.js";
import { clearSession } from "./profileSessionStore.js";

function clonePlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function resumeContentHasProfile(content) {
  return Boolean(
    content &&
      typeof content === "object" &&
      Array.isArray(content.profile?.entries) &&
      content.profile.entries.length > 0,
  );
}

export function getFlowCvActiveResumeId() {
  const incoming = flowCvRequestContext.getStore();
  return String(incoming?.resumeId || "").trim();
}

export function getFlowCvPersonalDetailsTemplate() {
  const incoming = flowCvRequestContext.getStore();
  if (incoming?.personalDetails && typeof incoming.personalDetails === "object") {
    return clonePlain(incoming.personalDetails);
  }
  return null;
}

export function getFlowCvResumeContent() {
  const incoming = flowCvRequestContext.getStore();
  if (incoming?.resumeContent && typeof incoming.resumeContent === "object") {
    return clonePlain(incoming.resumeContent);
  }
  return null;
}

export function setFlowCvActiveResumeId(resumeId) {
  const id = String(resumeId || "").trim();
  if (!id) throw new Error("resumeId is required");
  const incoming = flowCvRequestContext.getStore();
  if (!incoming) {
    throw new Error("FlowCV request context is not available");
  }
  incoming.resumeId = id;
}

export async function syncActiveResumeFromFlowCvApi() {
  const incoming = flowCvRequestContext.getStore();
  if (!incoming) return;
  const cookie = getFlowCvCookie();
  if (!cookie) return;
  try {
    const body = await fetchFlowCvResumesAll({ cookie });
    const resumes = body?.data?.resumes;
    if (!Array.isArray(resumes) || resumes.length === 0) {
      return;
    }
    const wanted = String(incoming.resumeId || "").trim();
    let target = resumes[0];
    if (wanted) {
      const found = resumes.find((r) => String(r?.id || "").trim() === wanted);
      if (found) target = found;
    }
    const rid = String(target?.id || "").trim();
    if (!rid) return;
    incoming.resumeId = rid;
    const pd = target?.personalDetails;
    if (pd && typeof pd === "object") {
      incoming.personalDetails = clonePlain(pd);
    }
    const content = target?.content;
    if (content && typeof content === "object") {
      incoming.resumeContent = clonePlain(content);
    }
  } catch (err) {
    console.warn(
      "[FlowCV] Could not sync resume snapshot from resumes/all:",
      err?.message || err,
    );
  }
}

export async function ensureFlowCvPersonalDetailsTemplate() {
  if (
    getFlowCvPersonalDetailsTemplate() &&
    resumeContentHasProfile(getFlowCvResumeContent())
  ) {
    return;
  }
  await syncActiveResumeFromFlowCvApi();
}

export function getFlowCvCookie() {
  const incoming = flowCvRequestContext.getStore();
  return incoming?.sessionCookie || "";
}

export function getFlowCvSessionInfo() {
  const incoming = flowCvRequestContext.getStore();
  if (incoming?.sessionCookie) {
    return {
      connected: true,
      email: String(incoming.email || "").trim(),
      resumeId: getFlowCvActiveResumeId(),
    };
  }
  return {
    connected: false,
    email: "",
    resumeId: "",
  };
}

/**
 * @returns {Promise<{ ok: true, cookie: string, email: string } | { ok: false }>}
 */
export async function loginFlowCvSession(email, password) {
  const e = String(email ?? "").trim();
  const p = String(password ?? "");
  if (!e || !p) {
    throw new Error("Email and password are required");
  }
  const loginResult = await flowCvLogin(e, p);
  if (loginResult === false) {
    return { ok: false };
  }
  return { ok: true, email: e, cookie: loginResult.cookie };
}

export function logoutProfileFlowCvSession() {
  return { ok: true };
}

/**
 * 401: clear in-memory session for the active profile slug and throw.
 */
export async function refreshFlowCvSession() {
  const incoming = flowCvRequestContext.getStore();
  const slug = incoming?.__profileSlug;
  if (slug) {
    clearSession(String(slug));
  }
  const err = new Error(
    "FlowCV session expired. Please sign in again for this profile.",
  );
  err.code = "FLOWCV_SESSION_EXPIRED";
  throw err;
}

export async function ensureFlowCvSession() {
  const incoming = flowCvRequestContext.getStore();
  if (incoming?.sessionCookie) {
    return;
  }
  throw new Error("FlowCV session is not initialized");
}
