import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";

export function computeResumeBaseFileName(resumeName, companyName) {
  const nameParts = resumeName ? String(resumeName).trim().split(/\s+/) : [];
  let baseName;
  if (!nameParts || nameParts.length === 0) baseName = "resume";
  else if (nameParts.length === 1) baseName = nameParts[0];
  else baseName = `${nameParts[0]}_${nameParts[nameParts.length - 1]}`;
  baseName = baseName.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "");
  if (companyName && String(companyName).trim()) {
    const sanitized = String(companyName)
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_-]/g, "");
    baseName = `${baseName}_${sanitized}`;
  }
  return baseName;
}

function safeStr(v) {
  if (v == null) return "";
  return String(v);
}

const FONT = "Times New Roman";

/** Résumé page: A4 with ~1 cm margins (matches PDF density) */
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;

const marginTwip = convertMillimetersToTwip(MARGIN_MM);
const pageWidthTwip = convertMillimetersToTwip(PAGE_W_MM);
/** Right-aligned tab at the text-area right edge (not `TabStopPosition.MAX`, which is far too narrow). */
const RIGHT_TAB_POS = pageWidthTwip - marginTwip;

/** docx `size` is half-points */
const PT = (n) => Math.round(n * 2);

/**
 * Convert markdown bold markers (**text**) into docx TextRuns.
 * Keeps non-bold text in normal runs and bold segments in bold runs.
 */
function markdownBoldToRuns(text, base = {}) {
  const s = safeStr(text);
  if (!s) return [new TextRun({ text: "", ...base })];
  const runs = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      runs.push(
        new TextRun({
          text: s.slice(last, m.index),
          ...base,
        }),
      );
    }
    runs.push(
      new TextRun({
        text: m[1],
        bold: true,
        ...base,
      }),
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) {
    runs.push(
      new TextRun({
        text: s.slice(last),
        ...base,
      }),
    );
  }
  return runs.length ? runs : [new TextRun({ text: s, ...base })];
}

/** Prefer soft breaks inside long URLs (slashes) without splitting the label from the URL */
function softBreakUrl(url) {
  const s = safeStr(url);
  return s.replace(/\//g, "/\u200b");
}

/** Map pin — same path as `PdfIconPin` in `lib/pdf-templates/PdfIcons.js` (black ink, not emoji). */
const LOCATION_PIN_SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

/** LinkedIn wordmark (SVG for Word 2019+; 1×1 PNG fallback for older viewers) */
const LINKEDIN_SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

const TINY_PNG_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

/** Keep date ranges on one line in Word */
function singleLineDateRange(parts) {
  const p = parts.filter(Boolean).map(safeStr);
  if (p.length === 0) return "";
  if (p.length === 1) return p[0];
  return p.join("\u00a0–\u00a0");
}

const sectionRuleBorder = {
  bottom: {
    color: "000000",
    space: 1,
    style: BorderStyle.SINGLE,
    size: 6,
  },
};

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: sectionRuleBorder,
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        font: FONT,
        size: PT(10.5),
      }),
    ],
  });
}

/**
 * Build a .docx buffer from the same `templateData` shape used for React-PDF templates.
 * Matches the classic PDF style: Times, section rules, title line | dates, skills with markers.
 */
