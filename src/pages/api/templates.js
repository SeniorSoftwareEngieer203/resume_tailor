// Template list - maps to React PDF components
// All templates will use React PDF renderer
const TEMPLATE_LIST = [
  { id: "Resume", name: "Classic (Default)" },
  { id: "Resume-Academic-Purple", name: "Academic Purple" },
  { id: "Resume-Bold-Emerald", name: "Bold Emerald" },
  { id: "Resume-Classic-Charcoal", name: "Classic Charcoal" },
  { id: "Resume-Consultant-Steel", name: "Consultant Steel" },
  { id: "Resume-Corporate-Slate", name: "Corporate Slate" },
  { id: "Resume-Creative-Burgundy", name: "Creative Burgundy" },
  { id: "Resume-Executive-Navy", name: "Executive Navy" },
  { id: "Resume-Modern-Green", name: "Modern Green" },
  { id: "Resume-Tech-Teal", name: "Tech Teal" },
];

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  try {
    // Return template list sorted so default is first, then alphabetically
    const templates = TEMPLATE_LIST.sort((a, b) => {
      if (a.id === "Resume") return -1;
      if (b.id === "Resume") return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json(templates);
  } catch (error) {
    console.error("Error loading templates:", error);
    res.status(500).json({ error: "Failed to load templates" });
  }
}

