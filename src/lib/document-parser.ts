const MAX_TEXT_LENGTH = 100_000;

// Office files (PPTX/DOCX) are ZIP containers. A ~10MB upload can inflate to
// many GB ("zip bomb") and OOM the function. Cap the total uncompressed size we
// will ever materialize, enforced both from the central-directory headers and
// against the actual inflated bytes (headers are attacker-controlled).
const MAX_DECOMPRESSED = 80 * 1024 * 1024; // 80 MB

const TOO_LARGE_MESSAGE =
  "This document is too large to process. Please upload a smaller file.";

/**
 * Open a ZIP buffer and reject decompression bombs up front by summing the
 * declared uncompressed sizes from the central directory. Returns the AdmZip
 * instance so callers can reuse it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadCheckedZip(buffer: Buffer): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(buffer);
  let total = 0;
  for (const entry of zip.getEntries() as Array<{ header?: { size?: number } }>) {
    const size = entry.header?.size ?? 0;
    total += size;
    if (size > MAX_DECOMPRESSED || total > MAX_DECOMPRESSED) {
      throw new Error(TOO_LARGE_MESSAGE);
    }
  }
  return zip;
}

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
  // unpdf handles pdfjs-dist worker setup internally — works in serverless
  const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractPdfText(pdf, { mergePages: true });
  return text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  // Guard against zip bombs before handing the buffer to mammoth (which would
  // otherwise inflate it unbounded).
  loadCheckedZip(buffer);
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractPptx(buffer: Buffer): string {
  const zip = loadCheckedZip(buffer);
  const entries = zip.getEntries();

  // Collect slide XML entries sorted by slide number
  const slideEntries = entries
    .filter((e: { entryName: string }) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a: { entryName: string }, b: { entryName: string }) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] ?? "0");
      const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] ?? "0");
      return numA - numB;
    });

  // Track actual inflated bytes as a second line of defense (the header sizes
  // checked above are attacker-controlled).
  let inflated = 0;
  const slideTexts = slideEntries.map((entry: { entryName: string; getData: () => Buffer }) => {
    const data = entry.getData();
    inflated += data.length;
    if (inflated > MAX_DECOMPRESSED) {
      throw new Error(TOO_LARGE_MESSAGE);
    }
    const xml = data.toString("utf8");
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
