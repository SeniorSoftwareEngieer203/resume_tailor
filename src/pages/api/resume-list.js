import fs from "fs";
import { RESUMES_DIR } from "@/lib/server-paths";

export default function handler(req, res) {
  const resumesDir = RESUMES_DIR;
  const files = fs.readdirSync(resumesDir).filter(f => f.endsWith(".json"));
  const names = files.map(f => f.replace(".json", ""));
  res.status(200).json(names);
}
