const MAX_TEXT_LENGTH = 100_000;

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

type SupportedMimeType = (typeof SUPPORTED_TYPES)[number];

export function isSupportedType(mimeType: string): mimeType is SupportedMimeType {
  return (SUPPORTED_TYPES as readonly string[]).includes(mimeType);
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (!isSupportedType(mimeType)) {
    throw new Error(
      "Unsupported file type. Please upload a PDF, DOCX, or PPTX file."
    );
  }

  let text: string;

  switch (mimeType) {
    case "application/pdf":
      text = await extractPdf(buffer);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await extractDocx(buffer);
      break;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      text = extractPptx(buffer);
      break;
  }

  text = text.trim();

  if (!text) {
    throw new Error(
      "Could not extract any text from the document. The file may be empty or image-only."
    );
  }

  // Truncate to stay within Claude's context limits
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  return text;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Polyfill DOMMatrix for Node.js serverless (Vercel) — pdfjs-dist requires it
  if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      is2D = true; isIdentity = true;
      constructor(init?: string | number[]) {
        if (Array.isArray(init) && init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          this.m11 = this.a; this.m12 = this.b;
          this.m21 = this.c; this.m22 = this.d;
          this.m41 = this.e; this.m42 = this.f;
          this.isIdentity = false;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  // Use pdfjs-dist legacy build directly — works in Node.js without browser APIs
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item) => "str" in item && typeof (item as { str: string }).str === "string")
        .map((item) => (item as { str: string }).str)
        .join(" ");
      pages.push(text);
    }

    return pages.join("\n\n");
  } finally {
    await doc.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractPptx(buffer: Buffer): string {
  // adm-zip is a pure JS module — safe for top-level import
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Collect slide XML entries sorted by slide number
  const slideEntries = entries
    .filter((e: { entryName: string }) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a: { entryName: string }, b: { entryName: string }) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] ?? "0");
      const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] ?? "0");
      return numA - numB;
    });

  const slideTexts = slideEntries.map((entry: { entryName: string; getData: () => Buffer }) => {
    const xml = entry.getData().toString("utf8");
    // Strip XML tags and decode common entities
    return xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  });

  return slideTexts.join("\n\n");
}
