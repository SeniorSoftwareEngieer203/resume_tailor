import { getSession } from "@/lib/flowcv/profileSessionStore";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const profile = String(req.query?.profile || "").trim();
  if (!profile) {
    return res.status(400).json({ error: "query ?profile= is required" });
  }
  const s = getSession(profile);
  if (s?.sessionCookie) {
    return res.status(200).json({
      connected: true,
      email: s.email || "",
      resumeId: s.resumeId || undefined,
    });
  }
  return res.status(200).json({
    connected: false,
    email: "",
    resumeId: undefined,
  });
}
