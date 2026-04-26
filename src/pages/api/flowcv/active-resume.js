import { fetchFlowCvResumesAll } from "@/lib/flowcv/fetchResumesAll";
import { with401Retry } from "@/lib/flowcv/flowCvWith401Retry";
import { getSession } from "@/lib/flowcv/profileSessionStore";
import { runWithProfileContext } from "@/lib/flowcv/runWithProfileContext";
import {
  ensureFlowCvSession,
  getFlowCvCookie,
  setFlowCvActiveResumeId,
  syncActiveResumeFromFlowCvApi,
} from "@/lib/flowcv/session";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const profile = String(body.profile || "").trim();
  if (!profile) {
    return res.status(400).json({ error: "profile (slug) is required" });
  }

  const directId = String(body.resumeId ?? "").trim();

  try {
    await runWithProfileContext(profile, async () => {
      await ensureFlowCvSession();
      if (!getFlowCvCookie()) {
        const e = new Error("FlowCV session is not initialized");
        e.statusCode = 401;
        throw e;
      }

      if (directId) {
        setFlowCvActiveResumeId(directId);
        await syncActiveResumeFromFlowCvApi();
        return;
      }

      const rawIdx = body.resumeIndex;
      if (rawIdx === undefined || rawIdx === null || String(rawIdx).trim() === "") {
        const e = new Error("Provide resumeId or resumeIndex");
        e.statusCode = 400;
        throw e;
      }

      const idx = Number(rawIdx);
      if (!Number.isFinite(idx) || !Number.isInteger(idx) || idx < 0) {
        const e = new Error("Invalid resumeIndex");
        e.statusCode = 400;
        throw e;
      }

      const data = await with401Retry(async (c) => {
        return await fetchFlowCvResumesAll({ cookie: c });
      });
      const resumes = data?.data?.resumes;
      if (!Array.isArray(resumes) || idx >= resumes.length) {
        const e = new Error("resumeIndex out of range");
        e.statusCode = 404;
        throw e;
      }
      const picked = String(resumes[idx]?.id || "").trim();
      if (!picked) {
        const e = new Error("Resume at index has no id");
        e.statusCode = 404;
        throw e;
      }
      setFlowCvActiveResumeId(picked);
      await syncActiveResumeFromFlowCvApi();
    });

    const s = getSession(profile);

    return res.status(200).json({
      ok: true,
      resumeId: s?.resumeId || "",
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({
      error: err?.message || String(err),
    });
  }
}
