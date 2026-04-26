import { tailoredResumeJsonToFlowCvPersonalDetails } from "./personalDetailsMapper.js";
import { tailoredResumeJsonToFlowCvProfileSaveBody } from "./profileEntryMapper.js";
import { tailoredResumeJsonToFlowCvSkillSaveBodies } from "./skillEntryMapper.js";
import { tailoredResumeJsonToFlowCvWorkSaveBodies } from "./workEntryMapper.js";
import { saveFlowCvPersonalDetails } from "./savePersonalDetails.js";
import { saveFlowCvEntry } from "./saveEntry.js";
import { with401Retry } from "./flowCvWith401Retry.js";
import {
  ensureFlowCvPersonalDetailsTemplate,
  ensureFlowCvSession,
  getFlowCvActiveResumeId,
  getFlowCvCookie,
} from "./session.js";
import { downloadFlowCvResumePdf } from "./downloadResumePdf.js";

/**
 * Sync tailored JSON to FlowCV (no Impact / custom1). Then download PDF.
 * Never throws — returns a result for API responses.
 *
 * @param {Record<string, unknown>} tailoredResumeJson
 * @returns {Promise<{ ok?: true, pdfBase64?: string, pdfContentType?: string, error?: string }>}
 */
export async function syncRetailorJsonToFlowCvAndDownload(tailoredResumeJson) {
  try {
    await ensureFlowCvSession();
    const cookie = getFlowCvCookie();
    if (!cookie) {
      throw new Error("No FlowCV session cookie; sign in for this profile first");
    }

    await ensureFlowCvPersonalDetailsTemplate();

    const resumeId = getFlowCvActiveResumeId();
    if (!resumeId) {
      throw new Error(
        "No FlowCV resume id. Set active resume via POST /api/flowcv/active-resume or sign in again.",
      );
    }

    const personalDetails = tailoredResumeJsonToFlowCvPersonalDetails(
      tailoredResumeJson,
    );
    const profileBody = tailoredResumeJsonToFlowCvProfileSaveBody(
      tailoredResumeJson,
    );

    await with401Retry(async (c) => {
      await saveFlowCvPersonalDetails({ resumeId, personalDetails, cookie: c });
    });

    await with401Retry(async (c) => {
      await saveFlowCvEntry({
        resumeId: profileBody.resumeId,
        sectionId: profileBody.sectionId,
        entry: profileBody.entry,
        cookie: c,
      });
    });

    const skillBodies = tailoredResumeJsonToFlowCvSkillSaveBodies(
      tailoredResumeJson,
    );
    for (const body of skillBodies) {
      await with401Retry(async (c) => {
        await saveFlowCvEntry({
          resumeId: body.resumeId,
          sectionId: body.sectionId,
          entry: body.entry,
          cookie: c,
        });
      });
    }

    const workBodies = tailoredResumeJsonToFlowCvWorkSaveBodies(
      tailoredResumeJson,
    );
    for (const body of workBodies) {
      await with401Retry(async (c) => {
        await saveFlowCvEntry({
          resumeId: body.resumeId,
          sectionId: body.sectionId,
          entry: body.entry,
          cookie: c,
        });
      });
    }

    const pdf = await with401Retry(async (c) => {
      return await downloadFlowCvResumePdf({
        resumeId,
        previewPageCount: 2,
        cookie: c,
      });
    });

    return {
      ok: true,
      pdfContentType: pdf.contentType,
      pdfBase64: pdf.buffer.toString("base64"),
    };
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      String(err);
    return { ok: false, error: message };
  }
}
