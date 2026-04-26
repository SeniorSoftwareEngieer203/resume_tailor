import { getFlowCvActiveResumeId, getFlowCvResumeContent } from "./session.js";
import { flowCvNowIso } from "./config.js";

function getProfileEntryShell() {
  const content = getFlowCvResumeContent();
  const entry0 = content?.profile?.entries?.[0];
  if (!entry0 || typeof entry0 !== "object") {
    return {
      id: "",
      isHidden: false,
      createdAt: "",
      showPlaceholder: false,
    };
  }
  return {
    id: String(entry0.id || ""),
    isHidden: Boolean(entry0.isHidden),
    createdAt: String(entry0.createdAt || ""),
    showPlaceholder: Boolean(entry0.showPlaceholder),
  };
}

function escapeFlowCvPlainText(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyMarkdownBoldToHtml(text) {
  return String(text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function descriptionToFlowCvHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) return "<p></p>";
  let s = escapeFlowCvPlainText(raw);
  s = applyMarkdownBoldToHtml(s);
  return `<p>${s.replace(/\n/g, "<br>")}</p>`;
}

function summaryToFlowCvHtml(summary) {
  const raw = String(summary || "").trim();
  if (!raw) return "<p></p>";

  let s = escapeFlowCvPlainText(raw);
  s = applyMarkdownBoldToHtml(s);

  const blocks = s
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return "<p></p>";

  return blocks
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * @param {Record<string, unknown>} tailoredResumeJson
 */
export function tailoredResumeJsonToFlowCvProfileSaveBody(tailoredResumeJson) {
  const json =
    tailoredResumeJson && typeof tailoredResumeJson === "object"
      ? tailoredResumeJson
      : {};
  const summary = /** @type {string} */ (json.summary || "");

  return {
    resumeId: getFlowCvActiveResumeId(),
    sectionId: "profile",
    entry: {
      ...getProfileEntryShell(),
      text: summaryToFlowCvHtml(summary),
      updatedAt: flowCvNowIso(),
    },
  };
}

export { escapeFlowCvPlainText, descriptionToFlowCvHtml, summaryToFlowCvHtml };
