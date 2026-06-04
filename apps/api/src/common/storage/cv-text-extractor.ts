import { Logger } from "@nestjs/common";
import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";

const logger = new Logger("CvTextExtractor");

const MAX_CHARS = 20_000;

/**
 * Extracts plain text from an uploaded CV buffer (PDF or DOCX).
 * Never throws: on failure it logs and returns an empty string so the upload
 * flow continues even if extraction is not possible.
 */
export async function extractCvText(buffer: Buffer, fileName: string): Promise<string> {
  const name = (fileName || "").toLowerCase();
  try {
    if (name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return normalize(result.text);
      } finally {
        await parser.destroy();
      }
    }
    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      return normalize(result.value);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to extract text from "${fileName}": ${message}`);
  }
  return "";
}

function normalize(text: string): string {
  return (text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARS);
}
