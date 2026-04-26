import fs from "fs";
import path from "path";
import { getProfileBySlug } from "@/lib/profile/profile-template-mapping";
import { RESUMES_DIR } from "@/lib/server-paths";

/**
 * @param {string} profileSlug
 * @param {{ email?: string, password?: string } | null} [bodyOverride]
 * @returns {{ profileData: object, resumeName: string, email: string, password: string }}
 */
export function loadProfileWithFlowcvCredentials(profileSlug, bodyOverride) {
  const slug = String(profileSlug || "").trim();
  if (!slug) {
    throw new Error("profile slug is required");
  }
  const config = getProfileBySlug(slug);
  if (!config) {
    throw new Error(`Unknown profile: ${slug}`);
  }
  const resumeName = config.resume;
  const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile file not found: ${resumeName}.json`);
  }
  const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
  const fc = profileData?.flowcv || profileData?.flowCV;
  const email =
    (bodyOverride?.email && String(bodyOverride.email).trim()) ||
    (fc?.email && String(fc.email).trim()) ||
    "";
  const password =
    (bodyOverride?.password && String(bodyOverride.password)) ||
    (fc?.password && String(fc.password)) ||
    "";
  if (!email || !password) {
    const err = new Error(
      "FlowCV email and password are required. Add a \"flowcv\" object to this profile's JSON, or pass email and password in the request body.",
    );
    err.code = "FLOWCV_CREDENTIALS_MISSING";
    throw err;
  }
  return { profileData, resumeName, email, password };
}
