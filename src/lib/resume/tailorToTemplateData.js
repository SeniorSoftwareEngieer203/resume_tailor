import fs from "fs";
import path from "path";
import { callAI } from "@/lib/ai/ai-service";
import {
  getTemplateForProfile,
  getProfileBySlug,
} from "@/lib/profile/profile-template-mapping";
import { loadPromptForProfile } from "@/lib/resume/prompt-loader";
import {
  formatPermanentContextForPrompt,
  profileHasPermanentContent,
} from "@/lib/resume/merge-resume-base";
import { RESUMES_DIR } from "@/lib/server-paths";

function calculateYears(experience) {
  if (!experience || experience.length === 0) return 0;
  const parseDate = (dateStr) => {
    if (dateStr.toLowerCase() === "present") return new Date();
    return new Date(dateStr);
  };
  const earliest = experience.reduce((min, job) => {
    const date = parseDate(job.start_date);
    return date < min ? date : min;
  }, new Date());
  const years = (new Date() - earliest) / (1000 * 60 * 60 * 24 * 365);
  return Math.round(years);
}

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
 * Load profile, call AI, merge with base, return the same `templateData` as /api/generate.
 *
 * @param {object} opts
 * @param {string} opts.profileSlug
 * @param {string} opts.jd
 * @param {string} [opts.provider="openai"]
 * @param {string|null} [opts.model]
 * @returns {Promise<{ templateData: object, resumeContent: object, profileData: object, templateName: string, resumeName: string }>}
 */
export async function tailorProfileJdToTemplateData({
  profileSlug,
  jd,
  provider = "openai",
  model = null,
}) {
  if (!["claude", "openai"].includes(provider)) {
    throw new Error(`Unsupported provider: ${provider}. Supported: claude, openai`);
  }
  const profileConfig = getProfileBySlug(profileSlug);
  if (!profileConfig) {
    throw new Error(`Profile with slug "${profileSlug}" not found`);
  }

  const resumeName = profileConfig.resume;
  const templateName =
    getTemplateForProfile(profileSlug) || "Resume";
  const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile file "${resumeName}.json" not found`);
  }

  const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
  const yearsOfExperience = calculateYears(profileData.experience);

  const workHistory = profileData.experience
    .map((job, idx) => {
      const parts = [`${idx + 1}. ${job.company}`];
      if (job.title) parts.push(job.title);
      if (job.location) parts.push(job.location);
      parts.push(`${job.start_date} - ${job.end_date}`);
      return parts.join(" | ");
    })
    .join("\n");

  const education = profileData.education
    .map((edu) => {
      let eduStr = `- ${edu.degree}, ${edu.school} (${edu.start_year}-${edu.end_year})`;
      if (edu.grade) eduStr += ` | GPA: ${edu.grade}`;
      return eduStr;
    })
    .join("\n");

  const hasPermanent = profileHasPermanentContent(profileData);
  const permanentResumeContext =
    formatPermanentContextForPrompt(profileData);
  const experienceBulletGuidance = hasPermanent
    ? "Generate **5-6 NEW** bullets per role in `experience[].details` (28-38 words each). Make every bullet extensive, concrete, and ATS-focused with strong action + technical context + business impact. These bullets are **additive** to permanent base bullets (prepended automatically), so do not delete/replace/rewrite base bullets or `base_skills`, and do not repeat permanent bullets. Prioritize **work history #1** (most recent role) with the strongest JD alignment and highest keyword density while staying truthful."
    : "Generate **7-9** bullets per role in `experience[].details` (28-38 words each). Make every bullet extensive, concrete, and ATS-focused with strong action + technical context + business impact. Do not reduce counts. Keep bullets highly relevant to the JD, with the strongest alignment in **work history #1** (most recent role).";
  const highlightGuidance =
    "Target a premium ATS-quality result: maximize JD-relevant keyword coverage naturally across summary, skills, and experience bullets without keyword stuffing. Highlight key phrases related to the target role in both the summary and every experience bullet. For each bullet in experience.details, include 1-2 highlighted keyword phrases using this exact style: \"**key phrase**\". Bold only the phrases recruiters should notice first (impact metrics, required stack, business domain, leadership outcomes). Do not bold only the first word of a sentence or random filler words. End every bullet with a period. In experience[].title, return only the role/job title (no company, location, dates, or separators).";

  const prompt = loadPromptForProfile(profileSlug, {
    name: profileData.name,
    email: profileData.email,
    location: profileData.location,
    yearsOfExperience: yearsOfExperience,
    workHistory: workHistory,
    education: education,
    jobDescription: jd,
    experienceCount: profileData.experience.length,
    resumeTitle: profileData.title || "Senior Software Engineer",
    permanentResumeContext,
    experienceBulletGuidance: `${experienceBulletGuidance}\n\n${highlightGuidance}`,
  });

  const aiResponse = await callAI(prompt, provider, model);

  let content;
  if (
    aiResponse.stop_reason === "max_tokens" ||
    aiResponse.stop_reason === "length"
  ) {
    const concisePrompt = prompt
      .replace(/TOTAL: 60-80 skills maximum/g, "TOTAL: 50-60 skills maximum")
      .replace(/Per category: 8-12 skills/g, "Per category: 6-10 skills")
      .replace(/6 bullets each/g, "5 bullets each")
      .replace(/5-6 bullets per job/g, "4-5 bullets per job");

    const retryResponse = await callAI(concisePrompt, provider, model);
    content = retryResponse.content[0].text.trim();
  } else {
    content = aiResponse.content[0].text.trim();
  }

  if (
    content.toLowerCase().startsWith("i'm sorry") ||
    content.toLowerCase().startsWith("i cannot") ||
    content.toLowerCase().startsWith("i apologize")
  ) {
    throw new Error(
      "AI refused to generate resume. The prompt may be too complex. Please try again with a shorter job description or simpler requirements.",
    );
  }

  content = content.replace(/```json\s*/gi, "");
  content = content.replace(/```javascript\s*/gi, "");
  content = content.replace(/```\s*/g, "");
  content = content.replace(
    /^(here is|here's|this is|the json is):?\s*/gi,
    "",
  );

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  } else {
    throw new Error("AI did not return valid JSON format. Please try again.");
  }

  content = content.trim();

  let resumeContent;
  try {
    resumeContent = JSON.parse(content);
  } catch (parseError) {
    try {
      let fixedContent = content.replace(/,(\s*[}\]])/g, "$1");
      fixedContent = fixedContent.replace(
        /([^\\])"([^",:}\]]*)":/g,
        '$1\\"$2":',
      );
      resumeContent = JSON.parse(fixedContent);
    } catch {
      throw new Error(
        `AI returned invalid JSON: ${parseError.message}. Please try again.`,
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
      "AI response missing required fields (title, summary, skills, or experience)",
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
    website: null,
    summary: resumeContent.summary,
    skills:
      resumeContent.skills && typeof resumeContent.skills === "object"
        ? resumeContent.skills
        : {},
    experience: experienceFromAi,
    education: profileData.education,
  };

  return {
    templateData,
    resumeContent,
    profileData,
    templateName,
    resumeName,
  };
}
