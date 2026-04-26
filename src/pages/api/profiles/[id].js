import fs from "fs";
import path from "path";
import { RESUMES_DIR } from "@/lib/server-paths";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Profile ID required" });
    }

    const profilePath = path.join(RESUMES_DIR, `${id}.json`);

    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
    if (profileData && typeof profileData === "object" && profileData.flowcv) {
      const fc = profileData.flowcv;
      const configured = Boolean(
        (fc.email && String(fc.email).trim()) ||
          (fc.password && String(fc.password).trim()),
      );
      profileData.flowcv = {
        email: (fc.email && String(fc.email)) || "",
        configured,
      };
    }
    res.status(200).json(profileData);
  } catch (error) {
    console.error("Error reading profile:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
}
