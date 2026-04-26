import { flowCvRequestContext } from "@/lib/flowcv/flowCvRequestContext";
import { setSession } from "@/lib/flowcv/profileSessionStore";
import { loginFlowCvSession, syncActiveResumeFromFlowCvApi } from "@/lib/flowcv/session";
import { loadProfileWithFlowcvCredentials } from "@/lib/flowcv/loadProfileFlowcv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { profile, email, password } = req.body || {};
    if (!profile) {
      return res.status(400).json({ error: "profile (slug) is required" });
    }

    const { email: resolvedEmail, password: resolvedPassword } =
      loadProfileWithFlowcvCredentials(profile, { email, password });

    const loginOutcome = await loginFlowCvSession(
      resolvedEmail,
      resolvedPassword,
    );
    if (!loginOutcome.ok) {
      return res.status(401).json({ error: "FlowCV login failed" });
    }

    const store = {
      __profileSlug: String(profile).trim(),
      sessionCookie: loginOutcome.cookie,
      email: loginOutcome.email,
      resumeId: "",
      personalDetails: null,
      resumeContent: null,
    };
    await flowCvRequestContext.run(store, async () => {
      await syncActiveResumeFromFlowCvApi();
    });
    setSession(store.__profileSlug, store);

    return res.status(200).json({
      ok: true,
      email: store.email,
      resumeId: store.resumeId || undefined,
    });
  } catch (e) {
    if (e.code === "FLOWCV_CREDENTIALS_MISSING") {
      return res
        .status(400)
        .json({ error: e.message, code: e.code });
    }
    return res
      .status(500)
      .json({ error: e?.message || String(e) });
  }
}
