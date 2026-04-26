import { clearSession } from "@/lib/flowcv/profileSessionStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { profile } = req.body || {};
  if (!profile) {
    return res.status(400).json({ error: "profile (slug) is required" });
  }
  clearSession(String(profile).trim());
  return res.status(200).json({ ok: true });
}
