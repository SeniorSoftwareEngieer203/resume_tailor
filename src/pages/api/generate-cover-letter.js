import fs from "fs";
import path from "path";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { callAI } from "@/lib/ai/ai-service";
import { getProfileBySlug } from "@/lib/profile/profile-template-mapping";
import { buildCoverLetterDocxBuffer } from "@/lib/cover-letter/cover-letter-docx";
import { computeCoverLetterBaseFileName } from "@/lib/cover-letter/cover-letter-files";
import { buildCoverLetterPrompt } from "@/lib/cover-letter/cover-letter-prompt";
import { parseCoverLetterParagraphs } from "@/lib/cover-letter/cover-letter-parse";
import CoverLetterPdf from "@/lib/pdf-templates/CoverLetterPdf";
import { RESUMES_DIR } from "@/lib/server-paths";

function formatWorkHistoryForPrompt(experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return "";
  }
  return experience
    .map((job, idx) => {
      const parts = [`${idx + 1}. ${job.company || "Company"}`];
      if (job.title) parts.push(job.title);
      parts.push(`${job.start_date || "?"} – ${job.end_date || "?"}`);
      return parts.join(" | ");
    })
    .join("\n");
}

function formatEducationForPrompt(education) {
  if (!Array.isArray(education) || education.length === 0) return "";
  return education
    .map(
      (e) =>
        `- ${e.degree || ""}, ${e.school || ""} (${e.start_year || ""}–${e.end_year || ""})`
    )
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const {
      profile: profileSlug,
      jd,
      companyName = null,
      targetRole = null,
      format = "pdf",
      provider = "openai",
      model = null,
    } = req.body || {};

    if (!profileSlug) return res.status(400).send("Profile slug required");
    if (!jd || !String(jd).trim()) {
      return res.status(400).send("Job description required");
    }

    const profileConfig = getProfileBySlug(profileSlug);
    if (!profileConfig) {
      return res.status(404).send(`Profile with slug "${profileSlug}" not found`);
    }

    const resumeName = profileConfig.resume;
    const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);
    if (!fs.existsSync(profilePath)) {
      return res.status(404).send(`Profile file "${resumeName}.json" not found`);
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
    const roleForLetter = (targetRole && String(targetRole).trim()) || profileData.title || "the position";

    const prompt = buildCoverLetterPrompt({
      name: profileData.name || "Candidate",
      headlineTitle: profileData.title || roleForLetter,
      roleForLetter,
      companyName: companyName && String(companyName).trim(),
      workHistoryText: formatWorkHistoryForPrompt(profileData.experience),
      educationText: formatEducationForPrompt(profileData.education),
      jd: String(jd).trim(),
    });

    const aiResponse = await callAI(prompt, provider, model, 3000, 2, 120000);
    let text = (aiResponse.content[0]?.text || "").trim();

    const lower = text.toLowerCase();
    if (
      lower.startsWith("i'm sorry") ||
      lower.startsWith("i cannot") ||
      lower.startsWith("i apologize")
    ) {
      throw new Error(
        "The model declined to write the cover letter. Try again or shorten the job description."
      );
    }

    const paragraphs = parseCoverLetterParagraphs(text);
    if (paragraphs.length < 2) {
      throw new Error(
        "Cover letter text was too short or malformed. Please try generating again."
      );
    }

    const header = {
      name: profileData.name || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
      location: profileData.location || "",
      linkedin: profileData.linkedin || "",
    };

    const baseName = computeCoverLetterBaseFileName(resumeName, companyName);
    const outFormat = format === "docx" || format === "word" ? "docx" : "pdf";

    if (outFormat === "docx") {
      const buf = await buildCoverLetterDocxBuffer({
        ...header,
        paragraphs,
      });
      const fileName = `${baseName}.docx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.end(buf);
      return;
    }

    const pdfDocument = React.createElement(CoverLetterPdf, {
      ...header,
      paragraphs,
    });
    const pdfStream = await renderToStream(pdfDocument);
    const chunks = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    const fileName = `${baseName}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.end(pdfBuffer);
  } catch (err) {
    console.error("Cover letter generation error:", err);
    res.status(500).send("Cover letter generation failed: " + err.message);
  }
}
