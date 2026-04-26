import { flowCvNowIso } from "./config.js";
import { getFlowCvActiveResumeId, getFlowCvResumeContent } from "./session.js";
import { escapeFlowCvPlainText } from "./profileEntryMapper.js";

function getWorkEntryFixedList() {
  const content = getFlowCvResumeContent();
  const entries = content?.work?.entries;
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => ({
      id: String(e?.id || ""),
      employer: String(e?.employer ?? ""),
      jobTitle: String(e?.jobTitle ?? ""),
      location: String(e?.location ?? ""),
      employerLink: String(e?.employerLink ?? ""),
      startDateNew: String(e?.startDateNew ?? ""),
      endDateNew: String(e?.endDateNew ?? ""),
      isHidden: Boolean(e?.isHidden),
      createdAt: String(e?.createdAt || ""),
      showPlaceholder: Boolean(e?.showPlaceholder),
    }))
    .filter((row) => row.id);
}

/**
 * @param {string} bulletsText
 */
export function bulletsTextToFlowCvUlHtml(bulletsText) {
  const raw = String(bulletsText || "").trim();
  if (!raw) return "<ul></ul>";

  const items = raw.split(/\r?\n/).map((s) => {
    let html = escapeFlowCvPlainText(s.trim());
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return `<li><p>${html}</p></li>`;
  });

  return `<ul>${items.join("")}</ul>`;
}

/**
 * @param {Record<string, unknown>} tailoredResumeJson
 * @returns {Array<{ resumeId: string, sectionId: string, entry: object }>}
 */
export function tailoredResumeJsonToFlowCvWorkSaveBodies(tailoredResumeJson) {
  const json =
    tailoredResumeJson && typeof tailoredResumeJson === "object"
      ? tailoredResumeJson
      : {};
  const blocks = Array.isArray(json.workExperienceBulletsOnly)
    ? json.workExperienceBulletsOnly
    : [];

  const fixedList = getWorkEntryFixedList();
  const bodies = [];
  for (let i = 0; i < fixedList.length; i++) {
    const fixed = fixedList[i];
    const bulletsText = blocks[i] ? String(blocks[i]) : "";
    const hasContent = Boolean(String(bulletsText || "").trim());

    bodies.push({
      resumeId: getFlowCvActiveResumeId(),
      sectionId: "work",
      entry: {
        ...fixed,
        jobTitle: tailoredResumeJson?.roles?.[i] || "",
        description: hasContent
          ? bulletsTextToFlowCvUlHtml(bulletsText)
          : "<ul></ul>",
        isHidden: fixed.isHidden === true ? true : hasContent ? false : true,
        updatedAt: flowCvNowIso(),
      },
    });
  }

  return bodies;
}
