import { flowCvNowIso } from "./config.js";
import { getFlowCvActiveResumeId, getFlowCvResumeContent } from "./session.js";

function getSkillEntryConfigs() {
  const content = getFlowCvResumeContent();
  const entries = content?.skill?.entries;
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => ({
      id: String(e?.id || ""),
      createdAt: String(e?.createdAt || ""),
      skill: String(e?.skill ?? ""),
    }))
    .filter((c) => c.id);
}

function replaceBoldMarkers(s) {
  const text = String(s || "");
  if (text === "**") return "<strong>**</strong>";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\*\*(.+)$/, "<strong>$1</strong>")
    .replace(/^(.+?)\*\*$/, "<strong>$1</strong>");
}

function coerceTechArray(rawVal) {
  if (Array.isArray(rawVal)) {
    return rawVal.map(replaceBoldMarkers).filter(Boolean);
  }
  if (typeof rawVal === "string") {
    return rawVal.split(",").map(replaceBoldMarkers).filter(Boolean);
  }
  return [];
}

/**
 * @param {string[]} items
 */
function techSkillListToInfoHtml(items) {
  const list = (items || [])
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return "<p></p>";
  return `<p>${list.join(", ")}</p>`;
}

/**
 * @param {Record<string, unknown>} tailoredResumeJson
 */
export function tailoredResumeJsonToFlowCvSkillSaveBodies(tailoredResumeJson) {
  const json =
    tailoredResumeJson && typeof tailoredResumeJson === "object"
      ? tailoredResumeJson
      : {};
  const tech = /** @type {Record<string, unknown>} */ (
    json.coreTechnologies || {}
  );

  const configs = getSkillEntryConfigs();
  const bodies = [];

  const pairs = Object.entries(tech).filter(([k]) => k !== "_uncategorized");

  const N = pairs.length;

  for (let i = 0; i < N; i++) {
    const [jsonKey, rawVal] = pairs[i];
    const cfg = configs[i];
    if (!cfg) break;

    const arr = coerceTechArray(rawVal);
    bodies.push({
      resumeId: getFlowCvActiveResumeId(),
      sectionId: "skill",
      entry: {
        id: cfg.id,
        level: "",
        skill: jsonKey,
        infoHtml: techSkillListToInfoHtml(arr),
        isHidden: false,
        createdAt: cfg.createdAt,
        updatedAt: flowCvNowIso(),
        showPlaceholder: false,
      },
    });
  }

  for (let i = N; i < configs.length; i++) {
    const cfg = configs[i];

    bodies.push({
      resumeId: getFlowCvActiveResumeId(),
      sectionId: "skill",
      entry: {
        id: cfg.id,
        level: "",
        skill: cfg.skill || "",
        infoHtml: "<p></p>",
        isHidden: true,
        createdAt: cfg.createdAt,
        updatedAt: flowCvNowIso(),
        showPlaceholder: false,
      },
    });
  }

  return bodies;
}
