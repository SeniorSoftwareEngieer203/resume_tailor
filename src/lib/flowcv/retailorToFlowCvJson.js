/**
 * Build the shape expected by FlowCV mappers from merged template data
 * (same structure as in api/generate after merge).
 *
 * @param {object} templateData
 * @param {object} resumeContent - raw AI JSON (for tailored job title)
 */
export function templateDataToFlowCvTailoredJson(templateData, resumeContent) {
  const rc = resumeContent && typeof resumeContent === "object" ? resumeContent : {};
  const titleForJob = String(
    (rc.title != null && String(rc.title).trim()
      ? rc.title
      : templateData?.title) || " ",
  ).trim();

  const skills =
    templateData?.skills && typeof templateData.skills === "object"
      ? templateData.skills
      : {};

  const workExperienceBulletsOnly = (templateData.experience || []).map(
    (job) => {
      const d = job?.details;
      if (!Array.isArray(d)) return "";
      return d
        .map((x) => String(x).trim())
        .filter(Boolean)
        .join("\n");
    },
  );
  const roles = templateData?.experience?.map((job) => job?.title);

  return {
    title: titleForJob || " ",
    summary: String(templateData?.summary || ""),
    coreTechnologies: skills,
    roles,
    workExperienceBulletsOnly,
  };
}
