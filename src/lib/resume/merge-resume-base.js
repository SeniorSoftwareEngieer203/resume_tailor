/**
 * Merge permanent "base" bullets and skills from profile JSON with AI-generated resume JSON.
 *
 * Profile JSON (optional):
 * - `base_skills`: **array** of lines like `"Languages: Python, JavaScript"` (first `:` splits label vs skills),
 *   OR legacy object `{ "Category": ["A","B"], ... }` (values may be comma-separated strings).
 * - Each `experience[]` entry may include `base_bullets` (alias: `base_details`): string[]
 */

function normalizeStringList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

function dedupeSkillsPreserveOrder(primary, secondary) {
  const seen = new Set();
  const out = [];
  for (const s of [...primary, ...secondary]) {
    const t = String(s).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/**
 * Normalize profile `base_skills` to a category → skills[] map for merge + PDF.
 * @param {unknown} baseSkills
 * @returns {Record<string, string[]>}
 */
export function normalizeBaseSkillsToSkillMap(baseSkills) {
  if (baseSkills == null) return {};

  if (Array.isArray(baseSkills)) {
    const out = {};
    for (const row of baseSkills) {
      const s = String(row).trim();
      if (!s) continue;
      const ci = s.indexOf(":");
      let cat;
      let rest;
      if (ci === -1) {
        cat = "Skills";
        rest = s;
      } else {
        cat = s.slice(0, ci).trim() || "Skills";
        rest = s.slice(ci + 1).trim();
      }
      const parts = rest
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (!parts.length) continue;
      if (!out[cat]) out[cat] = [];
      out[cat].push(...parts);
    }
    for (const k of Object.keys(out)) {
      out[k] = dedupeSkillsPreserveOrder(out[k], []);
    }
    return out;
  }

  if (typeof baseSkills === "object") {
    const out = {};
    for (const [k, v] of Object.entries(baseSkills)) {
      if (Array.isArray(v)) {
        out[k] = dedupeSkillsPreserveOrder(normalizeStringList(v), []);
      } else if (typeof v === "string") {
        out[k] = dedupeSkillsPreserveOrder(
          v
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          []
        );
      }
    }
    return out;
  }

  return {};
}

export function profileHasPermanentContent(profileData) {
  if (!profileData || typeof profileData !== "object") return false;
  const skillMap = normalizeBaseSkillsToSkillMap(profileData.base_skills);
  if (Object.values(skillMap).some((arr) => arr.length > 0)) return true;
  const jobs = profileData.experience;
  if (!Array.isArray(jobs)) return false;
  return jobs.some((job) => {
    const b = normalizeStringList(job?.base_bullets ?? job?.base_details);
    return b.length > 0;
  });
}

/**
 * Text block for the AI prompt: permanent bullets per role + base skills.
 */
export function formatPermanentContextForPrompt(profileData) {
  if (!profileData || typeof profileData !== "object") {
    return "None — generate full skills and experience bullets from the profile and JD.";
  }

  const lines = [];
  const jobs = Array.isArray(profileData.experience)
    ? profileData.experience
    : [];

  jobs.forEach((job, idx) => {
    const bullets = normalizeStringList(job.base_bullets ?? job.base_details);
    if (bullets.length === 0) return;
    const company = job.company || `Role ${idx + 1}`;
    const title = job.title ? ` — ${job.title}` : "";
    lines.push(`**${company}${title}**`);
    bullets.forEach((b) => lines.push(`- ${b}`));
    lines.push("");
  });

  const skillMap = normalizeBaseSkillsToSkillMap(profileData.base_skills);
  const skillEntries = Object.entries(skillMap).filter(([, arr]) => arr.length > 0);
  if (skillEntries.length > 0) {
    lines.push("**Base skill groups (always kept on the resume):**");
    for (const [cat, arr] of skillEntries) {
      lines.push(`- **${cat}:** ${arr.join(", ")}`);
    }
    lines.push("");
  }

  if (lines.length === 0) {
    return "None — generate full skills and experience bullets from the profile and JD.";
  }

  return (
    lines.join("\n").trim() +
    "\n\n**Merge rules (non-negotiable):** The app **never removes** any `base_skills` line or any `base_bullets` line—they are always kept on the final resume. Your JSON must **only add**: extra skills (in `skills`) and **new** experience bullets (in `experience[].details`). Do **not** repeat permanent bullets inside `details`; do **not** delete, replace, or contradict base content."
  );
}

/**
 * Merge `profileData.base_skills` (first) with AI `skills` object by category.
 */
export function mergeBaseSkillsIntoAi(baseSkills, aiSkills) {
  const base = normalizeBaseSkillsToSkillMap(baseSkills);
  const ai = aiSkills && typeof aiSkills === "object" ? aiSkills : {};
  const categories = new Set([
    ...Object.keys(base),
    ...Object.keys(ai),
  ]);
  const out = {};
  for (const cat of categories) {
    const b = normalizeStringList(base[cat]);
    const rawAi = ai[cat];
    const a = Array.isArray(rawAi)
      ? normalizeStringList(rawAi)
      : typeof rawAi === "string"
        ? rawAi
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];
    out[cat] = dedupeSkillsPreserveOrder(b, a);
  }
  return out;
}

/**
 * For each profile job, `[...base_bullets, ...ai.details]`.
 */
export function mergeExperienceDetails(profileJobs, aiExperience) {
  const jobs = Array.isArray(profileJobs) ? profileJobs : [];
  const ai = Array.isArray(aiExperience) ? aiExperience : [];
  return jobs.map((job, idx) => {
    const base = normalizeStringList(job.base_bullets ?? job.base_details);
    const fromAi = normalizeStringList(ai[idx]?.details);
    return [...base, ...fromAi];
  });
}
