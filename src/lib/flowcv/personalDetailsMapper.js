import { getFlowCvPersonalDetailsTemplate } from "./session.js";

function clonePlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function emptyPersonalDetailsShape() {
  return {
    phone: "",
    photo: {},
    social: {
      linkedIn: {
        link: "",
        display: "",
      },
    },
    address: "",
    fullName: "",
    jobTitle: "",
    usAddress: false,
    detailsOrder: ["displayEmail", "phone", "address", "linkedIn"],
    displayEmail: "",
    showPlaceholder: false,
  };
}

function stripBoldMarkers(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .trim();
}

/**
 * @param {Record<string, unknown>} tailoredResumeJson
 */
export function tailoredResumeJsonToFlowCvPersonalDetails(tailoredResumeJson) {
  const json =
    tailoredResumeJson && typeof tailoredResumeJson === "object"
      ? tailoredResumeJson
      : {};
  const title = /** @type {string} */ (json.title || "");

  const base = getFlowCvPersonalDetailsTemplate() || emptyPersonalDetailsShape();
  const out = clonePlain(base);

  out.jobTitle = stripBoldMarkers(title);

  if (!out.social) out.social = {};
  if (!out.social.linkedIn) {
    out.social.linkedIn = { link: "", display: "" };
  } else {
    out.social.linkedIn = { ...out.social.linkedIn };
  }

  if (!Array.isArray(out.detailsOrder)) {
    out.detailsOrder = ["displayEmail", "phone", "address", "linkedIn"];
  } else {
    out.detailsOrder = [...out.detailsOrder];
  }

  return out;
}