export async function buildResumeDocxBuffer(templateData) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: safeStr(templateData.name),
          bold: true,
          font: FONT,
          size: PT(22),
        }),
      ],
    })
  );

  if (templateData.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: safeStr(templateData.title),
            italics: true,
            font: FONT,
            size: PT(11),
          }),
        ],
      })
    );
  }

  /* Contact row: vector SVG icons (Buffer) for pin + LinkedIn — matches PDF artwork, not emoji fonts. */
  const gap = "   ";
  const contactRuns = [];
  let first = true;
  const pushGap = () => {
    if (!first) {
      contactRuns.push(
        new TextRun({ text: gap, font: FONT, size: PT(10) })
      );
    }
    first = false;
  };
  if (templateData.email) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u2709 ${safeStr(templateData.email)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.phone) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u260e ${safeStr(templateData.phone)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.location) {
    pushGap();
    contactRuns.push(
      new ImageRun({
        type: "svg",
        data: Buffer.from(LOCATION_PIN_SVG_MARKUP, "utf8"),
        transformation: { width: 12, height: 12 },
        fallback: {
          type: "png",
          data: TINY_PNG_PIXEL,
          transformation: { width: 12, height: 12 },
        },
        altText: {
          name: "Location",
          description: "Location",
          title: "Location",
        },
      })
    );
    contactRuns.push(
      new TextRun({
        text: `\u00a0${safeStr(templateData.location)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.linkedin) {
    pushGap();
    const u = softBreakUrl(templateData.linkedin);
    contactRuns.push(
      new ImageRun({
        type: "svg",
        data: Buffer.from(LINKEDIN_SVG_MARKUP, "utf8"),
        transformation: { width: 12, height: 12 },
        fallback: {
          type: "png",
          data: TINY_PNG_PIXEL,
          transformation: { width: 12, height: 12 },
        },
        altText: {
          name: "LinkedIn",
          description: "LinkedIn",
          title: "LinkedIn",
        },
      })
    );
    contactRuns.push(
      new TextRun({
        text: `\u00a0${u}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.website) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u2794 ${softBreakUrl(templateData.website)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }

  if (contactRuns.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contactRuns,
      })
    );
  } else {
    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  const summary = safeStr(templateData.summary).trim();
  if (summary) {
    children.push(sectionHeading("SUMMARY"));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: markdownBoldToRuns(summary, { font: FONT, size: PT(11) }),
      })
    );
  }

  const skills = templateData.skills || {};
  const skillCategories = Object.entries(skills).filter(
    ([, list]) => Array.isArray(list) && list.length > 0
  );
  if (skillCategories.length > 0) {
    children.push(sectionHeading("SKILLS"));
    for (const [category, list] of skillCategories) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "\u25B8 ",
              font: FONT,
              size: PT(10),
            }),
            new TextRun({
              text: `${safeStr(category)}: `,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
            ...markdownBoldToRuns(list.map(safeStr).join(", "), {
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );
    }
    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  const experience = templateData.experience || [];
  if (experience.length > 0) {
    children.push(sectionHeading("PROFESSIONAL EXPERIENCE"));
    for (const exp of experience) {
      const dateStr = singleLineDateRange([
        exp.start_date,
        exp.end_date,
      ].filter(Boolean));

      children.push(
        new Paragraph({
          tabStops: [
            { type: TabStopType.RIGHT, position: RIGHT_TAB_POS },
          ],
          spacing: { after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: safeStr(exp.title) || "Engineer",
              bold: true,
              font: FONT,
              size: PT(11),
            }),
            new TextRun({ text: "\t", font: FONT }),
            new TextRun({
              text: dateStr,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );

      const companyLine = [exp.company, exp.location]
        .filter(Boolean)
        .map(safeStr)
        .join(", ");
      if (companyLine) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            widowControl: true,
            children: [
              new TextRun({
                text: companyLine,
                italics: true,
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }

      for (const detail of exp.details || []) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "\u25B8 ",
                font: FONT,
                size: PT(10),
              }),
              ...markdownBoldToRuns(safeStr(detail), {
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }
      children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
    }
  }

  const education = templateData.education || [];
  if (education.length > 0) {
    children.push(sectionHeading("EDUCATION"));
    for (const edu of education) {
      const yearLeft = edu.start_year ? safeStr(edu.start_year) : "";
      const yearRight = edu.end_year ? safeStr(edu.end_year) : "";
      const yearStr = singleLineDateRange(
        yearLeft && yearRight ? [yearLeft, yearRight] : [yearLeft || yearRight]
      );

      children.push(
        new Paragraph({
          tabStops: [
            { type: TabStopType.RIGHT, position: RIGHT_TAB_POS },
          ],
          spacing: { after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: safeStr(edu.degree),
              bold: true,
              font: FONT,
              size: PT(11),
            }),
            new TextRun({ text: "\t", font: FONT }),
            new TextRun({
              text: yearStr,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );

      const schoolBits = [edu.school, edu.grade && `GPA: ${safeStr(edu.grade)}`]
        .filter(Boolean)
        .join(" • ");
      if (schoolBits) {
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            widowControl: true,
            children: [
              new TextRun({
                text: schoolBits,
                italics: true,
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    title: "Resume",
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidthTwip,
              height: convertMillimetersToTwip(PAGE_H_MM),
            },
            margin: {
              top: marginTwip,
              right: marginTwip,
              bottom: marginTwip,
              left: marginTwip,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
