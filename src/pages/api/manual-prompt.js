import fs from "fs";
import path from "path";
import { getProfileBySlug } from "@/lib/profile/profile-template-mapping";
import { loadPromptForProfile } from "@/lib/resume/prompt-loader";
import {
  formatPermanentContextForPrompt,
  profileHasPermanentContent,
} from "@/lib/resume/merge-resume-base";
import { RESUMES_DIR } from "@/lib/server-paths";

/**
 * Build the full prompt for manual ChatGPT use (no API key)
 * POST body: { profile: slug, jd: job description }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { profile: profileSlug, jd } = req.body;

    if (!profileSlug) return res.status(400).json({ error: "Profile slug required" });
    if (!jd) return res.status(400).json({ error: "Job description required" });

    const profileConfig = getProfileBySlug(profileSlug);
    if (!profileConfig) {
      return res.status(404).json({ error: `Profile "${profileSlug}" not found` });
    }

    const resumeName = profileConfig.resume;
    const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: `Profile file "${resumeName}.json" not found` });
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));

    const calculateYears = (experience) => {
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
    };

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
    // const experienceBulletGuidance = hasPermanent
    //   ? "Generate **4-6 NEW** bullets per role in `experience[].details` (25-35 words each)—use **5-6** when the JD is detailed; **do not** shrink to 1-3 bullets to save tokens. These **add** to permanent base bullets (prepended automatically) so merged roles stay **JD-rich**. **Never delete or replace** base bullets or `base_skills`—only add JD-specific bullets and skills. Do **not** repeat permanent bullets in your JSON. Prioritize **work history #1** (most recent role) for the strongest JD alignment."
    //   : "Generate **6-8** bullets per role in `experience[].details` (25-35 words each)—stay at **7-8** for dense JDs; **do not** reduce counts. **Additive only:** do not remove or contradict facts from the profile work history. Put the **tightest JD match** in **work history #1** (most recent).";
    const experienceBulletGuidance = `Highlight key phrases related to the target role in both the summary and every experience bullet.
For each bullet in experience.details, include 1-2 highlighted keyword phrases using this exact style: "**key phrase**".
Bold only the phrases recruiters should notice first (impact metrics, required stack, business domain, leadership outcomes).
Do not bold only the first word of a sentence or random filler words. Bold role-relevant phrases naturally inside the sentence.
End every bullet with a period. Keep bullets detailed, specific, and strongly aligned with the job description.
For experience.title, return only the role/job title (no company name, location, dates, or separators like "|", "/", "—").`;
    const prompt = loadPromptForProfile(profileSlug, {
      name: profileData.name,
      email: profileData.email,
      location: profileData.location,
      yearsOfExperience,
      workHistory,
      education,
      jobDescription: jd,
      experienceCount: profileData.experience.length,
      resumeTitle: profileData.title || "Senior Software Engineer",
      permanentResumeContext,
      experienceBulletGuidance,
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ prompt });
  } catch (err) {
    console.error("Manual prompt error:", err);
    res.status(500).json({ error: "Failed to build prompt: " + err.message });
  }
}
