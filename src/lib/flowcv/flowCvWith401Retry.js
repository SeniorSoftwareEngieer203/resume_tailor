import { getFlowCvCookie, refreshFlowCvSession } from "./session.js";

/**
 * @template T
 * @param {(cookie: string) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function with401Retry(fn) {
  const cookie = getFlowCvCookie();
  try {
    return await fn(cookie);
  } catch (e) {
    if (e?.statusCode === 401) {
      await refreshFlowCvSession();
    }
    throw e;
  }
}
