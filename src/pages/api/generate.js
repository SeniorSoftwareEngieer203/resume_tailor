import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { getTemplate } from "@/lib/pdf-templates";
import {
  getTemplateForProfile,
  getProfileBySlug,
} from "@/lib/profile/profile-template-mapping";
import {
  buildResumeDocxBuffer,
  computeResumeBaseFileName,
} from "@/lib/resume/resume-to-docx";
import { tailorProfileJdToTemplateData } from "@/lib/resume/tailorToTemplateData";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const {
      profile: profileSlug,
      jd,
      template,
      provider = "openai",
      model = null,
      companyName = null,
      format = "pdf",
    } = req.body;

    if (!profileSlug) return res.status(400).send("Profile slug required");
    if (!jd) return res.status(400).send("Job description required");

    const profileConfig = getProfileBySlug(profileSlug);
    if (!profileConfig) {
      return res
        .status(404)
        .send(`Profile with slug "${profileSlug}" not found`);
    }

    if (!["claude", "openai"].includes(provider)) {
      return res
        .status(400)
        .send(`Unsupported provider: ${provider}. Supported: claude, openai`);
    }

    const templateName =
      template || getTemplateForProfile(profileSlug) || "Resume";

    const { templateData, resumeName } = await tailorProfileJdToTemplateData({
      profileSlug,
      jd,
      provider,
      model,
    });

    console.log(`Using template: ${templateName}`);

    const baseName = computeResumeBaseFileName(resumeName, companyName);
    const outFormat =
      format === "docx" || format === "word" ? "docx" : "pdf";

    if (outFormat === "docx") {
      const docxBuffer = await buildResumeDocxBuffer(templateData);
      const fileName = `${baseName}.docx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.end(docxBuffer);
      return;
    }

    const TemplateComponent = getTemplate(templateName);

    if (!TemplateComponent) {
      return res.status(404).send(`Template "${templateName}" not found`);
    }

    const pdfDocument = React.createElement(TemplateComponent, {
      data: templateData,
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
    console.error("PDF generation error:", err);
    res.status(500).send("PDF generation failed: " + err.message);
  }
}
