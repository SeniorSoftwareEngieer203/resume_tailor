import { templateDataToFlowCvTailoredJson } from "@/lib/flowcv/retailorToFlowCvJson";
import { runWithProfileContext } from "@/lib/flowcv/runWithProfileContext";
import { syncRetailorJsonToFlowCvAndDownload } from "@/lib/flowcv/syncRetailorToFlowCv";
import { getProfileBySlug } from "@/lib/profile/profile-template-mapping";
import { computeResumeBaseFileName } from "@/lib/resume/resume-to-docx";
import { manualResponseToTemplateData } from "@/lib/resume/manualResponseToTemplateData";

function sanitizeFilename(name) {
  let s = String(name || "resume").trim() || "resume";
  s = s.replace(/[\\/:*?"<>|\x00-\x1F]/g, "_").replace(/\s+/g, " ");
  if (!s.toLowerCase().endsWith(".pdf")) s += ".pdf";
  return s;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { profile, chatgptResponse, companyName = null } = req.body || {};

  if (!profile) {
    return res.status(400).json({ error: "profile (slug) is required" });
  }
  if (!chatgptResponse || !String(chatgptResponse).trim()) {
    return res
      .status(400)
      .json({ error: "chatgptResponse (JSON text) is required" });
  }
  if (!getProfileBySlug(String(profile).trim())) {
    return res.status(404).json({ error: `Profile "${profile}" not found` });
  }

  try {
    const { templateData, resumeContent, resumeName } =
      manualResponseToTemplateData({
        profileSlug: String(profile).trim(),
        rawResponse: String(chatgptResponse).trim(),
      });

    const tailored = templateDataToFlowCvTailoredJson(
      templateData,
      resumeContent,
    );

    const result = await runWithProfileContext(profile, async () => {
      return await syncRetailorJsonToFlowCvAndDownload(tailored);
    });

    if (!result.ok) {
      return res.status(500).json({
        error: result.error || "FlowCV sync or PDF download failed",
      });
    }

    const baseName = computeResumeBaseFileName(
      resumeName,
      companyName && String(companyName).trim()
        ? String(companyName).trim()
        : null,
    );
    const fileName = sanitizeFilename(`${baseName}.pdf`);
    const buf = Buffer.from(result.pdfBase64, "base64");

    res.setHeader("Content-Type", result.pdfContentType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).end(buf);
  } catch (e) {
    if (e.code === "FLOWCV_NO_SESSION") {
      return res.status(401).json({ error: e.message, code: e.code });
    }
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
