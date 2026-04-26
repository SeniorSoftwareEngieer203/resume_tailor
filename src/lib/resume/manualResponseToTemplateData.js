import fs from "fs";
import path from "path";
import {
  getTemplateForProfile,
  getProfileBySlug,
} from "@/lib/profile/profile-template-mapping";
import { RESUMES_DIR } from "@/lib/server-paths";

function normalizeExperienceTitle(rawTitle) {
  let s = String(rawTitle ?? "").trim();
  if (!s) return "Engineer";

  if (s.includes("—")) {
    s = s.split("—").pop().trim();
  }

  s = s.split("|")[0].trim();

  const slashParts = s.split("/");
  if (slashParts.length > 1) {
    const rhs = slashParts.slice(1).join("/").trim();
    if (
      /(^remote$)|,|\b\d{1,2}\/\d{4}\b|\b\d{4}\b/i.test(rhs)
    ) {
      s = slashParts[0].trim();
    }
  }

  s = s.replace(/\b\d{1,2}\/\d{4}\b.*$/i, "").trim();
  s = s.replace(/\s{2,}/g, " ").trim();
  return s || "Engineer";
}

/**
 * Parse pasted JSON response and build templateData for manual mode.
 *
 * @param {object} opts
 * @param {string} opts.profileSlug
 * @param {string} opts.rawResponse
 * @returns {{ resumeContent: object, templateData: object, resumeName: string, templateName: string }}
 */
export function manualResponseToTemplateData({ profileSlug, rawResponse }) {
  if (!profileSlug) throw new Error("Profile slug required");
  if (!rawResponse || typeof rawResponse !== "string") {
    throw new Error("ChatGPT response (JSON) required");
  }

  const profileConfig = getProfileBySlug(profileSlug);
  if (!profileConfig) {
    throw new Error(`Profile "${profileSlug}" not found`);
  }

  const resumeName = profileConfig.resume;
  const templateName = getTemplateForProfile(profileSlug) || "Resume";
  const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile file "${resumeName}.json" not found`);
  }

  const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));

  let content = rawResponse.trim();
  content = content.replace(/```json\s*/gi, "");
  content = content.replace(/```javascript\s*/gi, "");
  content = content.replace(/```\s*/g, "");
  content = content.replace(/^(here is|here's|this is|the json is):?\s*/gi, "");

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  } else {
    throw new Error(
      "No JSON object found. Please paste the full JSON from ChatGPT.",
    );
  }

  content = content.trim();

  let resumeContent;
  try {
    resumeContent = JSON.parse(content);
  } catch (parseError) {
    try {
      const fixedContent = content.replace(/,(\s*[}\]])/g, "$1");
      resumeContent = JSON.parse(fixedContent);
    } catch {
      throw new Error(
        `Invalid JSON: ${parseError.message}. Check the pasted response.`,
      );
    }
  }

  if (
    !resumeContent.title ||
    !resumeContent.summary ||
    !resumeContent.skills ||
    !resumeContent.experience
  ) {
    throw new Error(
      "Missing required fields (title, summary, skills, or experience). Ensure ChatGPT returned the full JSON.",
    );
  }

  const aiExperience = Array.isArray(resumeContent.experience)
    ? resumeContent.experience
    : [];
  const experienceFromAi = aiExperience.map((exp) => ({
    title: normalizeExperienceTitle(exp?.title),
    company: String(exp?.company ?? "").trim(),
    location: String(exp?.location ?? "").trim(),
    start_date: String(exp?.start_date ?? "").trim(),
    end_date: String(exp?.end_date ?? "").trim(),
    details: Array.isArray(exp?.details)
      ? exp.details.map((d) => String(d).trim()).filter(Boolean)
      : [],
  }));

  const templateData = {
    name: profileData.name,
    title: String(resumeContent.title ?? "").trim() || profileData.title,
    email: profileData.email,
    phone: profileData.phone,
    location: profileData.location,
    linkedin: profileData.linkedin,
    website: profileData.website,
    summary: resumeContent.summary,
    skills:
      resumeContent.skills && typeof resumeContent.skills === "object"
        ? resumeContent.skills
        : {},
    experience: experienceFromAi,
    education: profileData.education,
  };

  return {
    resumeContent,
    templateData,
    resumeName,
    templateName,
  };
}
