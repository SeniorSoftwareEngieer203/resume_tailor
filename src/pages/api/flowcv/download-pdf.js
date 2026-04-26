import { downloadFlowCvResumePdf } from "@/lib/flowcv/downloadResumePdf";
import { with401Retry } from "@/lib/flowcv/flowCvWith401Retry";
import { getSession, setSession } from "@/lib/flowcv/profileSessionStore";
import { runWithProfileContext } from "@/lib/flowcv/runWithProfileContext";
import { ensureFlowCvSession, getFlowCvCookie } from "@/lib/flowcv/session";

function firstQueryParam(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return String(v[0] ?? "").trim();
  return String(v).trim();
}

function sanitizeName(name) {
  let s = String(name || "flowcv-resume").trim() || "flowcv-resume";
  s = s.replace(/[\\/:*?"<>|\x00-\x1F]/g, "_").replace(/\s+/g, " ");
  if (!s.toLowerCase().endsWith(".pdf")) s += ".pdf";
  return s;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const profile = firstQueryParam(req.query?.profile);
  if (!profile) {
    return res.status(400).json({ error: "query ?profile= is required" });
  }

  let buffer;
  let contentType = "application/pdf";
  let filename = sanitizeName(firstQueryParam(req.query?.filename));

  try {
    await runWithProfileContext(profile, async () => {
      await ensureFlowCvSession();
      const cookie = getFlowCvCookie();
      if (!cookie) {
        const e = new Error("FlowCV session is not initialized");
        e.statusCode = 401;
        throw e;
      }
      const s = getSession(profile);
      const resumeId = String(
        firstQueryParam(req.query?.resumeId) || s?.resumeId || "",
      ).trim();
      if (!resumeId) {
        const e = new Error("resumeId is required (or sign in to set default)");
        e.statusCode = 400;
        throw e;
      }
      const previewPageCountRaw = firstQueryParam(req.query?.previewPageCount) || "2";
      const previewPageCount = Number(previewPageCountRaw);

      const pdf = await with401Retry(async (c) => {
        return await downloadFlowCvResumePdf({
          resumeId,
          previewPageCount: Number.isFinite(previewPageCount)
            ? previewPageCount
            : 2,
          cookie: c,
        });
      });
      buffer = pdf.buffer;
      contentType = pdf.contentType || "application/pdf";
    });

    const s2 = getSession(profile);
    if (s2) setSession(profile, s2);

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`,
    );
    return res.status(200).end(buffer);
  } catch (err) {
    const st = err?.statusCode >= 400 && err?.statusCode < 600 ? err.statusCode : 500;
    return res.status(st).json({
      error: err?.message || String(err),
    });
  }
}
