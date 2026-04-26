import { flowCvRequestContext } from "./flowCvRequestContext.js";
import { getSession, setSession } from "./profileSessionStore.js";

/**
 * Run `fn` with FlowCV AsyncLocalStorage for this profile.
 * @template T
 * @param {string} profileSlug
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function runWithProfileContext(profileSlug, fn) {
  const slug = String(profileSlug || "").trim();
  if (!slug) {
    throw new Error("profile is required");
  }
  const session = getSession(slug);
  if (!session?.sessionCookie) {
    const e = new Error("FlowCV is not connected for this profile. Sign in first.");
    e.code = "FLOWCV_NO_SESSION";
    throw e;
  }
  session.__profileSlug = slug;
  return flowCvRequestContext.run(session, async () => {
    try {
      const result = await fn();
      return result;
    } finally {
      setSession(slug, session);
    }
  });
}
