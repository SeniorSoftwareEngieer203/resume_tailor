#!/usr/bin/env node
/**
 * Best-effort: fetch a public resume URL and print plain text for manual copy into
 * profile JSON (`base_skills` lines and `base_bullets`).
 *
 * FlowCV (and similar) often serve the editor behind login, or ship minimal HTML to
 * anonymous clients — this may return little more than shell/marketing text. There is
 * no official public API. Use exported PDF text, or paste resume text, when fetch fails.
 *
 * Usage:
 *   node scripts/flowcv-resume-text.mjs "https://example.com/your-public-resume"
 */

const url = process.argv[2];
if (!url || !/^https?:\/\//i.test(url)) {
  console.error('Usage: node scripts/flowcv-resume-text.mjs "<url>"');
  process.exit(1);
}

const res = await fetch(url, {
  redirect: "follow",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  },
});

const html = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const stripped = html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .replace(/[ \t]{2,}/g, " ")
  .trim();

console.log(stripped.slice(0, 40000));
