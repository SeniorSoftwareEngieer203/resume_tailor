import path from "path";

/** Repo root (Next.js `process.cwd()` at runtime). */
export const PROJECT_ROOT = process.cwd();

/** JSON résumé profiles (data, not bundled). */
export const RESUMES_DIR = path.join(PROJECT_ROOT, "resumes");

/** Prompt templates merged into AI résumé requests. */
export const RESUME_PROMPTS_DIR = path.join(
  PROJECT_ROOT,
  "src",
  "lib",
  "resume",
  "prompts"
);
